import { apiRequest } from "./queryClient";

export interface DashboardStats {
  totalBookings: number;
  activeClasses: number;
  totalRevenue: number;
  totalCoaches: number;
  activeCoaches: number;
  upcomingClasses: number;
}

export interface Sport {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface Class {
  id: number;
  academyId: number;
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
  // Dashboard
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
  getClasses: async (params?: { academyId?: number; coachId?: number; date?: string }): Promise<Class[]> => {
    const searchParams = new URLSearchParams();
    if (params?.academyId) searchParams.append('academyId', params.academyId.toString());
    if (params?.coachId) searchParams.append('coachId', params.coachId.toString());
    if (params?.date) searchParams.append('date', params.date);
    
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
};
