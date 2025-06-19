import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Plus, LogOut, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/notifications-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClassForm from "@/components/forms/class-form";

export default function Header() {
  const [, setLocation] = useLocation();
  const [showNewClassDialog, setShowNewClassDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user && user.role !== 'global_admin'
  });

  const organization = userOrganizations?.[0];

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: api.getSports,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear user data and invalidate auth query to trigger state change
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const mockNotifications = [
    {
      id: 1,
      title: "New Class Booking",
      message: "Sarah Johnson booked Water Polo class for tomorrow at 2:00 PM",
      time: "2 minutes ago",
      type: "booking"
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Payment confirmed for Basketball class - R300.00",
      time: "1 hour ago",
      type: "payment"
    },
    {
      id: 3,
      title: "Class Reminder",
      message: "Tennis class starts in 30 minutes with 8 participants",
      time: "3 hours ago",
      type: "reminder"
    }
  ];

  const handleNewClassClick = () => {
    console.log("New Class button clicked"); // Debug log
    setShowNewClassDialog(true);
  };

  const handleViewAllNotifications = () => {
    setLocation("/notifications");
  };

  // For coaches, use ItsHappening.Africa colors instead of organization colors
  const isCoach = user?.role === 'coach';
  const primaryColor = isCoach ? '#20366B' : (organization?.primaryColor || '#20366B');
  const secondaryColor = isCoach ? '#278DD4' : (organization?.secondaryColor || '#278DD4');

  return (
    <header 
      className="shadow-lg px-4 lg:px-8 py-4"
      style={{
        background: user?.role === 'global_admin' 
          ? 'linear-gradient(to right, #20366B, #278DD4)'
          : `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
        borderBottom: `1px solid ${secondaryColor}20`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="lg:hidden p-2 hover:bg-white/10 text-white">
            <Menu className="h-5 w-5" />
          </Button>
          {!isCoach && organization?.logo && (
            <img 
              src={organization.logo} 
              alt={`${organization.name} logo`}
              className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user?.role === 'global_admin' ? 'Global Admin Dashboard' : 
               (!isCoach && organization?.name ? `${organization.name} Dashboard` : 'Dashboard')}
            </h2>
            <p className="text-sm text-white/80">
              {user?.role === 'global_admin' 
                ? 'Manage the entire ItsHappening.Africa platform' 
                : 'Manage your academy bookings and classes'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user?.role !== 'global_admin' && (
            <>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-2 hover:bg-white/10 text-white"
                  onClick={() => setLocation("/notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isCoach ? '#24D367' : (organization?.accentColor || '#24D367') }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              {user?.role === 'organization_admin' && (
                <Button 
                  className="text-white shadow-md"
                  style={{ 
                    backgroundColor: organization?.accentColor || '#24D367',
                    '--hover-bg': (organization?.accentColor || '#24D367') + '90'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    const color = organization?.accentColor || '#24D367';
                    e.currentTarget.style.backgroundColor = color + 'E6';
                  }}
                  onMouseLeave={(e) => {
                    const color = organization?.accentColor || '#24D367';
                    e.currentTarget.style.backgroundColor = color;
                  }}
                  onClick={handleNewClassClick}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">New Class</span>
                </Button>
              )}
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-white border border-white/20 hover:!bg-white/10"
                style={{ 
                  background: 'transparent !important',
                  backgroundColor: 'transparent !important'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty('background-color', 'rgba(255, 255, 255, 0.1)', 'important');
                  e.currentTarget.style.setProperty('background', 'rgba(255, 255, 255, 0.1)', 'important');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                  e.currentTarget.style.setProperty('background', 'transparent', 'important');
                }}
              >
                <User className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">{user?.username || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
              <DropdownMenuItem disabled className="text-slate-500">
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{user?.username}</span>
                  <span className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Class Dialog */}
      <Dialog open={showNewClassDialog} onOpenChange={setShowNewClassDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#20366B]">Create New Class</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <ClassForm 
              sports={sports || []}
              organizationId={user?.organizationId || 1}
              onSuccess={() => setShowNewClassDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
