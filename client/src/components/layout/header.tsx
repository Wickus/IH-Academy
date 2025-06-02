import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Plus, LogOut, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: api.getSports,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.removeQueries();
      window.location.reload();
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

  return (
    <header className="bg-gradient-to-r from-[#20366B] to-[#278DD4] shadow-lg border-b border-[#278DD4]/20 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="lg:hidden p-2 hover:bg-white/10 text-white">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user?.role === 'global_admin' ? 'Global Admin Dashboard' : 'Dashboard'}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative p-2 hover:bg-white/10 text-white"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#24D367] text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-[#20366B]">Notifications</h3>
                    <p className="text-sm text-slate-600">You have 3 new notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {mockNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'booking' ? 'bg-[#24D367]' :
                            notification.type === 'payment' ? 'bg-[#278DD4]' : 'bg-[#24D3BF]'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#20366B] text-sm">{notification.title}</p>
                            <p className="text-slate-600 text-sm mt-1">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-2">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-200">
                    <Button 
                      variant="ghost" 
                      className="w-full text-[#278DD4] hover:bg-[#278DD4]/10"
                      onClick={handleViewAllNotifications}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                className="bg-[#24D367] hover:bg-[#24D367]/90 text-white shadow-md"
                onClick={handleNewClassClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Class</span>
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 text-white border border-white/20">
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
