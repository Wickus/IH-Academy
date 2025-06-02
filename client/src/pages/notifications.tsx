import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
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
      }
    ]);
  }, []);

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

  const filteredNotifications = notifications.filter(notification => {
    const typeMatch = selectedType === 'all' || notification.type === selectedType;
    const readMatch = filter === 'all' || 
                     (filter === 'unread' && !notification.isRead) ||
                     (filter === 'read' && notification.isRead);
    return typeMatch && readMatch;
  });

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

  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#20366B]">Notifications Center</h1>
                <p className="text-slate-600 text-lg">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All notifications are read'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-auto">
              <TabsList className="grid grid-cols-3 w-[300px] bg-white border border-[#278DD4]/20">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
                >
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="read" 
                  className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white"
                >
                  Read
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-[#278DD4]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#278DD4] bg-white text-slate-700"
            >
              <option value="all">All Types</option>
              <option value="booking">Bookings</option>
              <option value="payment">Payments</option>
              <option value="reminder">Reminders</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-lg cursor-pointer border-l-4 ${
                  !notification.isRead 
                    ? 'border-l-[#278DD4] bg-gradient-to-r from-[#278DD4]/5 to-white shadow-md' 
                    : 'border-l-slate-300 bg-white hover:bg-slate-50'
                }`}
                onClick={() => openNotification(notification)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white text-lg shadow-sm`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-semibold text-[#20366B] text-lg ${!notification.isRead ? 'font-bold' : ''}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge className="bg-[#278DD4] text-white text-xs px-2 py-1">
                              New
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${
                              notification.priority === 'high' ? 'border-red-500 text-red-600' :
                              notification.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                              'border-green-500 text-green-600'
                            }`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-slate-600 text-base mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="font-medium">{notification.time}</span>
                          <span className="capitalize bg-slate-100 px-2 py-1 rounded-full text-xs">
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-[#278DD4]/10 text-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg">
                        {!notification.isRead && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="hover:bg-[#278DD4]/10 text-slate-700 cursor-pointer"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600 hover:bg-red-50 cursor-pointer"
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
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#20366B] mb-2">No notifications found</h3>
                <p className="text-slate-500 text-lg">
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

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-[#24D367]/10 to-white border border-[#24D367]/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#24D367] mb-2">
                {notifications.filter(n => n.type === 'booking').length}
              </div>
              <div className="text-sm text-slate-600 font-medium">Booking Notifications</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#278DD4]/10 to-white border border-[#278DD4]/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#278DD4] mb-2">
                {notifications.filter(n => n.type === 'payment').length}
              </div>
              <div className="text-sm text-slate-600 font-medium">Payment Notifications</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#24D3BF]/10 to-white border border-[#24D3BF]/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#24D3BF] mb-2">
                {notifications.filter(n => n.type === 'reminder').length}
              </div>
              <div className="text-sm text-slate-600 font-medium">Reminders</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#20366B]/10 to-white border border-[#20366B]/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#20366B] mb-2">
                {notifications.filter(n => n.type === 'announcement').length}
              </div>
              <div className="text-sm text-slate-600 font-medium">Announcements</div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-2xl bg-white">
            {selectedNotification && (
              <>
                <DialogHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${getNotificationColor(selectedNotification.type)} flex items-center justify-center text-white`}>
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-[#20366B]">
                        {selectedNotification.title}
                      </DialogTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-slate-500">{selectedNotification.time}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${
                            selectedNotification.priority === 'high' ? 'border-red-500 text-red-600' :
                            selectedNotification.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                            'border-green-500 text-green-600'
                          }`}
                        >
                          {selectedNotification.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <DialogDescription className="text-base text-slate-700 leading-relaxed mt-4">
                  {selectedNotification.message}
                </DialogDescription>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      deleteNotification(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    onClick={() => setSelectedNotification(null)}
                    className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}