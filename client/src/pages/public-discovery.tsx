import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, type Organization, type Class } from "@/lib/api";
import { formatCurrency, formatTime } from "@/lib/utils";
import { MapPin, Clock, Users, Search, Heart, Calendar, User, LogOut, Settings, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SimpleNotificationModal from "@/components/simple-notification-modal";

export default function PublicDiscovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const { data: upcomingClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => api.getClasses(),
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

  // Show notification setup for new users
  useEffect(() => {
    if (user) {
      const hasSeenNotificationSetup = localStorage.getItem('hasSeenNotificationSetup');
      if (!hasSeenNotificationSetup) {
        setShowNotificationSetup(true);
      }
    }
  }, [user]);

  const filteredOrganizations = organizations?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const followMutation = useMutation({
    mutationFn: async (org: Organization) => {
      if (org.isFollowing) {
        return api.unfollowOrganization(org.id);
      } else {
        return api.followOrganization(org.id);
      }
    },
    onSuccess: (_, org) => {
      toast({
        title: org.isFollowing ? "Organisation unfollowed" : "Organisation followed!",
        description: org.isFollowing ? "You are no longer following this organisation." : "You can now view their classes and book sessions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  if (orgsLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sports organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367]">
      {/* Navigation Header */}
      <div className="relative px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">IH</span>
            </div>
            <h1 className="text-xl font-bold text-white">ItsHappening.Africa</h1>
          </div>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{user.firstName || user.username}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-0 shadow-lg rounded-xl">
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                  <User className="h-4 w-4 text-slate-600" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-red-50 text-red-600"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="relative py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">
            Discover Sports Organisations
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Find and follow your favorite sports academies, clubs, and training facilities
          </p>
          
          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5" />
            <Input
              placeholder="Search organisations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 text-slate-900 bg-white/95 backdrop-blur border-0 rounded-xl shadow-lg focus:ring-2 focus:ring-white/50 focus:bg-white transition-all"
            />
          </div>
          
          {/* Test Notification Button */}
          <div className="mt-4">
            <Button
              onClick={() => setShowNotificationSetup(true)}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white backdrop-blur"
            >
              Setup Notifications
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-slate-50 min-h-screen rounded-t-3xl relative -mt-8 pt-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Featured Classes */}
          <Card className="border-0 bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <Calendar className="h-6 w-6" />
                Upcoming Classes
              </CardTitle>
              <CardDescription className="text-white/90">
                Book sessions happening soon across all organisations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingClasses?.slice(0, 6).map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-all border-0 shadow-md rounded-xl">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-slate-900">{classItem.name}</h3>
                          <Badge variant="outline" className="border-[#24D367] text-[#24D367]">
                            {classItem.sport?.name}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(classItem.startTime)}</span>
                          </div>
                          {classItem.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{classItem.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{classItem.availableSpots} spots available</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg text-[#20366B]">{formatCurrency(classItem.price)}</span>
                          <Link href={`/book?class=${classItem.id}`}>
                            <Button size="sm" className="bg-[#24D367] hover:bg-[#24D367]/90 text-white border-0">
                              Book Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Organizations Grid */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Sports Organizations</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizations.map((org) => (
                <Card key={org.id} className="hover:shadow-xl transition-all border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: org.primaryColor || '#20366B' }}
                      >
                        {org.name.charAt(0)}
                      </div>
                      <Button
                        variant={org.isFollowing ? "default" : "outline"}
                        size="sm"
                        onClick={() => followMutation.mutate(org)}
                        disabled={followMutation.isPending}
                        className={`gap-2 transition-all ${
                          org.isFollowing 
                            ? "bg-[#24D367] text-white hover:bg-[#24D367]/90 border-[#24D367]" 
                            : "border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${org.isFollowing ? "fill-current" : ""}`} />
                        {followMutation.isPending ? "Updating..." : org.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                    <div className="mt-4">
                      <CardTitle className="text-xl text-slate-900 font-bold">{org.name}</CardTitle>
                      <CardDescription className="mt-2 text-slate-600">
                        {org.description || "Sports training and coaching"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      {org.address && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4" />
                          <span>{org.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="border-2 font-medium"
                          style={{ 
                            borderColor: org.secondaryColor || '#278DD4',
                            color: org.secondaryColor || '#278DD4'
                          }}
                        >
                          {org.planType || 'Free'}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          Up to {org.maxClasses || 10} classes
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Link href={`/organizations/${org.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/organizations/${org.id}/classes`} className="flex-1">
                        <Button 
                          className="w-full text-white border-0 shadow-md hover:shadow-lg transition-all"
                          style={{ backgroundColor: org.primaryColor || '#20366B' }}
                        >
                          View Classes
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredOrganizations.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-slate-600">No organizations found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <SimpleNotificationModal 
        isOpen={showNotificationSetup}
        onClose={() => {
          localStorage.setItem('hasSeenNotificationSetup', 'true');
          setShowNotificationSetup(false);
        }}
      />
    </div>
  );
}