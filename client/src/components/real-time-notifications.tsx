import { useState, useEffect } from "react";
import { Bell, X, Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { webSocketService } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'availability' | 'booking' | 'reminder' | 'attendance';
  title: string;
  message: string;
  timestamp: number;
  classId?: number;
  className?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface RealTimeNotificationsProps {
  userId?: number;
  organizationId?: number;
  maxNotifications?: number;
}

export default function RealTimeNotifications({
  userId,
  organizationId,
  maxNotifications = 10
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to WebSocket if not already connected
    if (!webSocketService.getConnectionStatus() && userId) {
      webSocketService.connect(userId);
    }

    // Subscribe to organization updates if provided
    if (organizationId) {
      webSocketService.subscribeToOrganization(organizationId);
    }

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleAvailabilityUpdate = (data: any) => {
      const notification: Notification = {
        id: `availability-${Date.now()}`,
        type: 'availability',
        title: 'Availability Update',
        message: `${data.availableSpots} spots now available in class`,
        timestamp: Date.now(),
        classId: data.classId,
        isRead: false,
        priority: data.availableSpots === 0 ? 'high' : 'medium'
      };

      addNotification(notification);
    };

    const handleBookingNotification = (data: any) => {
      const notification: Notification = {
        id: `booking-${Date.now()}`,
        type: 'booking',
        title: data.action === 'booked' ? 'New Booking' : 'Booking Cancelled',
        message: `${data.participantName} ${data.action} ${data.className}`,
        timestamp: Date.now(),
        classId: data.classId,
        className: data.className,
        isRead: false,
        priority: 'medium'
      };

      addNotification(notification);
    };

    const handleClassReminder = (data: any) => {
      const notification: Notification = {
        id: `reminder-${Date.now()}`,
        type: 'reminder',
        title: 'Class Reminder',
        message: `${data.className} starts in ${data.minutesUntil} minutes`,
        timestamp: Date.now(),
        classId: data.classId,
        className: data.className,
        isRead: false,
        priority: 'high'
      };

      addNotification(notification);
      
      // Show browser toast for reminders
      toast({
        title: "Class Reminder",
        description: notification.message,
        duration: 5000
      });
    };

    const handleAttendanceUpdate = (data: any) => {
      const notification: Notification = {
        id: `attendance-${Date.now()}`,
        type: 'attendance',
        title: 'Attendance Update',
        message: `Attendance marked for ${data.className}`,
        timestamp: Date.now(),
        classId: data.classId,
        className: data.className,
        isRead: false,
        priority: 'low'
      };

      addNotification(notification);
    };

    // Add event listeners
    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('availability_update', handleAvailabilityUpdate);
    webSocketService.on('booking_notification', handleBookingNotification);
    webSocketService.on('class_reminder', handleClassReminder);
    webSocketService.on('attendance_update', handleAttendanceUpdate);

    // Cleanup on unmount
    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('availability_update', handleAvailabilityUpdate);
      webSocketService.off('booking_notification', handleBookingNotification);
      webSocketService.off('class_reminder', handleClassReminder);
      webSocketService.off('attendance_update', handleAttendanceUpdate);
    };
  }, [userId, organizationId, toast]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      setUnreadCount(updated.filter(n => !n.isRead).length);
      return updated;
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      setUnreadCount(updated.filter(n => !n.isRead).length);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'availability':
        return <Users className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'reminder':
        return <Clock className="h-4 w-4" />;
      case 'attendance':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs">Live updates will appear here</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground break-words">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="w-full text-xs"
              >
                Clear all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}