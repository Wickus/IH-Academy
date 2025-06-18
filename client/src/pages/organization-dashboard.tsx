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
import { Users, Calendar, TrendingUp, DollarSign, Plus, Settings, UserPlus, BarChart3, Copy, ExternalLink, Share2 } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentBookings from "@/components/dashboard/recent-bookings";
import WeeklyCalendar from "@/components/dashboard/weekly-calendar";
import CoachAttendance from "@/components/dashboard/coach-attendance";
import OrganizationSetupFlow from "@/components/onboarding/organization-setup-flow";

interface OrganizationDashboardProps {
  user: User;
  organization: Organization;
}

export default function OrganizationDashboard({ user, organization }: OrganizationDashboardProps) {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  // Check if organization needs onboarding (new organization with default settings)
  useEffect(() => {
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
  }, [organization]);
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/stats/organization/${organization.id}`],
    queryFn: () => api.getOrganizationStats(organization.id),
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
                {organization.planType} Plan
              </Badge>
              <span className="text-white/80 text-sm">
                {stats?.totalMembers || 0} members • {stats?.activeClasses || 0} active classes
              </span>
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
              
              <div className="ml-4">
                <Button
                  size="sm"
                  className="gap-2 bg-white text-black hover:bg-white/90"
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
              Following your organization
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.accentColor }}
          onClick={() => setLocation('/revenue-dashboard')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total earnings this month
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
          style={{ borderLeftColor: organization.primaryColor }}
          onClick={() => setLocation('/classes-management')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {organization.businessModel === 'membership' ? (
              <Button 
                className="h-24 flex-col gap-2 text-white border-0 shadow-lg"
                style={{ 
                  backgroundColor: organization.accentColor,
                  '--hover-bg': organization.accentColor + 'CC'
                } as React.CSSProperties}
                onClick={() => setLocation('/daily-schedules')}
              >
                <Calendar className="h-6 w-6" />
                <span>Daily Schedule Management</span>
              </Button>
            ) : (
              <Button 
                className="h-24 flex-col gap-2 text-white border-0 shadow-lg"
                style={{ 
                  backgroundColor: organization.accentColor,
                  '--hover-bg': organization.accentColor + 'CC'
                } as React.CSSProperties}
                onClick={() => setLocation('/classes')}
              >
                <Plus className="h-6 w-6" />
                <span>Create New Class</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2 hover:text-white"
              style={{
                borderColor: organization.secondaryColor,
                color: organization.secondaryColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = organization.secondaryColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = organization.secondaryColor;
              }}
              onClick={() => setLocation('/coaches')}
            >
              <UserPlus className="h-6 w-6" />
              <span>Invite Coach</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2 hover:text-white"
              style={{
                borderColor: organization.primaryColor,
                color: organization.primaryColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = organization.primaryColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = organization.primaryColor;
              }}
              onClick={() => setLocation('/reports')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md bg-white">
          <CardHeader 
            className="text-white"
            style={{
              background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})`
            }}
          >
            <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
            <CardDescription className="text-white/80">
              Latest bookings for your classes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                    <div>
                      <p 
                        className="font-semibold"
                        style={{ color: organization.primaryColor }}
                      >
                        {booking.participantName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {booking.class?.name} • {formatCurrency(booking.amount)}
                      </p>
                    </div>
                    <Badge 
                      variant="outline"
                      className="text-white border-white/40"
                      style={
                        booking.paymentStatus === 'confirmed' 
                          ? { backgroundColor: organization.accentColor, color: '#000', borderColor: organization.accentColor }
                          : booking.paymentStatus === 'pending'
                          ? { backgroundColor: organization.secondaryColor, color: '#000', borderColor: organization.secondaryColor }
                          : { backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }
                      }
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600">No recent bookings</p>
                <p className="text-sm text-slate-500 mt-1">Bookings will appear here once participants register</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>
              Your scheduled classes this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classes && classes.length > 0 ? (
              <div className="space-y-4">
                {classes.slice(0, 5).map((classItem: any) => (
                  <div 
                    key={classItem.id} 
                    className="flex items-center justify-between p-3 rounded-lg border-l-4"
                    style={{ 
                      border: `1px solid ${organization.secondaryColor}20`,
                      borderLeftColor: organization.secondaryColor 
                    }}
                  >
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(classItem.startTime).toLocaleDateString()} • {classItem.availableSpots} spots left
                      </p>
                    </div>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: organization.primaryColor, color: organization.primaryColor }}
                    >
                      {classItem.sport?.name}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming classes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>
            Your current usage against your {organization.planType} plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classes</span>
                <span>{stats?.activeClasses || 0} / {organization.maxClasses}</span>
              </div>
              <div 
                className="w-full rounded-full h-2"
                style={{ backgroundColor: `${organization.primaryColor}20` }}
              >
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: organization.primaryColor,
                    width: `${Math.min(100, ((stats?.activeClasses || 0) / organization.maxClasses) * 100)}%`
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Members</span>
                <span>{stats?.totalMembers || 0} / {organization.maxMembers}</span>
              </div>
              <div 
                className="w-full rounded-full h-2"
                style={{ backgroundColor: `${organization.secondaryColor}20` }}
              >
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: organization.secondaryColor,
                    width: `${Math.min(100, ((stats?.totalMembers || 0) / organization.maxMembers) * 100)}%`
                  }}
                />
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