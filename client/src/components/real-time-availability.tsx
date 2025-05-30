import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, Bell, BellOff } from "lucide-react";
import { webSocketService, type AvailabilityUpdate, type BookingNotification } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

interface RealTimeAvailabilityProps {
  classId: number;
  className: string;
  initialAvailableSpots: number;
  totalSpots: number;
  userId?: number;
}

export default function RealTimeAvailability({
  classId,
  className,
  initialAvailableSpots,
  totalSpots,
  userId
}: RealTimeAvailabilityProps) {
  const [availableSpots, setAvailableSpots] = useState(initialAvailableSpots);
  const [isConnected, setIsConnected] = useState(false);
  const [recentBookings, setRecentBookings] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to WebSocket if not already connected
    if (!webSocketService.getConnectionStatus()) {
      webSocketService.connect(userId);
    }

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Connected to real-time updates');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from real-time updates');
    };

    const handleAvailabilityUpdate = (data: AvailabilityUpdate) => {
      if (data.classId === classId) {
        const previousSpots = availableSpots;
        setAvailableSpots(data.availableSpots);
        
        // Show toast notification for significant changes
        if (data.availableSpots === 0 && previousSpots > 0) {
          toast({
            title: "Class Full",
            description: `${className} is now fully booked`,
            variant: "destructive"
          });
        } else if (data.availableSpots > 0 && previousSpots === 0) {
          toast({
            title: "Spot Available",
            description: `A spot just opened up in ${className}`,
            variant: "default"
          });
        }
      }
    };

    const handleBookingNotification = (data: BookingNotification) => {
      if (data.classId === classId) {
        const message = data.action === 'booked' 
          ? `${data.participantName} just booked ${data.className}`
          : `${data.participantName} cancelled their booking for ${data.className}`;
        
        // Add to recent bookings list (show last 3)
        setRecentBookings(prev => [message, ...prev.slice(0, 2)]);
        
        // Show notification
        toast({
          title: data.action === 'booked' ? "New Booking" : "Booking Cancelled",
          description: message,
          duration: 3000
        });
      }
    };

    // Add event listeners
    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('availability_update', handleAvailabilityUpdate);
    webSocketService.on('booking_notification', handleBookingNotification);

    // Subscribe to this class updates
    webSocketService.subscribeToClass(classId);
    setIsSubscribed(true);

    // Cleanup on unmount
    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('availability_update', handleAvailabilityUpdate);
      webSocketService.off('booking_notification', handleBookingNotification);
      webSocketService.unsubscribeFromClass(classId);
    };
  }, [classId, className, userId, availableSpots, toast]);

  const toggleSubscription = () => {
    if (isSubscribed) {
      webSocketService.unsubscribeFromClass(classId);
      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: `You'll no longer receive updates for ${className}`,
      });
    } else {
      webSocketService.subscribeToClass(classId);
      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled",
        description: `You'll receive live updates for ${className}`,
      });
    }
  };

  const getAvailabilityStatus = () => {
    const percentage = (availableSpots / totalSpots) * 100;
    
    if (availableSpots === 0) {
      return { status: "Full", variant: "destructive" as const, color: "text-red-600" };
    } else if (percentage <= 20) {
      return { status: "Almost Full", variant: "destructive" as const, color: "text-orange-600" };
    } else if (percentage <= 50) {
      return { status: "Filling Up", variant: "secondary" as const, color: "text-yellow-600" };
    } else {
      return { status: "Available", variant: "default" as const, color: "text-green-600" };
    }
  };

  const { status, variant, color } = getAvailabilityStatus();

  return (
    <Card className="brand-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Badge variant={variant}>{status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Availability Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Spots</p>
            <p className={`text-2xl font-bold ${color}`}>
              {availableSpots} / {totalSpots}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSubscription}
            className="flex items-center gap-1"
          >
            {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {isSubscribed ? "Disable" : "Enable"} Alerts
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Empty</span>
            <span>Full</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                availableSpots === 0 ? 'bg-red-500' :
                availableSpots / totalSpots <= 0.2 ? 'bg-orange-500' :
                availableSpots / totalSpots <= 0.5 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${((totalSpots - availableSpots) / totalSpots) * 100}%` }}
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isConnected ? "Real-time updates active" : "Reconnecting..."}
        </div>

        {/* Recent Activity */}
        {recentBookings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Activity</p>
            <div className="space-y-1">
              {recentBookings.map((booking, index) => (
                <p key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded slide-up">
                  {booking}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Waitlist Info (when full) */}
        {availableSpots === 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              This class is currently full. Enable alerts to be notified when a spot becomes available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}