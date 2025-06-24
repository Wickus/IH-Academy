import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, type OrganizationDashboardStats, type Organization, type User } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { generateInviteEmailTemplate } from "@/lib/email-templates";
import { Users, Calendar, TrendingUp, DollarSign, Plus, Settings, UserPlus, BarChart3, Copy, ExternalLink, Share2, Mail } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentBookings from "@/components/dashboard/recent-bookings";
import WeeklyCalendar from "@/components/dashboard/weekly-calendar";
import CoachAttendance from "@/components/dashboard/coach-attendance";
import OrganizationSetupFlow from "@/components/onboarding/organization-setup-flow";
import { TrialBanner } from "@/components/trial-banner";

interface OrganizationDashboardProps {
  user: User;
  organization: Organization;
}

export default function OrganizationDashboard({ user: propUser, organization: propOrganization }: OrganizationDashboardProps = {}) {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  // Get current user if not provided via props
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !propUser,
  });

  const user = propUser || currentUser;

  // Get search params to handle global admin access
  const searchParams = new URLSearchParams(window.location.search);
  const globalAdminAccess = searchParams.get('globalAdminAccess') === 'true';
  const orgIdFromParams = searchParams.get('orgId');

  // Determine which organization to show
  let targetOrganizationId = null;
  
  if (user?.role === 'global_admin' && globalAdminAccess && orgIdFromParams) {
    // Global admin accessing specific organization
    targetOrganizationId = parseInt(orgIdFromParams);
  } else if (propOrganization) {
    // Organization provided via props
    targetOrganizationId = propOrganization.id;
  }

  // Fetch organization data if needed
  const { data: fetchedOrganization } = useQuery({
    queryKey: [`/api/organizations/${targetOrganizationId}`],
    enabled: !!targetOrganizationId && !propOrganization,
  });

  const organization = propOrganization || fetchedOrganization;

  // Check if organization needs onboarding (new organization with default settings)
  useEffect(() => {
    if (organization) {
      const needsOnboarding = (
        organization.planType === 'free' &&
        organization.primaryColor === '#20366B' &&
        organization.secondaryColor === '#278DD4' &&
        organization.accentColor === '#24D367' &&
        !organization.logo &&
        (!organization.membershipPrice || organization.membershipPrice === '299.00')
      );
      
      if (needsOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [organization]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/stats/organization/${organization?.id}`],
    queryFn: () => api.getOrganizationStats(organization.id),
    enabled: !!organization?.id,
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => api.getClasses(),
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: () => api.getBookings(),
  });

  if (statsLoading || classesLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Trial Banner */}
      {organization.subscriptionStatus === 'trial' && (
        <TrialBanner 
          organizationId={organization.id} 
          organizationColors={{
            primaryColor: organization.primaryColor,
            secondaryColor: organization.secondaryColor,
            accentColor: organization.accentColor
          }}
        />
      )}

      {/* Custom Header with Organization Branding */}
      <div 
        className="rounded-lg p-6 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${organization.primaryColor} 0%, ${organization.secondaryColor} 100%)` 
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{organization.name} Dashboard</h1>
            <p className="text-white/90 mt-2">
              Welcome back, {user.firstName}! Here's your organization overview.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Badge 
                className="bg-white/20 text-white border-white/30"
              >
                {organization.subscriptionStatus === 'trial' ? 'Free Trial' : `${organization.planType} Plan`}
              </Badge>
              <span className="text-white/80 text-sm">
                {stats?.totalMembers || 0} members • {stats?.activeClasses || 0} active classes
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="gap-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              onClick={() => setLocation('/settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant="secondary" 
              className="gap-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              onClick={() => setLocation('/classes')}
            >
              <Plus className="h-4 w-4" />
              New Class
            </Button>
          </div>
        </div>
        
        {/* Invite Code Section */}
        {organization.inviteCode && (
          <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-white mb-1">
                  Share Your Organization
                </h3>
                <p className="text-white/80 text-sm mb-3">
                  Invite new members with your branded link or quick code
                </p>
                
                {/* Branded Invite Link */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/invite/${organization.inviteCode}`}
                      readOnly
                      className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/60 text-sm"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/20"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${organization.inviteCode}`);
                        toast({
                          title: "Copied!",
                          description: "Branded invite link copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/20"
                      onClick={() => {
                        window.open(`/invite/${organization.inviteCode}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Code */}
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm">Quick code:</span>
                    <code className="bg-white/20 px-2 py-1 rounded text-white font-mono text-sm">
                      {organization.inviteCode}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 p-1"
                      onClick={() => {
                        navigator.clipboard.writeText(organization.inviteCode || '');
                        toast({
                          title: "Copied!",
                          description: "Invite code copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex gap-2">
                <Button
                  size="sm"
                  className="gap-2 bg-white text-black hover:bg-white/90"
                  onClick={() => {
                    const { subject, body } = generateInviteEmailTemplate(organization);
                    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(emailUrl, '_blank');
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => {
                    const shareData = {
                      title: `Join ${organization.name}`,
                      text: `You're invited to join ${organization.name} for sports activities!`,
                      url: `${window.location.origin}/invite/${organization.inviteCode}`
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                      toast({
                        title: "Copied!",
                        description: "Invite message copied to clipboard",
                      });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Organization-Specific Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.primaryColor }}
          onClick={() => setLocation('/bookings-management')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              For your organization
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.secondaryColor }}
          onClick={() => setLocation('/members-management')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered members
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.accentColor }}
          onClick={() => setLocation('/payments')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From bookings
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.primaryColor }}
          onClick={() => setLocation('/classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled classes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                style={{ 
                  borderColor: organization.secondaryColor,
                  color: organization.primaryColor 
                }}
                onClick={() => setLocation('/bookings-management')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{booking.participantName}</p>
                        <p className="text-xs text-muted-foreground">{booking.participantEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{booking.class?.name}</p>
                      <Badge 
                        variant={booking.paymentStatus === 'confirmed' ? 'default' : 'secondary'}
                        style={{ 
                          backgroundColor: booking.paymentStatus === 'confirmed' ? organization.accentColor : undefined,
                          borderColor: booking.paymentStatus === 'pending' ? organization.secondaryColor : undefined
                        }}
                      >
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes && classes.length > 0 ? (
                classes.slice(0, 3).map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{classItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(classItem.startTime).toLocaleDateString()} at{' '}
                        {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{classItem.availableSpots}/{classItem.capacity} spots</p>
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: organization.primaryColor,
                          color: organization.primaryColor 
                        }}
                      >
                        {classItem.sport?.name}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming classes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>Monitor your plan limits and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classes Used</span>
                <span>{stats?.activeClasses || 0} / {organization.maxClasses}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((stats?.activeClasses || 0) / organization.maxClasses) * 100, 100)}%`,
                    backgroundColor: organization.secondaryColor
                  }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Members</span>
                <span>{stats?.totalMembers || 0} / {organization.maxMembers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((stats?.totalMembers || 0) / organization.maxMembers) * 100, 100)}%`,
                    backgroundColor: organization.secondaryColor
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Setup Flow */}
      {showOnboarding && (
        <OrganizationSetupFlow
          isOpen={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          organization={organization}
        />
      )}
    </div>
  );
}