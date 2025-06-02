import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
}

export function getSportColor(sportName: string): string {
  const sportColors: Record<string, string> = {
    'Basketball': 'blue-sport',
    'Soccer': 'green-sport',
    'Tennis': 'orange-sport',
    'Swimming': 'blue-sport',
  };
  
  return sportColors[sportName] || 'blue-sport';
}

export function getPaymentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'confirmed': 'success',
    'pending': 'warning',
    'failed': 'error',
    'refunded': 'gray-500',
  };
  
  return statusColors[status] || 'gray-500';
}

export function getAttendanceStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'present': 'success',
    'absent': 'error',
    'pending': 'warning',
  };
  
  return statusColors[status] || 'warning';
}

export function generateICalEvent(classData: any, booking: any): string {
  const formatDateForICal = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(classData.startTime);
  const endDate = new Date(classData.endTime || new Date(startDate.getTime() + 60 * 60 * 1000)); // Default 1 hour duration
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ItsHappening.Africa//Sports Class//EN',
    'BEGIN:VEVENT',
    `UID:booking-${booking.id}@itshappening.africa`,
    `DTSTART:${formatDateForICal(startDate)}`,
    `DTEND:${formatDateForICal(endDate)}`,
    `SUMMARY:${classData.name}`,
    `DESCRIPTION:Sports class booking for ${booking.participantName}\\nAmount: ${formatCurrency(booking.amount)}\\nPayment Status: ${booking.paymentStatus}`,
    `LOCATION:${classData.location || 'TBA'}`,
    `STATUS:${booking.paymentStatus === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Class starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icalContent;
}
