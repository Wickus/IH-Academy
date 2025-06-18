import { useEffect } from 'react';

interface SimpleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleNotificationModal({ isOpen, onClose }: SimpleNotificationModalProps) {
  // Notifications disabled - immediately close modal
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Return null to prevent any modal from showing
  return null;
}