import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, type Class, type Organization, type Booking } from "@/lib/api";
import { formatTime, formatDate, formatCurrency, getSportColor, generateICalEvent } from "@/lib/utils";
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Heart,
  Calendar,
  CreditCard,
  Home,
  Compass,
  BookOpen,
  User,
  Star,
  Filter,
  ChevronRight,
  Play,
  Baby,
  Plus,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
// import PushNotificationSetup from "@/components/push-notification-setup"; // Temporarily disabled
import BrandHeader from "@/components/brand-header";

interface MobileParticipantProps {
  user: any;
}

const childSchema = z.object({
  name: z.string().min(1, "Child's name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicalInfo: z.string().optional(),
});

type ChildFormData = z.infer<typeof childSchema>;

export default function MobileParticipant({ user }: MobileParticipantProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  // Notification setup disabled to fix service worker errors
  // const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating payment status
  const updatePaymentMutation = useMutation({
    mutationFn: ({ bookingId, paymentStatus }: { bookingId: number; paymentStatus: string }) =>
      api.updateBookingPayment(bookingId, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Payment Completed",
        description: "Your booking has been confirmed!",
      });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form for adding children
  const childForm = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      medicalInfo: "",
    },
  });

  // Fetch user's organizations
  const { data: userOrganizations, isLoading: userOrgsLoading } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user,
  });

  // Fetch classes only from organizations user belongs to
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes', 'user-organizations', userOrganizations?.map(org => org.id)],
    queryFn: async () => {
      if (!userOrganizations || userOrganizations.length === 0) {
        return [];
      }
      
      // Fetch classes from all user's organizations
      const allClasses = await Promise.all(
        userOrganizations.map(org => api.getClasses({ organizationId: org.id }))
      );
      
      // Flatten the array of arrays
      return allClasses.flat();
    },
    enabled: !!userOrganizations && userOrganizations.length > 0,
  });

  // Fetch all organizations for discovery (following/unfollowing)
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
  });

  // Fetch user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings', { email: user.email }],
    queryFn: () => api.getBookings({ email: user.email }),
  });

  // Fetch sports for filtering
  const { data: sports } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: () => api.getSports(),
  });

  // Fetch user's children
  const { data: children = [] } = useQuery({
    queryKey: ['/api/children'],
    queryFn: () => api.getUserChildren(),
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Create child mutation
  const createChildMutation = useMutation({
    mutationFn: api.createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({
        title: "Success",
        description: "Child added successfully",
      });
      setShowAddChild(false);
      childForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  // Handle add child form submission
  const handleAddChild = () => {
    const formData = childForm.getValues();
    if (!formData.name || !formData.dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in the child's name and date of birth",
        variant: "destructive",
      });
      return;
    }

    createChildMutation.mutate({
      name: formData.name,
      parentId: user.id,
      dateOfBirth: formData.dateOfBirth,
      medicalInfo: formData.medicalInfo || "",
      emergencyContact: user.firstName + " " + user.lastName,
      emergencyPhone: user.phone || "",
    });
  };

  const joinOrgMutation = useMutation({
    mutationFn: (inviteCode: string) => api.joinOrganizationByInviteCode(inviteCode),
    onSuccess: (data) => {
      toast({ 
        title: "Success!", 
        description: `You've joined ${data.organization.name}!` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setInviteCode("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to join organization.", 
        variant: "destructive" 
      });
    }
  });

  const handleJoinOrganization = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter an organization invite code.",
        variant: "destructive"
      });
      return;
    }
    joinOrgMutation.mutate(inviteCode.trim());
  };

  // Filter classes based on search and sport (only show future classes)
  const filteredClasses = classes?.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === "all" || cls.sport?.name === selectedSport;
    const isFuture = new Date(cls.startTime) > new Date();
    return matchesSearch && matchesSport && isFuture;
  }) || [];

  const upcomingBookings = bookings?.filter(booking => 
    booking.class && new Date(booking.class.startTime) > new Date()
  ) || [];

  const recentBookings = bookings?.filter(booking => 
    booking.class && new Date(booking.class.startTime) <= new Date()
  ).slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <BrandHeader 
        subtitle={`Hi ${user.firstName}, ready to train?`}
        showNotifications={false}
        showMenu={false}
        showProfile={true}
      />

      {/* Bottom Navigation */}
      <Tabs defaultValue="profile" className="w-full">
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#20366B] to-[#278DD4] border-t border-[#278DD4]/20 z-50">
          <TabsList className="w-full h-16 bg-transparent rounded-none p-0 grid grid-cols-3">
            <TabsTrigger value="bookings" className="flex-col h-16 rounded-none gap-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex-col h-16 rounded-none gap-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">
              <Star className="h-5 w-5" />
              <span className="text-xs">Organizations</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-col h-16 rounded-none gap-1 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discover" className="mt-0 pb-20">
          {/* Search and Filters */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search classes or organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedSport === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport("all")}
                  className="whitespace-nowrap"
                >
                  All Sports
                </Button>
                {sports?.map((sport) => (
                  <Button
                    key={sport.id}
                    variant={selectedSport === sport.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSport(sport.name)}
                    className="whitespace-nowrap"
                    style={selectedSport === sport.name ? { backgroundColor: sport.color } : {}}
                  >
                    {sport.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Classes */}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Available Classes</h2>
            <div className="space-y-3">
              {classesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading classes...</p>
                </div>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <Card key={cls.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div 
                        className="h-32 bg-gradient-to-r p-4 text-white relative"
                        style={{ 
                          background: `linear-gradient(135deg, ${cls.organization?.primaryColor || '#6366f1'} 0%, ${cls.organization?.secondaryColor || '#8b5cf6'} 100%)` 
                        }}
                      >
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/20 text-white border-white/30">
                            {cls.sport?.name}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-bold text-lg">{cls.name}</h3>
                          <p className="text-white/90 text-sm">{cls.organization?.name}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(cls.startTime)} at {formatTime(cls.startTime)}</span>
                          </div>
                          {cls.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{cls.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{cls.availableSpots} spots available</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(cls.price)}
                          </div>
                          <Link href={`/book?class=${cls.id}`}>
                            <Button>
                              Book Now
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No classes found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-0 pb-20">
          <div className="p-4">
            {/* Upcoming Bookings */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Upcoming Sessions</h2>
              <div className="space-y-3">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{booking.class?.name}</h3>
                          <Badge 
                            variant={booking.paymentStatus === 'confirmed' ? 'default' : 'secondary'}
                            className={booking.paymentStatus === 'confirmed' ? 'bg-green-600' : ''}
                          >
                            {booking.paymentStatus}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.class!.startTime)} at {formatTime(booking.class!.startTime)}</span>
                          </div>
                          {booking.class?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.class.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{formatCurrency(booking.amount)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10"
                            onClick={() => {
                              toast({
                                title: "Booking Details",
                                description: `Viewing details for ${booking.class?.name} on ${formatDate(booking.class!.startTime)}`,
                              });
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10"
                            onClick={async () => {
                              try {
                                await api.downloadIcal(booking.id);
                                toast({
                                  title: "Calendar Event",
                                  description: `Calendar file downloaded: ${booking.class?.name}`,
                                });
                              } catch (error) {
                                console.error('Calendar download error:', error);
                                toast({
                                  title: "Download Error",
                                  description: "Failed to download calendar event",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                        {booking.paymentStatus === 'pending' && (
                          <div className="mt-2">
                            <Button 
                              size="sm"
                              className="w-full bg-[#24D367] hover:bg-[#24D367]/90 text-white"
                              disabled={updatePaymentMutation.isPending}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toast({
                                  title: "Processing Payment",
                                  description: `Processing payment for ${formatCurrency(booking.amount)} - ${booking.class?.name}`,
                                });
                                // Update the booking payment status
                                updatePaymentMutation.mutate({
                                  bookingId: booking.id,
                                  paymentStatus: 'confirmed'
                                });
                              }}
                            >
                              {updatePaymentMutation.isPending ? 'Processing...' : `Complete Payment • ${formatCurrency(booking.amount)}`}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming bookings</p>
                    <p className="text-sm text-gray-400">Book a class to get started!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Recent Activity</h2>
              <div className="space-y-3">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <Card key={booking.id} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{booking.class?.name}</h3>
                          <Badge variant="outline">
                            Completed
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.class!.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{formatCurrency(booking.amount)}</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10"
                          onClick={() => {
                            toast({
                              title: "Rebooking",
                              description: `Ready to book ${booking.class?.name} again`,
                            });
                          }}
                        >
                          Book Again
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="mt-0 pb-20">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Join Organization</h2>
            
            {/* Join Organization Section */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Organization Invite Code</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter the invite code provided by your organization to join their classes and activities.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter invite code (e.g., ORG001ABC123)"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleJoinOrganization}
                      disabled={joinOrgMutation.isPending || !inviteCode.trim()}
                      className="bg-[#278DD4] hover:bg-[#20366B] text-white"
                    >
                      {joinOrgMutation.isPending ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Organizations Section */}
            <h3 className="text-md font-medium mb-3 text-gray-900">My Organizations</h3>
            <div className="space-y-3">
              {userOrgsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading your organizations...</p>
                </div>
              ) : userOrganizations && userOrganizations.length > 0 ? (
                userOrganizations.map((org) => (
                  <Card key={org.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: org.primaryColor }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{org.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge 
                              variant="outline"
                              style={{ borderColor: org.secondaryColor, color: org.secondaryColor }}
                            >
                              Member
                            </Badge>
                            <Badge 
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {org.planType}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            style={{ backgroundColor: org.primaryColor }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('View Classes clicked for org:', org.id);
                              setLocation(`/organizations/${org.id}/classes`);
                            }}
                          >
                            View Classes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No organizations joined yet</p>
                  <p className="text-sm text-gray-400">Use an invite code above to join your first organization</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 pb-20">
          <div className="p-4">
            {/* Profile Header */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardContent className="p-6 text-center bg-gradient-to-br from-[#20366B] to-[#278DD4] text-white rounded-lg">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-[#24D367] to-[#24D3BF] text-[#20366B] text-2xl font-bold">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-white/80">{user.email}</p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {user.role === 'member' ? 'Member' : user.role}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 text-center bg-gradient-to-br from-[#24D367] to-[#24D3BF] text-white rounded-lg">
                  <div className="text-2xl font-bold text-white">{bookings?.length || 0}</div>
                  <div className="text-sm text-white/80">Total Bookings</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 text-center bg-gradient-to-br from-[#278DD4] to-[#20366B] text-white rounded-lg">
                  <div className="text-2xl font-bold text-white">{upcomingBookings.length}</div>
                  <div className="text-sm text-white/80">Upcoming</div>
                </CardContent>
              </Card>
            </div>

            {/* Push Notification Setup temporarily disabled */}

            {/* Children Section */}
            <Card className="mb-6">
              <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
                <CardTitle className="flex items-center">
                  <Baby className="mr-2 h-5 w-5" />
                  Children ({children?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {children && children.length > 0 ? (
                  <div className="space-y-3">
                    {children.map((child: any) => (
                      <div key={child.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[#278DD4]/10 rounded-lg">
                              <Baby className="h-4 w-4 text-[#278DD4]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#20366B]">{child.name}</p>
                              <p className="text-sm text-slate-600">Age {child.age}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Baby className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <p className="text-slate-600 mb-3">No children added yet</p>
                    <Button
                      size="sm"
                      onClick={() => setShowAddChild(true)}
                      className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Child
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Actions */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-[#278DD4]/20 hover:bg-[#278DD4]/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit Profile clicked');
                  setLocation('/edit-profile');
                }}
              >
                <User className="h-5 w-5 mr-3 text-[#278DD4]" />
                <span className="text-[#20366B]">Edit Profile</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[#278DD4]" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-[#278DD4]/20 hover:bg-[#278DD4]/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Payment Methods clicked');
                  setLocation('/payment-methods');
                }}
              >
                <CreditCard className="h-5 w-5 mr-3 text-[#278DD4]" />
                <span className="text-[#20366B]">Payment Methods</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[#278DD4]" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-[#278DD4]/20 hover:bg-[#278DD4]/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Favourite Organizations clicked');
                  setLocation('/favourite-organizations');
                }}
              >
                <Heart className="h-5 w-5 mr-3 text-[#278DD4]" />
                <span className="text-[#20366B]">Favourite Organisations</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[#278DD4]" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  // Clear user data and redirect to login
                  const logout = async () => {
                    try {
                      await api.logout();
                      toast({
                        title: "Signed Out",
                        description: "You have been successfully signed out",
                      });
                      // Force reload to clear all state
                      window.location.href = '/';
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to sign out. Please try again.",
                        variant: "destructive",
                      });
                    }
                  };
                  logout();
                }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Sign Out</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Push Notification Modal - temporarily disabled */}

      {/* Add Child Modal */}
      <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-[#20366B] flex items-center">
              <Baby className="mr-2 h-5 w-5" />
              Add Child
            </DialogTitle>
          </DialogHeader>
          <Form {...childForm}>
            <form className="space-y-4 py-4">
              <FormField
                control={childForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#20366B]">Child's Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter child's full name" className="border-[#278DD4]/30 focus:border-[#278DD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={childForm.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#20366B]">Date of Birth</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="border-[#278DD4]/30 focus:border-[#278DD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={childForm.control}
                name="medicalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#20366B]">Medical Information (Optional)</FormLabel>
                    <div className="text-xs text-slate-600 mb-2 p-2 bg-slate-50 rounded border-l-4 border-[#24D367]">
                      <strong>What to include:</strong> Food allergies, medical conditions (asthma, diabetes, epilepsy), medications being taken, emergency contact restrictions, or any special care instructions coaches should know about.
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Allergic to nuts, has asthma inhaler, diabetic" className="border-[#278DD4]/30 focus:border-[#278DD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddChild(false)}
                className="flex-1 border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddChild}
                className="flex-1 bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
              >
                Add Child
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}