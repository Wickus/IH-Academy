import webpush from 'web-push';

// VAPID keys for push notifications
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8L3J8s4JvKrS7iDEDW7jv3oNGkT3IfDC3mJmJvOzXgH5rTI0K_wLJh2w',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'aUWqxJcQ0qU8yNVyE5lPHxYkZ4M-pFGOYcZhYkR9M84'
};

// Set VAPID details
webpush.setVapidDetails(
  'mailto:admin@ihacademy.africa',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  async sendNotification(subscription: PushSubscription, payload: NotificationPayload) {
    try {
      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      console.log('Push notification sent successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error };
    }
  }

  async sendToMultiple(subscriptions: PushSubscription[], payload: NotificationPayload) {
    const promises = subscriptions.map(subscription => 
      this.sendNotification(subscription, payload)
    );
    
    const results = await Promise.allSettled(promises);
    return results;
  }

  // Notification templates for different events
  getClassReminderNotification(className: string, startTime: Date): NotificationPayload {
    return {
      title: 'Class Reminder',
      body: `${className} starts in 30 minutes`,
      icon: '/icons/reminder.png',
      badge: '/icons/badge.png',
      data: { type: 'class_reminder', startTime },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'cancel', title: 'Cancel Booking' }
      ]
    };
  }

  getBookingConfirmationNotification(className: string, participantName: string): NotificationPayload {
    return {
      title: 'New Booking',
      body: `${participantName} booked ${className}`,
      icon: '/icons/booking.png',
      badge: '/icons/badge.png',
      data: { type: 'new_booking' },
      actions: [
        { action: 'view', title: 'View Booking' }
      ]
    };
  }

  getClassCancelledNotification(className: string): NotificationPayload {
    return {
      title: 'Class Cancelled',
      body: `${className} has been cancelled`,
      icon: '/icons/cancelled.png',
      badge: '/icons/badge.png',
      data: { type: 'class_cancelled' },
      actions: [
        { action: 'rebook', title: 'Find Alternative' }
      ]
    };
  }

  getAttendanceReminderNotification(className: string): NotificationPayload {
    return {
      title: 'Take Attendance',
      body: `Mark attendance for ${className}`,
      icon: '/icons/attendance.png',
      badge: '/icons/badge.png',
      data: { type: 'attendance_reminder' },
      actions: [
        { action: 'mark', title: 'Mark Attendance' }
      ]
    };
  }

  getPaymentReminderNotification(amount: number, className: string): NotificationPayload {
    return {
      title: 'Payment Due',
      body: `Payment of R${amount} due for ${className}`,
      icon: '/icons/payment.png',
      badge: '/icons/badge.png',
      data: { type: 'payment_reminder', amount },
      actions: [
        { action: 'pay', title: 'Pay Now' }
      ]
    };
  }
}

export const notificationService = new NotificationService();
export { vapidKeys };