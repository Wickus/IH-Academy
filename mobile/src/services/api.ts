import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ApiError, AuthTokens } from '@/types';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://academy.itshappening.africa/api';

const WS_BASE_URL = __DEV__
  ? 'ws://localhost:5000'
  : 'wss://academy.itshappening.africa';

class ApiClient {
  private instance: AxiosInstance;
  private tokens: AuthTokens | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      async (config) => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh and error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.instance(originalRequest);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async loadTokensFromStorage() {
    try {
      const tokensJson = await AsyncStorage.getItem('auth_tokens');
      if (tokensJson) {
        this.tokens = JSON.parse(tokensJson);
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  private async saveTokensToStorage(tokens: AuthTokens) {
    try {
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
      this.tokens = tokens;
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        code: error.response.data?.code,
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        message: error.message || 'Unknown error',
        status: 0,
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ user: any; tokens: AuthTokens }>> {
    const response = await this.instance.post('/auth/login', credentials);
    
    if (response.data.tokens) {
      await this.saveTokensToStorage(response.data.tokens);
    }
    
    return response.data;
  }

  async register(userData: {
    username: string;
    password: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<{ user: any; tokens: AuthTokens }>> {
    const response = await this.instance.post('/auth/register', userData);
    
    if (response.data.tokens) {
      await this.saveTokensToStorage(response.data.tokens);
    }
    
    return response.data;
  }

  async refreshToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.instance.post('/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    });

    await this.saveTokensToStorage(response.data.tokens);
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens?.accessToken) {
        await this.instance.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.tokens = null;
      await AsyncStorage.removeItem('auth_tokens');
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.instance.get('/auth/me');
    return response.data;
  }

  // Organization methods
  async getMyOrganizations(): Promise<ApiResponse<any[]>> {
    const response = await this.instance.get('/organizations/my');
    return response.data;
  }

  async getOrganization(id: number): Promise<ApiResponse<any>> {
    const response = await this.instance.get(`/organizations/${id}`);
    return response.data;
  }

  async joinOrganization(inviteCode: string): Promise<ApiResponse<any>> {
    const response = await this.instance.post('/organizations/join', { inviteCode });
    return response.data;
  }

  // Classes methods
  async getClasses(organizationId?: number): Promise<ApiResponse<any[]>> {
    const params = organizationId ? { organizationId } : {};
    const response = await this.instance.get('/classes', { params });
    return response.data;
  }

  async getClass(id: number): Promise<ApiResponse<any>> {
    const response = await this.instance.get(`/classes/${id}`);
    return response.data;
  }

  async createClass(classData: any): Promise<ApiResponse<any>> {
    const response = await this.instance.post('/classes', classData);
    return response.data;
  }

  async updateClass(id: number, classData: any): Promise<ApiResponse<any>> {
    const response = await this.instance.put(`/classes/${id}`, classData);
    return response.data;
  }

  async deleteClass(id: number): Promise<ApiResponse<void>> {
    const response = await this.instance.delete(`/classes/${id}`);
    return response.data;
  }

  // Bookings methods
  async getBookings(params?: any): Promise<ApiResponse<any[]>> {
    const response = await this.instance.get('/bookings', { params });
    return response.data;
  }

  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    const response = await this.instance.post('/bookings', bookingData);
    return response.data;
  }

  async updateBooking(id: number, bookingData: any): Promise<ApiResponse<any>> {
    const response = await this.instance.put(`/bookings/${id}`, bookingData);
    return response.data;
  }

  async cancelBooking(id: number): Promise<ApiResponse<void>> {
    const response = await this.instance.delete(`/bookings/${id}`);
    return response.data;
  }

  // Sports methods
  async getSports(): Promise<ApiResponse<any[]>> {
    const response = await this.instance.get('/sports');
    return response.data;
  }

  // Messages methods
  async getMessages(): Promise<ApiResponse<any[]>> {
    const response = await this.instance.get('/messages');
    return response.data;
  }

  async sendMessage(messageData: any): Promise<ApiResponse<any>> {
    const response = await this.instance.post('/messages/send', messageData);
    return response.data;
  }

  // Stats methods
  async getOrganizationStats(organizationId: number): Promise<ApiResponse<any>> {
    const response = await this.instance.get(`/stats/organization/${organizationId}`);
    return response.data;
  }

  // Push notification methods
  async registerPushToken(token: string): Promise<ApiResponse<void>> {
    const response = await this.instance.post('/notifications/register', { token });
    return response.data;
  }

  async unregisterPushToken(): Promise<ApiResponse<void>> {
    const response = await this.instance.post('/notifications/unregister');
    return response.data;
  }

  // File upload methods
  async uploadFile(file: any, type: 'logo' | 'avatar' | 'document'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.instance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  getWebSocketUrl(): string {
    return WS_BASE_URL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;