import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type Organization } from "@/lib/api";
import { formatTime, formatDate, formatCurrency } from "@/lib/utils";
import { 
  Calendar, 
  Users, 
  TrendingUp,
  Settings,
  DollarSign,
  BookOpen,
  UserCheck,
  Bell,
  Menu,
  Search,
  Plus,
  ChevronRight,
  Activity,
  Eye,
  Share2,
  Copy,
  Clock,
  MapPin,
  Building2,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BrandHeader from "@/components/brand-header";

interface MobileAdminProps {
  user: any;
}

export default function MobileAdmin({ user }: MobileAdminProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's organization
  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
  });

  const organization = userOrganizations?.[0]; // Admin typically manages one organization

  // Fetch organization stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats/organization', organization?.id],
    queryFn: () => organization ? api.getOrganizationStats(organization.id) : Promise.resolve(null),
    enabled: !!organization,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes', { organizationId: organization?.id }],
    queryFn: () => organization ? api.getClasses({ organizationId: organization.id }) : Promise.resolve([]),
    enabled: !!organization,
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/bookings', { organizationId: organization?.id }],
    queryFn: () => organization ? api.getBookings({ organizationId: organization.id }) : Promise.resolve([]),
    enabled: !!organization,
  });

  // Fetch coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/coaches', { organizationId: organization?.id }],
    queryFn: () => organization ? api.getCoaches({ organizationId: organization.id }) : Promise.resolve([]),
    enabled: !!organization,
  });

  const todaysClasses = classes.filter(cls => {
    const classDate = new Date(cls.startTime);
    const today = new Date();
    return classDate.toDateString() === today.toDateString();
  });

  const upcomingClasses = classes.filter(cls => new Date(cls.startTime) > new Date()).slice(0, 5);
  const pendingBookings = bookings.filter(booking => booking.paymentStatus === 'pending');
  const todaysRevenue = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.createdAt || '');
      const today = new Date();
      return bookingDate.toDateString() === today.toDateString() && booking.paymentStatus === 'confirmed';
    })
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const copyInviteCode = () => {
    if (organization?.inviteCode) {
      navigator.clipboard.writeText(organization.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const shareInviteLink = () => {
    if (organization?.inviteCode) {
      const inviteUrl = `${window.location.origin}/invite/${organization.inviteCode}`;
      if (navigator.share) {
        navigator.share({
          title: `Join ${organization.name}`,
          text: `You're invited to join ${organization.name}!`,
          url: inviteUrl,
        });
      } else {
        navigator.clipboard.writeText(inviteUrl);
        toast({
          title: "Copied!",
          description: "Invite link copied to clipboard",
        });
      }
    }
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Organization Branding */}
      <div className="sticky top-0 z-50">
        <div 
          className="p-4 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${organization.primaryColor} 0%, ${organization.secondaryColor} 100%)` 
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {organization.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-bold text-lg">{organization.name}</h1>
                <p className="text-sm opacity-80">Admin Portal</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-lg font-bold">{todaysClasses.length}</div>
              <div className="text-xs opacity-80">Today's Classes</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-lg font-bold">{pendingBookings.length}</div>
              <div className="text-xs opacity-80">Pending Payments</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-lg font-bold">R{formatCurrency(todaysRevenue)}</div>
              <div className="text-xs opacity-80">Today's Revenue</div>
            </div>
          </div>
        </div>

        {/* Invite Code Section */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Organization Invite</h3>
              <p className="text-sm text-gray-600">Code: {organization.inviteCode}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={shareInviteLink} style={{ backgroundColor: organization.primaryColor }}>
                <Share2 className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full h-12 bg-white border-b border-gray-200 rounded-none p-0">
          <TabsTrigger value="overview" className="flex-1 h-12 rounded-none">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex-1 h-12 rounded-none">
            <Calendar className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 h-12 rounded-none">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 p-4 space-y-4">
          {/* Today's Classes */}
          {todaysClasses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg" style={{ color: organization.primaryColor }}>
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaysClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(cls.startTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls.bookingCount}/{cls.capacity}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: organization.secondaryColor, color: organization.secondaryColor }}
                    >
                      {cls.sport?.name}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pending Payments */}
          {pendingBookings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg" style={{ color: organization.primaryColor }}>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pending Payments ({pendingBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.participantName}</h4>
                      <p className="text-sm text-gray-600">{booking.class?.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(booking.class?.startTime || '')}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">R{formatCurrency(Number(booking.amount))}</div>
                      <Badge variant="destructive" className="text-xs">Pending</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="h-auto p-4 flex-col gap-2"
              style={{ backgroundColor: organization.primaryColor }}
              onClick={() => setSelectedTab("classes")}
            >
              <Plus className="h-5 w-5 text-white" />
              <span className="text-sm text-white">Add Class</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              style={{ borderColor: organization.secondaryColor, color: organization.secondaryColor }}
              onClick={() => setSelectedTab("members")}
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-sm">View Members</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-0 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Upcoming Classes */}
          <div className="space-y-3">
            {upcomingClasses
              .filter(cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((cls) => (
              <Card key={cls.id} className="border-l-4" style={{ borderLeftColor: organization.accentColor }}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                    <Badge variant="outline">{cls.sport?.name}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
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
                      <span>{cls.bookingCount}/{cls.capacity} booked</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      style={{ borderColor: organization.secondaryColor, color: organization.secondaryColor }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      style={{ backgroundColor: organization.primaryColor }}
                    >
                      <Settings className="h-4 w-4 mr-1 text-white" />
                      Edit
                    </Button>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: organization.accentColor,
                          width: `${(cls.bookingCount / cls.capacity) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-0 p-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: organization.primaryColor }}>
                  {stats?.totalMembers || 0}
                </div>
                <div className="text-sm text-gray-600">Active Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: organization.primaryColor }}>
                  {coaches.length}
                </div>
                <div className="text-sm text-gray-600">Active Coaches</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: organization.primaryColor }}>
                <BookOpen className="h-5 w-5 mr-2" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{booking.participantName}</h4>
                    <p className="text-sm text-gray-600">{booking.class?.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.createdAt || '')}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R{formatCurrency(Number(booking.amount))}</div>
                    <Badge 
                      variant={booking.paymentStatus === 'confirmed' ? 'default' : 'destructive'}
                      className={booking.paymentStatus === 'confirmed' ? 'bg-green-600' : ''}
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ backgroundColor: organization.primaryColor }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom safe area */}
      <div className="h-16"></div>
    </div>
  );
}