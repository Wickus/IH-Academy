import { useEffect } from "react";

interface PushNotificationSetupProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function PushNotificationSetup({ onComplete, onDismiss }: PushNotificationSetupProps) {
  // Notifications temporarily disabled - don't render anything
  useEffect(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Return null to prevent any modal from showing
  return null;
}