import { useEffect } from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  // Notifications disabled - immediately close modal
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Return null to prevent any modal from showing
  return null;
}