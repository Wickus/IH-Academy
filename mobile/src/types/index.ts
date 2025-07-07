// Re-export shared types from the web application
export * from '../../../shared/schema';

// Mobile-specific types
export interface MobileUser extends User {
  biometricEnabled?: boolean;
  pushToken?: string;
  lastSync?: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  language: string;
  biometricEnabled: boolean;
}

export interface NotificationPreferences {
  classReminders: boolean;
  bookingConfirmations: boolean;
  paymentReminders: boolean;
  scheduleChanges: boolean;
  messages: boolean;
}

export interface CachedData {
  classes: Class[];
  bookings: Booking[];
  coaches: Coach[];
  members: User[];
  lastSync: Date;
}

export interface UserSession {
  user: MobileUser;
  organizations: Organization[];
  currentOrganization?: Organization;
  role: 'member' | 'coach' | 'organization_admin' | 'global_admin';
  tokens: AuthTokens;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date;
  pendingRequests: number;
  syncInProgress: boolean;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OrganizationSelector: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Bookings: undefined;
  Profile: undefined;
  Messages: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Members: undefined;
  Coaches: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type CoachTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Availability: undefined;
  Profile: undefined;
};

// Screen props types
export interface ScreenProps<T = any> {
  navigation: any;
  route: {
    params?: T;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Import shared types from web app
export type {
  User,
  Organization,
  Class,
  Booking,
  Coach,
  Sport,
  Payment,
  Membership,
  Achievement,
  DailySchedule,
  Message,
  DebitOrderMandate,
  DebitOrderTransaction,
} from '../../../shared/schema';