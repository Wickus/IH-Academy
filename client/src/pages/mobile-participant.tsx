import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, type Class, type Organization, type Booking } from "@/lib/api";
import { formatTime, formatDate, formatCurrency, getSportColor } from "@/lib/utils";
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
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface MobileParticipantProps {
  user: any;
}

export default function MobileParticipant({ user }: MobileParticipantProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch public classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes', { public: true }],
    queryFn: () => api.getClasses({ public: true }),
  });

  // Fetch organizations
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

  const followOrgMutation = useMutation({
    mutationFn: (organizationId: number) => api.followOrganization(organizationId),
    onSuccess: () => {
      toast({ title: "Followed!", description: "You're now following this organization." });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to follow organization.", variant: "destructive" });
    }
  });

  // Filter classes based on search and sport
  const filteredClasses = classes?.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === "all" || cls.sport?.name === selectedSport;
    return matchesSearch && matchesSport;
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-white text-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-lg">Hi, {user.firstName}!</h1>
              <p className="text-sm text-gray-500">Ready to train?</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Tabs defaultValue="discover" className="w-full">
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <TabsList className="w-full h-16 bg-transparent rounded-none p-0 grid grid-cols-4">
            <TabsTrigger value="discover" className="flex-col h-16 rounded-none gap-1">
              <Compass className="h-5 w-5" />
              <span className="text-xs">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex-col h-16 rounded-none gap-1">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex-col h-16 rounded-none gap-1">
              <Star className="h-5 w-5" />
              <span className="text-xs">Following</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-col h-16 rounded-none gap-1">
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
                          <Button variant="outline" size="sm" className="flex-1">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
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
                        <Button variant="outline" size="sm" className="w-full">
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
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Sports Organizations</h2>
            <div className="space-y-3">
              {orgsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading organizations...</p>
                </div>
              ) : organizations && organizations.length > 0 ? (
                organizations.map((org) => (
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
                              {org.planType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Up to {org.maxClasses} classes
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              style={{ backgroundColor: org.primaryColor }}
                            >
                              View Classes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => followOrgMutation.mutate(org.id)}
                              disabled={followOrgMutation.isPending}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No organizations yet</p>
                  <p className="text-sm text-gray-400">Discover organizations in the explore tab</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 pb-20">
          <div className="p-4">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <Badge className="mt-2">
                  {user.role === 'member' ? 'Member' : user.role}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{bookings?.length || 0}</div>
                  <div className="text-sm text-gray-500">Total Bookings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{upcomingBookings.length}</div>
                  <div className="text-sm text-gray-500">Upcoming</div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Actions */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12">
                <User className="h-5 w-5 mr-3" />
                Edit Profile
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <CreditCard className="h-5 w-5 mr-3" />
                Payment Methods
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Heart className="h-5 w-5 mr-3" />
                Favorite Organizations
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-red-600 border-red-200">
                Sign Out
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}