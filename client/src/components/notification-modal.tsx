import { useState } from "react";
import { X, Bell, BellOff, Smartphone, CheckCircle } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [currentStep, setCurrentStep] = useState<'permission' | 'unsupported' | 'success'>('permission');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setCurrentStep('unsupported');
        setIsLoading(false);
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setCurrentStep('success');
      } else {
        setCurrentStep('unsupported');
      }
    } catch (error) {
      console.error('Notification setup failed:', error);
      setCurrentStep('unsupported');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'permission':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-t-2xl p-8 text-center text-white relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Get instant notifications about class bookings, availability updates, and important announcements from your favourite organisations.
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#24D367]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="h-4 w-4 text-[#24D367]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#20366B] mb-1">Class Reminders</h3>
                    <p className="text-slate-600 text-sm">Never miss your booked sessions</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#278DD4]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="h-4 w-4 text-[#278DD4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#20366B] mb-1">Real-time Updates</h3>
                    <p className="text-slate-600 text-sm">Instant alerts when spots become available</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#24D3BF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-[#24D3BF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#20366B] mb-1">Important Announcements</h3>
                    <p className="text-slate-600 text-sm">Stay informed about schedule changes</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white font-semibold py-3 h-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Setting up...
                    </>
                  ) : (
                    'Enable Notifications'
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </>
        );

      case 'unsupported':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-t-2xl p-8 text-center text-white relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Notifications Unavailable</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Your browser doesn't support push notifications or permissions were denied.
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-[#20366B] mb-2">Alternative Options:</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Check your email regularly for updates</li>
                  <li>• Visit the app frequently to see new announcements</li>
                  <li>• Try using a different browser that supports notifications</li>
                  <li>• Ensure you're using a secure HTTPS connection</li>
                </ul>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white font-semibold py-3 h-auto"
              >
                I Understand
              </Button>
            </div>
          </>
        );

      case 'success':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] rounded-t-2xl p-8 text-center text-white relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Notifications are now enabled. You'll receive updates about your bookings and favourite organisations.
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <p className="text-slate-600">
                  We'll send you notifications about:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-[#24D367]/10 text-[#24D367] rounded-full text-xs font-medium">
                    Class Reminders
                  </span>
                  <span className="px-3 py-1 bg-[#278DD4]/10 text-[#278DD4] rounded-full text-xs font-medium">
                    Availability Updates
                  </span>
                  <span className="px-3 py-1 bg-[#24D3BF]/10 text-[#24D3BF] rounded-full text-xs font-medium">
                    Important News
                  </span>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white font-semibold py-3 h-auto"
              >
                Continue to App
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-0" style={{ border: 'none', outline: 'none' }}>
        {renderContent()}
      </div>
    </div>
  );
}