import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'class_reminder' | 'payment' | 'message' | 'general';
  data?: Record<string, any>;
  scheduledTime?: Date;
}

class NotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return;
      }

      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('FCM Token:', this.fcmToken);

      // Store token locally
      await AsyncStorage.setItem('fcm_token', this.fcmToken);

      // Send token to backend
      await this.registerToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Create notification channels for Android
      await this.createNotificationChannels();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  private async registerToken(): Promise<void> {
    if (!this.fcmToken) return;

    try {
      await apiClient.registerPushToken({
        token: this.fcmToken,
        platform: Platform.OS,
        deviceInfo: {
          os: Platform.OS,
          version: Platform.Version,
        }
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private setupMessageHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      await this.displayLocalNotification(remoteMessage);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      await this.displayLocalNotification(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels = [
      {
        id: 'booking_reminders',
        name: 'Class Reminders',
        description: 'Notifications for upcoming classes',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
      },
      {
        id: 'messages',
        name: 'Messages',
        description: 'New messages from organizations',
        importance: AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PRIVATE,
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Payment confirmations and reminders',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PRIVATE,
      },
      {
        id: 'general',
        name: 'General',
        description: 'General notifications',
        importance: AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PUBLIC,
      },
    ];

    for (const channel of channels) {
      await notifee.createChannel(channel);
    }
  }

  private async displayLocalNotification(remoteMessage: any): Promise<void> {
    try {
      const { notification, data } = remoteMessage;
      
      await notifee.displayNotification({
        title: notification?.title || 'IH Academy',
        body: notification?.body || 'You have a new notification',
        data,
        android: {
          channelId: this.getChannelId(data?.type || 'general'),
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          actions: this.getNotificationActions(data?.type),
        },
        ios: {
          categoryId: data?.type || 'general',
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Failed to display notification:', error);
    }
  }

  private getChannelId(type: string): string {
    switch (type) {
      case 'booking':
      case 'class_reminder':
        return 'booking_reminders';
      case 'message':
        return 'messages';
      case 'payment':
        return 'payments';
      default:
        return 'general';
    }
  }

  private getNotificationActions(type: string): any[] {
    switch (type) {
      case 'booking':
        return [
          {
            title: 'View Booking',
            pressAction: { id: 'view_booking' },
          },
          {
            title: 'Cancel',
            pressAction: { id: 'cancel_booking' },
          },
        ];
      case 'message':
        return [
          {
            title: 'Reply',
            pressAction: { id: 'reply_message' },
          },
          {
            title: 'View',
            pressAction: { id: 'view_message' },
          },
        ];
      case 'payment':
        return [
          {
            title: 'Pay Now',
            pressAction: { id: 'pay_now' },
          },
          {
            title: 'View Details',
            pressAction: { id: 'view_payment' },
          },
        ];
      default:
        return [];
    }
  }

  private handleNotificationPress(remoteMessage: any): void {
    const { data } = remoteMessage;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'booking':
      case 'class_reminder':
        // Navigate to bookings screen
        // NavigationService.navigate('Bookings', { bookingId: data.bookingId });
        break;
      case 'message':
        // Navigate to messages screen
        // NavigationService.navigate('Messages', { messageId: data.messageId });
        break;
      case 'payment':
        // Navigate to payment screen
        // NavigationService.navigate('PaymentMethods');
        break;
      default:
        // Navigate to main screen
        // NavigationService.navigate('Dashboard');
        break;
    }
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<string> {
    try {
      const trigger = notification.scheduledTime
        ? {
            type: 'timestamp' as const,
            timestamp: notification.scheduledTime.getTime(),
          }
        : undefined;

      const notificationId = await notifee.createTriggerNotification(
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          android: {
            channelId: this.getChannelId(notification.type),
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            categoryId: notification.type,
            sound: 'default',
          },
        },
        trigger
      );

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getNotificationSettings(): Promise<any> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  async updateNotificationPreferences(preferences: {
    bookingReminders: boolean;
    messages: boolean;
    payments: boolean;
    general: boolean;
    reminderTime: number; // minutes before class
  }): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
      
      // Send preferences to backend
      await apiClient.updateNotificationPreferences(preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  async getNotificationPreferences(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      return stored ? JSON.parse(stored) : {
        bookingReminders: true,
        messages: true,
        payments: true,
        general: true,
        reminderTime: 30, // 30 minutes before class
      };
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        bookingReminders: true,
        messages: true,
        payments: true,
        general: true,
        reminderTime: 30,
      };
    }
  }

  async getFCMToken(): Promise<string | null> {
    return this.fcmToken;
  }

  async refreshToken(): Promise<void> {
    try {
      const newToken = await messaging().getToken();
      if (newToken !== this.fcmToken) {
        this.fcmToken = newToken;
        await AsyncStorage.setItem('fcm_token', newToken);
        await this.registerToken();
      }
    } catch (error) {
      console.error('Failed to refresh FCM token:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();