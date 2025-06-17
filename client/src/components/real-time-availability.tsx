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
  organization?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

export default function RealTimeAvailability({
  classId,
  className,
  initialAvailableSpots,
  totalSpots,
  userId,
  organization
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
      return { 
        status: "Full", 
        variant: "destructive" as const, 
        color: "text-red-600",
        bgColor: "#ef4444"
      };
    } else if (percentage <= 20) {
      return { 
        status: "Almost Full", 
        variant: "destructive" as const, 
        color: "text-orange-600",
        bgColor: "#f97316"
      };
    } else if (percentage <= 50) {
      return { 
        status: "Filling Up", 
        variant: "secondary" as const, 
        color: "text-yellow-600",
        bgColor: organization?.accentColor || "#eab308"
      };
    } else {
      return { 
        status: "Available", 
        variant: "default" as const, 
        color: "text-green-600",
        bgColor: organization?.secondaryColor || "#22c55e"
      };
    }
  };

  const { status, variant, color, bgColor } = getAvailabilityStatus();

  return (
    <div 
      className="bg-gradient-to-r from-slate-50 rounded-lg p-3"
      style={{ 
        backgroundImage: `linear-gradient(to right, rgb(248 250 252), ${organization?.secondaryColor}20)`,
        borderColor: `${organization?.secondaryColor}30`,
        border: '1px solid'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: organization?.secondaryColor || '#278DD4' }} />
          <span className="text-sm font-medium" style={{ color: organization?.primaryColor || '#20366B' }}>Live Availability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#24D367]' : 'bg-red-500'} animate-pulse`} />
          <Badge 
            variant={variant} 
            className="text-white border-0 text-xs"
            style={{ backgroundColor: bgColor }}
          >
            {status}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-600">Available Spots</p>
            <p className="text-lg font-bold" style={{ color: organization?.primaryColor || '#20366B' }}>
              {availableSpots} / {totalSpots}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSubscription}
            className="flex items-center gap-1 hover:text-white text-xs"
            style={{
              borderColor: organization?.secondaryColor || '#278DD4',
              color: organization?.secondaryColor || '#278DD4'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = organization?.secondaryColor || '#278DD4';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = organization?.secondaryColor || '#278DD4';
            }}
          >
            {isSubscribed ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
            {isSubscribed ? "Disable" : "Enable"}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Empty</span>
            <span>Full</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${((totalSpots - availableSpots) / totalSpots) * 100}%`,
                backgroundImage: `linear-gradient(to right, ${organization?.accentColor || '#24D367'}, ${organization?.primaryColor || '#278DD4'})`
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {recentBookings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: organization?.primaryColor || '#20366B' }}>Recent Activity</p>
            <div className="space-y-1">
              {recentBookings.map((booking, index) => (
                <p key={index} className="text-xs text-slate-600 bg-slate-100 p-2 rounded">
                  {booking}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {isConnected ? "Real-time updates active" : "Reconnecting..."}
        </div>
      </div>
    </div>
  );
}