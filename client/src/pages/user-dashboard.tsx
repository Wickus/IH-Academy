import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Calendar, 
  Trophy, 
  Users, 
  BookOpen, 
  Download,
  Activity,
  Star,
  Clock,
  MapPin,
  LogOut,
  Settings,
  ChevronDown
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import ChildrenManagement from "@/components/profile/children-management";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import OrganizationDashboard from "@/pages/organization-dashboard";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization, isLoading: orgLoading, hasOrganization } = useOrganization();
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["/api/bookings", currentUser?.email],
    queryFn: () => currentUser ? api.getBookings({ email: currentUser.email }) : Promise.resolve([]),
    enabled: !!currentUser,
  });

  // Fetch user's organizations (organizations they belong to)
  const { data: userOrganizations = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!currentUser,
  });

  // Fetch all organizations for discovery purposes
  const { data: followedOrganizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    queryFn: api.getOrganizations,
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Clear user data and invalidate auth query to trigger state change
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Force page reload to ensure clean state
      window.location.href = '/';
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join organization with invite code
  const joinMutation = useMutation({
    mutationFn: (code: string) => api.joinOrganizationByInviteCode(code),
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `You've joined ${data.organization.name}`,
      });
      setInviteCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join organization",
        variant: "destructive",
      });
    },
  });

  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      joinMutation.mutate(inviteCode.trim());
    }
  };

  // Wait for organization data before rendering anything
  if (!currentUser || orgLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#278DD4] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is an organization admin and belongs to an organization, show organization dashboard
  if (hasOrganization && organization && currentUser?.role === 'organization_admin') {
    return <OrganizationDashboard user={currentUser} organization={organization} />;
  }

  const upcomingBookings = myBookings.filter(booking => 
    new Date(booking.class?.startTime || '') > new Date()
  );

  const pastBookings = myBookings.filter(booking => 
    new Date(booking.class?.startTime || '') <= new Date()
  );

  const downloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#20366B] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#20366B]">
                {currentUser.firstName || currentUser.username}
              </h2>
              <p className="text-slate-600">{currentUser.email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Account</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setLocation('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {currentUser.firstName || currentUser.username}!</h1>
                  <p className="text-white/80 text-lg">Ready for your next adventure?</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{myBookings.length}</div>
                <div className="text-white/80">Total Bookings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/discover')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Upcoming Classes</p>
                  <p className="text-2xl font-bold text-[#20366B]">{upcomingBookings.length}</p>
                </div>
                <div className="p-3 bg-[#278DD4]/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-[#278DD4]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/achievements')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed Classes</p>
                  <p className="text-2xl font-bold text-[#20366B]">{pastBookings.length}</p>
                </div>
                <div className="p-3 bg-[#24D367]/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-[#24D367]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/discover')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Organizations</p>
                  <p className="text-2xl font-bold text-[#20366B]">{userOrganizations.length}</p>
                </div>
                <div className="p-3 bg-[#24D3BF]/10 rounded-lg">
                  <Users className="h-6 w-6 text-[#24D3BF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/achievements')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Activity Score</p>
                  <p className="text-2xl font-bold text-[#20366B]">{myBookings.length * 10}</p>
                </div>
                <div className="p-3 bg-[#D3BF24]/10 rounded-lg">
                  <Activity className="h-6 w-6 text-[#D3BF24]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Code Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Have an invite code?</h3>
            <p className="text-white/80 mb-4">Join an organization instantly with their invite code</p>
            <div className="flex gap-3">
              <Input
                placeholder="Enter invite code (e.g., ORG00259360B7)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/60"
              />
              <Button
                onClick={handleJoinWithCode}
                disabled={!inviteCode.trim() || joinMutation.isPending}
                className="bg-white text-blue-600 hover:bg-white/90 px-8"
              >
                {joinMutation.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  "Join"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => setLocation('/discover')} 
            className="bg-[#278DD4] hover:bg-[#20366B] text-white"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Discover Classes
          </Button>
          <Button 
            onClick={() => setLocation('/book')} 
            className="bg-[#24D367] hover:bg-[#1FB55A] text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Book a Class
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>My Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>My Children</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming Bookings */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Upcoming Classes ({upcomingBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: any) => (
                      <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="outline" className="bg-[#278DD4]/10 text-[#278DD4] border-[#278DD4]/20">
                                {booking.class?.sport?.name || 'Sport'}
                              </Badge>
                              <h3 className="font-semibold text-[#20366B]">{booking.class?.name}</h3>
                              <Badge 
                                variant={booking.paymentStatus === 'confirmed' ? 'default' : 'destructive'}
                                className={booking.paymentStatus === 'confirmed' ? 'bg-[#24D367]' : ''}
                              >
                                {booking.paymentStatus}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatDateTime(booking.class?.startTime)}</span>
                              </div>
                              {booking.class?.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.class.location}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{formatCurrency(Number(booking.amount))}</span>
                              </div>
                            </div>
                            {booking.participantName !== currentUser.username && (
                              <div className="mt-2">
                                <Badge variant="outline" className="bg-[#24D3BF]/10 text-[#24D3BF] border-[#24D3BF]/20">
                                  Booked for: {booking.participantName}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadIcal(booking.id)}
                              className="text-[#278DD4] border-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              iCal
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-[#20366B] mb-2">No upcoming classes</h3>
                    <p className="text-slate-600 mb-4">
                      Ready to book your next adventure? Explore available classes and join the fun!
                    </p>
                    <Button 
                      className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                      onClick={() => window.location.href = '/public-discovery'}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Explore Classes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#20366B]">
                    <Trophy className="mr-2 h-5 w-5" />
                    Completed Classes ({pastBookings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {pastBookings.slice(0, 5).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-[#24D367] rounded-full"></div>
                          <div>
                            <p className="font-medium text-[#20366B]">{booking.class?.name}</p>
                            <p className="text-sm text-slate-600">{formatDateTime(booking.class?.startTime)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-[#24D367]/10 text-[#24D367] border-[#24D367]/20">
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="children">
            <ChildrenManagement userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-[#278DD4]/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Star className="h-8 w-8 text-[#278DD4]" />
                        <div>
                          <p className="text-2xl font-bold text-[#20366B]">{myBookings.length * 10}</p>
                          <p className="text-sm text-slate-600">Activity Points</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-[#24D367]/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-8 w-8 text-[#24D367]" />
                        <div>
                          <p className="text-2xl font-bold text-[#20366B]">{Math.floor(myBookings.length / 5)}</p>
                          <p className="text-sm text-slate-600">Milestones Reached</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#20366B] mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {myBookings.slice(0, 5).map((booking: any) => (
                        <div key={booking.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-2 h-2 bg-[#278DD4] rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-[#20366B]">
                              Joined {booking.class?.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {formatDateTime(booking.bookingDate)} • +10 points
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}