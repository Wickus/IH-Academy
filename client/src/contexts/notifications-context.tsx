import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'payment' | 'reminder' | 'announcement';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  deleteNotification: (id: number) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: "New Class Booking",
        message: "Sarah Johnson booked Water Polo class for tomorrow at 2:00 PM",
        time: "2 minutes ago",
        type: "booking",
        isRead: false,
        priority: "high"
      },
      {
        id: 2,
        title: "Payment Received",
        message: "Payment confirmed for Basketball class - R300.00",
        time: "1 hour ago",
        type: "payment",
        isRead: false,
        priority: "medium"
      },
      {
        id: 3,
        title: "Class Reminder",
        message: "Tennis class starts in 30 minutes with 8 participants",
        time: "3 hours ago",
        type: "reminder",
        isRead: false,
        priority: "medium"
      },
      {
        id: 4,
        title: "New Member Registration",
        message: "Michael Smith has registered and is awaiting approval",
        time: "1 day ago",
        type: "booking",
        isRead: false,
        priority: "low"
      }
    ]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      deleteNotification,
      markAllAsRead,
      setNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}