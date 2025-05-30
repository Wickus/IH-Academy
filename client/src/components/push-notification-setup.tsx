import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { pushNotificationService } from "@/lib/push-notifications";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Smartphone } from "lucide-react";

interface PushNotificationSetupProps {
  onComplete?: () => void;
}

export default function PushNotificationSetup({ onComplete }: PushNotificationSetupProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    setIsLoading(true);
    
    const supported = await pushNotificationService.initialize();
    setIsSupported(supported);
    
    if (supported) {
      setIsSubscribed(pushNotificationService.isSubscribed());
      setPermission(Notification.permission);
    }
    
    setIsLoading(false);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const permissionGranted = await pushNotificationService.requestPermission();
      
      if (!permissionGranted) {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const subscription = await pushNotificationService.subscribe();
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        
        toast({
          title: "Notifications Enabled",
          description: "You'll receive updates about your classes and bookings."
        });

        onComplete?.();
      } else {
        toast({
          title: "Setup Failed",
          description: "Failed to enable notifications. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications."
        });
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    try {
      await api.sendTestNotification();
      
      // Show a local notification for immediate feedback
      await pushNotificationService.showNotification("Test Notification", {
        body: "Push notifications are working correctly!",
        icon: "/vite.svg"
      });
      
      toast({
        title: "Test Sent",
        description: "Check your notifications!"
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-gray-500">Checking notification support...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <CardTitle>Notifications Not Supported</CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications or you're not using HTTPS.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Get instant updates about your classes, bookings, and important reminders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Notifications</p>
            <p className="text-sm text-gray-500">
              Status: {isSubscribed ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Disabled'}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ You'll receive notifications for:
              </p>
              <ul className="text-xs text-green-600 mt-1 space-y-1">
                <li>• Class reminders (30 minutes before)</li>
                <li>• New booking confirmations</li>
                <li>• Class cancellations</li>
                <li>• Payment reminders</li>
                <li>• Attendance reminders (for coaches)</li>
              </ul>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleTestNotification}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}

        {!isSubscribed && permission !== 'denied' && (
          <Button 
            className="w-full"
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}