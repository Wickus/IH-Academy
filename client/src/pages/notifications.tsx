import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, Filter, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'payment' | 'reminder' | 'announcement';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Mock notifications data - in a real app this would come from an API
  const mockNotifications: Notification[] = [
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
      isRead: true,
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
    },
    {
      id: 5,
      title: "Class Cancelled",
      message: "Swimming class on Friday has been cancelled due to pool maintenance",
      time: "2 days ago",
      type: "announcement",
      isRead: true,
      priority: "high"
    },
    {
      id: 6,
      title: "Monthly Report Available",
      message: "Your organisation's monthly performance report is ready for review",
      time: "1 week ago",
      type: "announcement",
      isRead: true,
      priority: "low"
    }
  ];

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      booking: '👤',
      payment: '💳',
      reminder: '⏰',
      announcement: '📢'
    };
    return iconMap[type as keyof typeof iconMap] || '📄';
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      booking: 'bg-[#24D367]',
      payment: 'bg-[#278DD4]',
      reminder: 'bg-[#24D3BF]',
      announcement: 'bg-[#20366B]'
    };
    return colorMap[type as keyof typeof colorMap] || 'bg-slate-500';
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    return colorMap[priority as keyof typeof colorMap] || 'border-slate-200 bg-white';
  };

  const filteredNotifications = mockNotifications.filter(notification => {
    const typeMatch = selectedType === 'all' || notification.type === selectedType;
    const readMatch = filter === 'all' || 
                     (filter === 'unread' && !notification.isRead) ||
                     (filter === 'read' && notification.isRead);
    return typeMatch && readMatch;
  });

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    // In a real app, this would call an API
    console.log(`Mark notification ${id} as read`);
  };

  const deleteNotification = (id: number) => {
    // In a real app, this would call an API
    console.log(`Delete notification ${id}`);
  };

  const markAllAsRead = () => {
    // In a real app, this would call an API
    console.log('Mark all as read');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-[#278DD4]" />
            <div>
              <h1 className="text-2xl font-bold text-[#20366B]">Notifications Center</h1>
              <p className="text-slate-600">
                {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All notifications are read'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4]/10"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full max-w-[300px] grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#278DD4]"
          >
            <option value="all">All Types</option>
            <option value="booking">Bookings</option>
            <option value="payment">Payments</option>
            <option value="reminder">Reminders</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md cursor-pointer ${
                !notification.isRead ? 'border-l-4 border-l-[#278DD4] bg-[#278DD4]/5' : ''
              } ${getPriorityColor(notification.priority)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white text-lg`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold text-[#20366B] ${!notification.isRead ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="bg-[#278DD4] text-white text-xs">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>{notification.time}</span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!notification.isRead && (
                        <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No notifications found</h3>
              <p className="text-slate-500">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : selectedType !== 'all'
                  ? `No ${selectedType} notifications found.`
                  : "You don't have any notifications yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#24D367]">
              {mockNotifications.filter(n => n.type === 'booking').length}
            </div>
            <div className="text-sm text-slate-600">Booking Notifications</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#278DD4]">
              {mockNotifications.filter(n => n.type === 'payment').length}
            </div>
            <div className="text-sm text-slate-600">Payment Notifications</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#24D3BF]">
              {mockNotifications.filter(n => n.type === 'reminder').length}
            </div>
            <div className="text-sm text-slate-600">Reminders</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#20366B]">
              {mockNotifications.filter(n => n.type === 'announcement').length}
            </div>
            <div className="text-sm text-slate-600">Announcements</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}