import { Button } from "@/components/ui/button";
import { Bell, Menu, User } from "lucide-react";

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
}

export default function BrandHeader({
  title = "ItsHappening.Africa",
  subtitle,
  showNotifications = true,
  showMenu = true,
  showProfile = false,
  onNotificationClick,
  onMenuClick,
  onProfileClick
}: BrandHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">IH</span>
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: 'Lato, sans-serif' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showNotifications && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onNotificationClick}
              className="text-primary hover:bg-primary/10"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}
          {showProfile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onProfileClick}
              className="text-primary hover:bg-primary/10"
            >
              <User className="h-5 w-5" />
            </Button>
          )}
          {showMenu && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMenuClick}
              className="text-primary hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}