import { apiRequest } from "./queryClient";
import type { Child, InsertChild } from "@shared/schema";

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
  businessModel: 'membership' | 'pay_per_class';
  membershipPrice?: string;
  membershipBillingCycle?: string;
  payfastMerchantId?: string;
  payfastMerchantKey?: string;
  payfastPassphrase?: string;
  payfastSandbox?: boolean;
  planType: 'free' | 'basic' | 'premium';
  maxClasses: number;
  maxMembers: number;
  inviteCode?: string;
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
  coachId?: number | null;
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
  id: number;
  classId: number;
  bookingId?: number;
  status: 'present' | 'absent' | 'pending';
  markedAt?: string;
  markedBy?: number;
  participantName?: string;
  participantEmail?: string;
  participantPhone?: string;
  participantUserId?: number;
  isWalkIn?: boolean;
  paymentMethod?: string;
  amountPaid?: string;
  notes?: string;
  booking?: Booking;
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

  updateOrganization: async (id: number, updateData: Partial<Organization>): Promise<Organization> => {
    const response = await apiRequest('PUT', `/api/organizations/${id}`, updateData);
    return response.json();
  },

  getUserOrganizations: async (): Promise<Organization[]> => {
    const response = await apiRequest('GET', '/api/organizations/my');
    return response.json();
  },

  followOrganization: async (organizationId: number): Promise<void> => {
    await apiRequest('POST', `/api/organizations/${organizationId}/follow`);
  },

  unfollowOrganization: async (organizationId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/organizations/${organizationId}/follow`);
  },

  joinOrganizationByInviteCode: async (inviteCode: string): Promise<{ message: string; organization: Organization }> => {
    const response = await apiRequest('POST', '/api/organizations/join', { inviteCode });
    return response.json();
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

  createSport: async (sport: { name: string; color: string; icon: string }): Promise<Sport> => {
    const response = await apiRequest('POST', '/api/sports', sport);
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

  deleteClass: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/classes/${id}`);
  },

  // Bookings
  getBookings: async (params?: { email?: string; classId?: number; recent?: number; organizationId?: number }): Promise<Booking[]> => {
    const searchParams = new URLSearchParams();
    if (params?.email) searchParams.append('email', params.email);
    if (params?.classId) searchParams.append('classId', params.classId.toString());
    if (params?.recent) searchParams.append('recent', params.recent.toString());
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId.toString());
    
    const response = await apiRequest('GET', `/api/bookings?${searchParams.toString()}`);
    return response.json();
  },

  createBooking: async (bookingData: Omit<Booking, 'id' | 'bookingDate' | 'class' | 'sport'>): Promise<Booking> => {
    const response = await apiRequest('POST', '/api/bookings', bookingData);
    return response.json();
  },

  getBooking: async (id: number): Promise<Booking> => {
    const bookings = await api.getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) throw new Error('Booking not found');
    return booking;
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

  updateBookingPayment: async (id: number, paymentStatus: string): Promise<Booking> => {
    const response = await apiRequest('PUT', `/api/bookings/${id}/payment`, { paymentStatus });
    return response.json();
  },

  // Attendance
  getAttendance: async (classId: number): Promise<AttendanceRecord[]> => {
    const response = await apiRequest('GET', `/api/attendance/${classId}`);
    return response.json();
  },

  markAttendance: async (attendanceData: {
    classId: number;
    bookingId?: number;
    status: 'present' | 'absent';
    markedBy: number;
    walkInData?: {
      name: string;
      email: string;
      phone?: string;
      paymentMethod: string;
      amountPaid: number;
    };
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

  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await apiRequest('PUT', `/api/users/${userId}/status`, { isActive });
    return response.json();
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/users/${userId}`);
  },

  updateOrganizationStatus: async (orgId: number, isActive: boolean): Promise<Organization> => {
    const response = await apiRequest('PUT', `/api/organizations/${orgId}/status`, { isActive });
    return response.json();
  },

  // Children Management
  getUserChildren: async (): Promise<Child[]> => {
    const response = await apiRequest('GET', '/api/children');
    return response.json();
  },

  createChild: async (childData: InsertChild): Promise<Child> => {
    const response = await apiRequest('POST', '/api/children', childData);
    return response.json();
  },

  updateChild: async (id: number, childData: Partial<InsertChild>): Promise<Child> => {
    const response = await apiRequest('PUT', `/api/children/${id}`, childData);
    return response.json();
  },

  deleteChild: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/children/${id}`);
  },

  deleteOrganization: async (orgId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/organizations/${orgId}`);
  },

  // Daily Schedule API functions for membership organizations
  getDailySchedules: async (organizationId: number): Promise<any[]> => {
    const response = await apiRequest('GET', `/api/daily-schedules/${organizationId}`);
    return response.json();
  },

  createDailySchedule: async (scheduleData: any): Promise<any> => {
    const response = await apiRequest('POST', '/api/daily-schedules', scheduleData);
    return response.json();
  },

  updateDailySchedule: async (id: number, scheduleData: any): Promise<any> => {
    const response = await apiRequest('PUT', `/api/daily-schedules/${id}`, scheduleData);
    return response.json();
  },

  deleteDailySchedule: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/daily-schedules/${id}`);
  },

  // Membership API functions
  getMemberships: async (params?: { userId?: number; organizationId?: number }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId.toString());
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId.toString());
    
    const response = await apiRequest('GET', `/api/memberships?${searchParams.toString()}`);
    return response.json();
  },

  createMembership: async (membershipData: {
    organizationId: number;
    userId: number;
    status: string;
    startDate: string;
    endDate: string;
  }): Promise<any> => {
    const response = await apiRequest('POST', '/api/memberships', membershipData);
    return response.json();
  },

  updateMembership: async (id: number, membershipData: any): Promise<any> => {
    const response = await apiRequest('PUT', `/api/memberships/${id}`, membershipData);
    return response.json();
  },

  // Fix authentication method name
  getMe: async (): Promise<User> => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },

  // PayFast connection test
  testPayfastConnection: async (credentials: {
    merchantId: string;
    merchantKey: string;
    passphrase?: string;
    sandbox: boolean;
  }): Promise<{ connected: boolean; message: string; environment?: string }> => {
    const response = await apiRequest('POST', '/api/test-payfast-connection', credentials);
    return response.json();
  },

  // Messaging functionality
  sendMessage: async (data: {
    recipientType: string;
    recipientId: number;
    subject: string;
    message: string;
    senderName: string;
    senderEmail?: string;
  }): Promise<any> => {
    const response = await apiRequest('POST', '/api/messages/send', data);
    return response.json();
  },

  async markMessageAsRead(messageId: number) {
    const response = await apiRequest('PUT', `/api/messages/${messageId}/read`);
    return response.json();
  },

  async getMessages() {
    const response = await apiRequest('GET', '/api/messages');
    return response.json();
  },

  // Organization management
  leaveOrganization: async (orgId: number): Promise<any> => {
    const response = await apiRequest('DELETE', `/api/organizations/${orgId}/leave`);
    return response.json();
  },
};
