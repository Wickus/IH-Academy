import { useState } from "react";
import { X, Bell, BellOff, CheckCircle } from "lucide-react";

interface SimpleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleNotificationModal({ isOpen, onClose }: SimpleNotificationModalProps) {
  const [currentStep, setCurrentStep] = useState<'permission' | 'unsupported' | 'success'>('permission');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setCurrentStep('unsupported');
        setIsLoading(false);
        return;
      }

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

  const modalStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: 'none',
    outline: 'none',
  };

  const headerStyle = {
    background: 'linear-gradient(to right, #20366B, #278DD4)',
    borderRadius: '16px 16px 0 0',
    padding: '32px',
    textAlign: 'center' as const,
    color: 'white',
    position: 'relative' as const,
  };

  const buttonStyle = {
    width: '100%',
    background: 'linear-gradient(to right, #278DD4, #24D367)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const secondaryButtonStyle = {
    width: '100%',
    background: 'transparent',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const closeButtonStyle = {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.8)',
  };

  if (currentStep === 'permission') {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <button
              onClick={onClose}
              style={closeButtonStyle}
            >
              <X size={16} />
            </button>
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <Bell size={32} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>Stay Updated</h2>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, lineHeight: '1.5' }}>
              Get instant notifications about class bookings, availability updates, and important announcements from your favourite organisations.
            </p>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(36, 211, 103, 0.1)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Bell size={16} color="#24D367" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#20366B', margin: '0 0 4px' }}>Class Reminders</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Never miss your booked sessions</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(39, 141, 212, 0.1)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CheckCircle size={16} color="#278DD4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#20366B', margin: '0 0 4px' }}>Real-time Updates</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Instant alerts when spots become available</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                style={buttonStyle}
              >
                {isLoading ? 'Setting up...' : 'Enable Notifications'}
              </button>
              
              <button
                onClick={onClose}
                style={secondaryButtonStyle}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'unsupported') {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <button
              onClick={onClose}
              style={closeButtonStyle}
            >
              <X size={16} />
            </button>
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <BellOff size={32} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>Notifications Unavailable</h2>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, lineHeight: '1.5' }}>
              Your browser doesn't support push notifications or permissions were denied.
            </p>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#20366B', margin: '0 0 8px' }}>Alternative Options:</h3>
              <ul style={{ fontSize: '14px', color: '#64748b', margin: 0, paddingLeft: '16px' }}>
                <li>Check your email regularly for updates</li>
                <li>Visit the app frequently to see new announcements</li>
                <li>Try using a different browser that supports notifications</li>
                <li>Ensure you're using a secure HTTPS connection</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              style={buttonStyle}
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <div style={{ 
            ...headerStyle, 
            background: 'linear-gradient(to right, #24D367, #24D3BF)' 
          }}>
            <button
              onClick={onClose}
              style={closeButtonStyle}
            >
              <X size={16} />
            </button>
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <CheckCircle size={32} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>You're All Set!</h2>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, lineHeight: '1.5' }}>
              Notifications are now enabled. You'll receive updates about your bookings and favourite organisations.
            </p>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px' }}>
                We'll send you notifications about:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: 'rgba(36, 211, 103, 0.1)', 
                  color: '#24D367', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '500' 
                }}>
                  Class Reminders
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: 'rgba(39, 141, 212, 0.1)', 
                  color: '#278DD4', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '500' 
                }}>
                  Availability Updates
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: 'rgba(36, 211, 191, 0.1)', 
                  color: '#24D3BF', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '500' 
                }}>
                  Important News
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={buttonStyle}
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}