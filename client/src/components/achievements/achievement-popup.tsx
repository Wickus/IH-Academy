import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Badge from "./badge";
import type { Achievement } from "@shared/schema";

interface AchievementPopupProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementPopup({ 
  achievement, 
  isOpen, 
  onClose 
}: AchievementPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Popup content */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Celebration particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{
                    x: "50%",
                    y: "50%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
            
            {/* Content */}
            <div className="text-center space-y-6">
              {/* Badge */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 15, 
                  stiffness: 200,
                  delay: 0.2 
                }}
              >
                <Badge
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  color={achievement.color}
                  points={achievement.points}
                  isUnlocked={true}
                  isNew={true}
                  size="lg"
                />
              </motion.div>
              
              {/* Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  Achievement Unlocked!
                </h2>
                <h3 className="text-lg font-semibold text-blue-600">
                  {achievement.name}
                </h3>
                <p className="text-gray-600">
                  {achievement.description}
                </p>
                <div className="text-sm text-green-600 font-medium">
                  +{achievement.points} points earned
                </div>
              </motion.div>
              
              {/* Action button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Awesome!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}