import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { pushNotificationService } from "@/lib/push-notifications";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Smartphone, X } from "lucide-react";

interface PushNotificationSetupProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function PushNotificationSetup({ onComplete, onDismiss }: PushNotificationSetupProps) {
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#278DD4] mx-auto mb-3"></div>
          <p className="text-slate-600">Checking notification support...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="sm" onClick={onDismiss} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <BellOff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Notifications Not Supported</h3>
            <p className="text-slate-600 text-sm">
              Your browser doesn't support push notifications or you're not using HTTPS.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="relative">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-t-2xl p-6 text-center text-white">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="sm" onClick={onDismiss} className="text-white/80 hover:text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Bell className="h-12 w-12 mx-auto mb-3 text-white" />
            <h3 className="text-xl font-bold">Stay Updated</h3>
            <p className="text-white/90 text-sm mt-2">
              Get instant notifications about your classes, bookings, and important updates
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Enable Notifications</p>
                <p className="text-sm text-slate-500">
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            {isSubscribed && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-[#24D367]/10 to-[#24D3BF]/10 border border-[#24D367]/20 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-800 mb-2">
                    ✓ You'll receive notifications for:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Class reminders (30 minutes before)</li>
                    <li>• New booking confirmations</li>
                    <li>• Class cancellations</li>
                    <li>• Payment reminders</li>
                    <li>• Attendance reminders (for coaches)</li>
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                  onClick={handleTestNotification}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            )}

            {!isSubscribed && permission !== 'denied' && (
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white font-medium"
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enabling...' : 'Enable Notifications'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500 hover:text-slate-700"
                  onClick={onDismiss}
                >
                  Maybe Later
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}