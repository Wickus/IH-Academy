import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { apiClient } from './api';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiry: number; // milliseconds
}

class OfflineService {
  private syncQueue: OfflineAction[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private cacheKey = 'offline_cache';
  private queueKey = 'sync_queue';

  async initialize(): Promise<void> {
    // Load sync queue from storage
    await this.loadSyncQueue();
    
    // Set up network listener
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      // If we just came back online, sync pending actions
      if (wasOffline && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Get initial network state
    const netState = await NetInfo.fetch();
    this.isOnline = netState.isConnected || false;

    // Start periodic sync attempts
    this.startPeriodicSync();
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.queueKey);
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startPeriodicSync(): void {
    // Attempt to sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  // Cache Management
  async cacheData(key: string, data: any, expiryMinutes: number = 60): Promise<void> {
    try {
      const cached: CachedData = {
        key,
        data,
        timestamp: Date.now(),
        expiry: expiryMinutes * 60 * 1000,
      };

      const allCached = await this.getAllCachedData();
      allCached[key] = cached;
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(allCached));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const allCached = await this.getAllCachedData();
      const cached = allCached[key];
      
      if (!cached) return null;
      
      // Check if expired
      if (Date.now() - cached.timestamp > cached.expiry) {
        await this.removeCachedData(key);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  private async getAllCachedData(): Promise<Record<string, CachedData>> {
    try {
      const stored = await AsyncStorage.getItem(this.cacheKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get all cached data:', error);
      return {};
    }
  }

  async removeCachedData(key: string): Promise<void> {
    try {
      const allCached = await this.getAllCachedData();
      delete allCached[key];
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(allCached));
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Offline Actions Queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
    };

    this.syncQueue.push(queuedAction);
    await this.saveSyncQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  private async syncPendingActions(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    console.log(`Syncing ${this.syncQueue.length} pending actions...`);

    const actions = [...this.syncQueue];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      try {
        await this.executeAction(action);
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
        console.log(`Successfully synced action: ${action.type} ${action.endpoint}`);
        
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        // Increment retry count
        const queueIndex = this.syncQueue.findIndex(a => a.id === action.id);
        if (queueIndex !== -1) {
          this.syncQueue[queueIndex].retryCount++;
          
          // Remove if max retries exceeded
          if (this.syncQueue[queueIndex].retryCount >= action.maxRetries) {
            console.error(`Max retries exceeded for action ${action.id}, removing from queue`);
            this.syncQueue.splice(queueIndex, 1);
          }
        }
      }
    }

    await this.saveSyncQueue();
    this.isSyncing = false;
    
    console.log(`Sync completed. ${this.syncQueue.length} actions remaining in queue.`);
  }

  private async executeAction(action: OfflineAction): Promise<any> {
    switch (action.type) {
      case 'CREATE':
        return await apiClient.post(action.endpoint, action.data);
      case 'UPDATE':
        return await apiClient.put(action.endpoint, action.data);
      case 'DELETE':
        return await apiClient.delete(action.endpoint);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Offline-aware API methods
  async offlineAwareRequest<T>(
    key: string,
    apiCall: () => Promise<T>,
    cacheExpiryMinutes: number = 60
  ): Promise<T> {
    if (this.isOnline) {
      try {
        const result = await apiCall();
        await this.cacheData(key, result, cacheExpiryMinutes);
        return result;
      } catch (error) {
        // If API call fails, try cache
        const cached = await this.getCachedData(key);
        if (cached) {
          console.log(`API call failed, using cached data for ${key}`);
          return cached;
        }
        throw error;
      }
    } else {
      // Offline, use cache
      const cached = await this.getCachedData(key);
      if (cached) {
        return cached;
      }
      throw new Error('No cached data available while offline');
    }
  }

  // Specific offline methods for common operations
  async getClassesOffline(organizationId: number): Promise<any[]> {
    return this.offlineAwareRequest(
      `classes_${organizationId}`,
      () => apiClient.getClasses(organizationId),
      30 // 30 minutes cache
    );
  }

  async getBookingsOffline(userId: number): Promise<any[]> {
    return this.offlineAwareRequest(
      `bookings_${userId}`,
      () => apiClient.getUserBookings(userId),
      15 // 15 minutes cache
    );
  }

  async getMessagesOffline(userId: number): Promise<any[]> {
    return this.offlineAwareRequest(
      `messages_${userId}`,
      () => apiClient.getMessages(userId),
      10 // 10 minutes cache
    );
  }

  async getProfileOffline(userId: number): Promise<any> {
    return this.offlineAwareRequest(
      `profile_${userId}`,
      () => apiClient.getUserProfile(userId),
      60 // 1 hour cache
    );
  }

  // Offline booking creation
  async createBookingOffline(bookingData: any): Promise<void> {
    if (this.isOnline) {
      try {
        await apiClient.createBooking(bookingData);
        return;
      } catch (error) {
        // Queue for later if API fails
        await this.queueAction({
          type: 'CREATE',
          endpoint: '/bookings',
          data: bookingData,
          maxRetries: 5,
        });
        throw new Error('Booking queued for when connection is restored');
      }
    } else {
      // Queue for later sync
      await this.queueAction({
        type: 'CREATE',
        endpoint: '/bookings',
        data: bookingData,
        maxRetries: 5,
      });
      throw new Error('Booking saved offline and will sync when connection is restored');
    }
  }

  // Offline message sending
  async sendMessageOffline(messageData: any): Promise<void> {
    if (this.isOnline) {
      try {
        await apiClient.sendMessage(messageData);
        return;
      } catch (error) {
        await this.queueAction({
          type: 'CREATE',
          endpoint: '/messages',
          data: messageData,
          maxRetries: 3,
        });
        throw new Error('Message queued for when connection is restored');
      }
    } else {
      await this.queueAction({
        type: 'CREATE',
        endpoint: '/messages',
        data: messageData,
        maxRetries: 3,
      });
      throw new Error('Message saved offline and will send when connection is restored');
    }
  }

  // Status methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  getPendingActionsCount(): number {
    return this.syncQueue.length;
  }

  getPendingActions(): OfflineAction[] {
    return [...this.syncQueue];
  }

  async forceSyncNow(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingActions();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: string;
    oldestItem: string | null;
    newestItem: string | null;
  }> {
    try {
      const allCached = await this.getAllCachedData();
      const items = Object.values(allCached);
      
      if (items.length === 0) {
        return {
          totalItems: 0,
          totalSize: '0 B',
          oldestItem: null,
          newestItem: null,
        };
      }

      const totalSize = JSON.stringify(allCached).length;
      const oldest = items.reduce((min, item) => 
        item.timestamp < min.timestamp ? item : min
      );
      const newest = items.reduce((max, item) => 
        item.timestamp > max.timestamp ? item : max
      );

      return {
        totalItems: items.length,
        totalSize: this.formatBytes(totalSize),
        oldestItem: new Date(oldest.timestamp).toLocaleString(),
        newestItem: new Date(newest.timestamp).toLocaleString(),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        totalSize: '0 B',
        oldestItem: null,
        newestItem: null,
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const offlineService = new OfflineService();