import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface BadgeProps {
  name: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  isUnlocked: boolean;
  isNew?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function Badge({ 
  name, 
  description, 
  icon, 
  color, 
  points, 
  isUnlocked, 
  isNew = false,
  size = "md",
  onClick 
}: BadgeProps) {
  // Get the Lucide icon component
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Trophy;
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-24 h-24"
  };
  
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer group",
        onClick && "hover:scale-105"
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: isNew ? 0.2 : 0 
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Glow effect for unlocked badges */}
      {isUnlocked && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-md opacity-50",
            sizeClasses[size]
          )}
          style={{ backgroundColor: color }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main badge */}
      <motion.div
        className={cn(
          "relative rounded-full border-4 flex items-center justify-center",
          sizeClasses[size],
          isUnlocked 
            ? "border-white shadow-lg" 
            : "border-gray-300 opacity-50 grayscale"
        )}
        style={{
          backgroundColor: isUnlocked ? color : "#E5E7EB",
          boxShadow: isUnlocked ? `0 0 20px ${color}40` : "none"
        }}
      >
        <IconComponent 
          className={cn(
            iconSizes[size],
            isUnlocked ? "text-white" : "text-gray-400"
          )}
        />
        
        {/* New badge indicator */}
        {isNew && isUnlocked && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="w-full h-full bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ 
                duration: 1, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </motion.div>
      
      {/* Points indicator */}
      {isUnlocked && size !== "sm" && (
        <motion.div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          +{points}
        </motion.div>
      )}
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
        <div className="font-semibold">{name}</div>
        <div className="text-gray-300 text-xs">{description}</div>
        {!isUnlocked && (
          <div className="text-yellow-400 text-xs mt-1">🔒 Locked</div>
        )}
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </motion.div>
  );
}