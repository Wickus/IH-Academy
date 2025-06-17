import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import StatsCards from "@/components/dashboard/stats-cards";
import WeeklyCalendar from "@/components/dashboard/weekly-calendar";
import RecentBookings from "@/components/dashboard/recent-bookings";
import CoachAttendance from "@/components/dashboard/coach-attendance";
import OrganizationDashboard from "@/pages/organization-dashboard";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrganisations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: currentUser?.role === 'organization_admin' || currentUser?.role === 'coach',
  });

  const organizationId = userOrganisations?.[0]?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/organization", organizationId],
    queryFn: () => organizationId ? api.getOrganizationStats(organizationId) : Promise.resolve(undefined),
    enabled: !!organizationId,
  });

  // Check if organisation admin needs to set up their organisation
  useEffect(() => {
    if (currentUser?.role === 'organization_admin' && userOrganisations !== undefined) {
      if (Array.isArray(userOrganisations) && userOrganisations.length === 0) {
        // No organisation set up - redirect to auth page to complete setup
        setLocation("/auth");
        return;
      }
    }
  }, [currentUser, userOrganisations, setLocation]);

  const handleCardClick = useCallback((cardType: string) => {
    switch (cardType) {
      case 'bookings':
        setLocation('/bookings');
        break;
      case 'classes':
        setLocation('/classes');
        break;
      case 'payments':
        setLocation('/payments');
        break;
      case 'coaches':
        setLocation('/coaches');
        break;
      default:
        break;
    }
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If user is an organization admin and has organizations, show OrganizationDashboard
  if (currentUser?.role === 'organization_admin' && userOrganisations && userOrganisations.length > 0) {
    const organization = userOrganisations[0];
    return <OrganizationDashboard user={currentUser} organization={organization} />;
  }

  // If user is a coach, show coach-specific dashboard
  if (currentUser?.role === 'coach') {
    return (
      <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-[#20366B]">Coach Dashboard</h1>
          <p className="text-slate-600">Welcome back, {currentUser.firstName}! Select an organization to manage your coaching profile.</p>
        </div>
        
        {/* Organization Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOrganisations?.map((org) => (
            <div
              key={org.id}
              className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => {
                console.log('Navigating to organization:', org.id);
                setLocation(`/organization/${org.id}/dashboard`);
              }}
              style={{
                background: `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)`
              }}
            >
              <div className="p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{org.name}</h3>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {org.name.charAt(0)}
                  </div>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  {org.description || 'Manage your coaching profile and availability'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/75 uppercase tracking-wide">
                    {org.businessModel} model
                  </span>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    Coach Profile
                  </div>
                </div>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: org.accentColor }}
              ></div>
            </div>
          ))}
        </div>

        {/* Empty state if no organizations */}
        {(!userOrganisations || userOrganisations.length === 0) && (
          <div className="text-center py-12">
            <div className="mb-4 text-slate-400">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">No Organizations</h3>
            <p className="text-slate-500">
              You haven't been assigned to any organizations yet. Contact an admin to get started.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with ItsHappening.Africa.</p>
      </div>
      
      <StatsCards stats={stats} onCardClick={handleCardClick} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WeeklyCalendar />
        </div>
        <div>
          <RecentBookings />
        </div>
      </div>

      <CoachAttendance />
    </div>
  );
}
