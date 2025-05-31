import { apiRequest } from "./queryClient";

export interface GlobalDashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface OrganizationDashboardStats {
  totalBookings: number;
  activeClasses: number;
  totalRevenue: number;
  totalCoaches: number;
  activeCoaches: number;
  upcomingClasses: number;
  totalMembers: number;
}

// Legacy interface for backward compatibility
export interface DashboardStats extends OrganizationDashboardStats {}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'global_admin' | 'organization_admin' | 'coach' | 'member';
  organizationId?: number;
  isActive: boolean;
}

export interface Organization {
  id: number;
  name: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  planType: 'free' | 'basic' | 'premium';
  maxClasses: number;
  maxMembers: number;
  isActive: boolean;
  isFollowing?: boolean;
}

export interface Sport {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface Class {
  id: number;
  organizationId: number;
  sportId: number;
  coachId: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  price: number;
  location?: string;
  requirements?: string;
  sport?: Sport;
  coach?: any;
  organization?: Organization;
  bookingCount: number;
  availableSpots: number;
}

export interface Booking {
  id: number;
  classId: number;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  participantAge?: number;
  bookingDate: string;
  paymentStatus: 'pending' | 'confirmed' | 'failed' | 'refunded';
  amount: number;
  class?: Class;
  sport?: Sport;
}

export interface AttendanceRecord {
  booking: Booking;
  attendance: {
    id?: number;
    status: 'present' | 'absent' | 'pending';
    markedAt?: string;
    markedBy?: number;
  };
}

// API functions
export const api = {
  // Authentication & Users
  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },

  register: async (userData: Omit<User, 'id' | 'isActive'> & { password: string }): Promise<User> => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  login: async (credentials: { username: string; password: string }): Promise<User> => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout');
  },

  // Organizations
  getOrganizations: async (): Promise<Organization[]> => {
    const response = await apiRequest('GET', '/api/organizations');
    return response.json();
  },

  getOrganization: async (id: number): Promise<Organization> => {
    const response = await apiRequest('GET', `/api/organizations/${id}`);
    return response.json();
  },

  createOrganization: async (orgData: Omit<Organization, 'id' | 'isActive'>): Promise<Organization> => {
    const response = await apiRequest('POST', '/api/organizations', orgData);
    return response.json();
  },

  getUserOrganizations: async (): Promise<Organization[]> => {
    const response = await apiRequest('GET', '/api/organizations/my');
    return response.json();
  },

  updateOrganization: async (id: number, orgData: Partial<Organization>): Promise<Organization> => {
    const response = await apiRequest('PUT', `/api/organizations/${id}`, orgData);
    return response.json();
  },

  followOrganization: async (organizationId: number): Promise<void> => {
    await apiRequest('POST', `/api/organizations/${organizationId}/follow`);
  },

  unfollowOrganization: async (organizationId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/organizations/${organizationId}/follow`);
  },

  // Dashboard Stats
  getGlobalStats: async (): Promise<GlobalDashboardStats> => {
    const response = await apiRequest('GET', '/api/stats/global');
    return response.json();
  },

  getOrganizationStats: async (organizationId: number): Promise<OrganizationDashboardStats> => {
    const response = await apiRequest('GET', `/api/stats/organization/${organizationId}`);
    return response.json();
  },

  // Legacy stats endpoint for backward compatibility
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest('GET', '/api/stats');
    return response.json();
  },

  // Sports
  getSports: async (): Promise<Sport[]> => {
    const response = await apiRequest('GET', '/api/sports');
    return response.json();
  },

  // Classes
  getClasses: async (params?: { organizationId?: number; coachId?: number; date?: string; public?: boolean }): Promise<Class[]> => {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId.toString());
    if (params?.coachId) searchParams.append('coachId', params.coachId.toString());
    if (params?.date) searchParams.append('date', params.date);
    if (params?.public) searchParams.append('public', 'true');
    
    const response = await apiRequest('GET', `/api/classes?${searchParams.toString()}`);
    return response.json();
  },

  getClass: async (id: number): Promise<Class> => {
    const response = await apiRequest('GET', `/api/classes/${id}`);
    return response.json();
  },

  createClass: async (classData: Omit<Class, 'id' | 'sport' | 'coach' | 'bookingCount' | 'availableSpots'>): Promise<Class> => {
    const response = await apiRequest('POST', '/api/classes', classData);
    return response.json();
  },

  updateClass: async (id: number, classData: Partial<Omit<Class, 'id' | 'sport' | 'coach' | 'bookingCount' | 'availableSpots'>>): Promise<Class> => {
    const response = await apiRequest('PUT', `/api/classes/${id}`, classData);
    return response.json();
  },

  // Bookings
  getBookings: async (params?: { email?: string; classId?: number; recent?: number }): Promise<Booking[]> => {
    const searchParams = new URLSearchParams();
    if (params?.email) searchParams.append('email', params.email);
    if (params?.classId) searchParams.append('classId', params.classId.toString());
    if (params?.recent) searchParams.append('recent', params.recent.toString());
    
    const response = await apiRequest('GET', `/api/bookings?${searchParams.toString()}`);
    return response.json();
  },

  createBooking: async (bookingData: Omit<Booking, 'id' | 'bookingDate' | 'class' | 'sport'>): Promise<Booking> => {
    const response = await apiRequest('POST', '/api/bookings', bookingData);
    return response.json();
  },

  downloadIcal: async (bookingId: number): Promise<void> => {
    const response = await apiRequest('GET', `/api/bookings/${bookingId}/ical`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-booking-${bookingId}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Attendance
  getAttendance: async (classId: number): Promise<AttendanceRecord[]> => {
    const response = await apiRequest('GET', `/api/attendance/${classId}`);
    return response.json();
  },

  markAttendance: async (attendanceData: {
    classId: number;
    bookingId: number;
    status: 'present' | 'absent';
    markedBy: number;
  }): Promise<any> => {
    const response = await apiRequest('POST', '/api/attendance', attendanceData);
    return response.json();
  },

  updateAttendance: async (id: number, status: 'present' | 'absent'): Promise<any> => {
    const response = await apiRequest('PUT', `/api/attendance/${id}`, { status });
    return response.json();
  },

  // Coaches
  getCoaches: async (academyId?: number): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (academyId) searchParams.append('academyId', academyId.toString());
    
    const response = await apiRequest('GET', `/api/coaches?${searchParams.toString()}`);
    return response.json();
  },

  createCoach: async (coachData: any): Promise<any> => {
    const response = await apiRequest('POST', '/api/coaches', coachData);
    return response.json();
  },

  updateCoach: async (id: number, coachData: any): Promise<any> => {
    const response = await apiRequest('PUT', `/api/coaches/${id}`, coachData);
    return response.json();
  },

  // Push notification routes
  subscribeToPush: async (subscription: any): Promise<any> => {
    const response = await apiRequest('POST', '/api/notifications/subscribe', subscription);
    return response.json();
  },

  unsubscribeFromPush: async (subscription: any): Promise<any> => {
    const response = await apiRequest('POST', '/api/notifications/unsubscribe', subscription);
    return response.json();
  },

  sendTestNotification: async (): Promise<any> => {
    const response = await apiRequest('POST', '/api/notifications/test');
    return response.json();
  },

  // Users (Global admin only)
  getUsers: async (): Promise<User[]> => {
    const response = await apiRequest('GET', '/api/users');
    return response.json();
  },
};
