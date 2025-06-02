import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import StatsCards from "@/components/dashboard/stats-cards";
import WeeklyCalendar from "@/components/dashboard/weekly-calendar";
import RecentBookings from "@/components/dashboard/recent-bookings";
import CoachAttendance from "@/components/dashboard/coach-attendance";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrganisations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: currentUser?.role === 'organization_admin',
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
