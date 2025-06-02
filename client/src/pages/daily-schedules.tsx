import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Users, Clock, Building } from "lucide-react";
import DailyScheduleManagement from "@/components/daily-schedule-management";
import { api } from "@/lib/api";

export default function DailySchedules() {
  const { user, isLoading: userLoading } = useUser();

  // Fetch user's organization
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
    enabled: !!user && (user.role === 'organization_admin' || user.role === 'global_admin'),
  });

  const userOrganization = organizations[0]; // Get the first organization for the user

  if (userLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#278DD4] mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'organization_admin' && user.role !== 'global_admin')) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            You don't have permission to access daily schedule management. 
            Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription>
            No organisation found. Please contact support to set up your organisation first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userOrganization.businessModel !== 'membership') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with ItsHappening.Africa branding */}
        <div className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-6 rounded-lg text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Daily Schedule Management</h1>
              <p className="text-white/90">Available for Membership Organizations</p>
            </div>
          </div>
        </div>

        <Card className="border-l-4 border-l-[#278DD4]">
          <CardHeader>
            <CardTitle className="flex items-center text-[#20366B]">
              <Calendar className="h-5 w-5 mr-2" />
              Membership Business Model Required
            </CardTitle>
            <CardDescription>
              Daily schedule management is designed for organisations using the membership business model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-[#20366B]/5 to-[#278DD4]/5 rounded-lg">
              <h3 className="font-semibold text-[#20366B] mb-2">Current Business Model</h3>
              <Badge variant="secondary" className="bg-[#24D367]/20 text-[#20366B]">
                {userOrganization.businessModel === 'pay_per_class' ? 'Pay Per Class' : 'Other'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-[#20366B]">About Daily Schedules</h3>
              <p className="text-gray-600">
                Daily schedule management allows membership-based organisations to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Set up recurring weekly class schedules</li>
                <li>Define capacity limits for each session</li>
                <li>Assign coaches and sports to specific time slots</li>
                <li>Allow members to book into scheduled sessions</li>
                <li>Manage locations and requirements for classes</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Want to Switch to Membership Model?</h4>
              <p className="text-blue-800 text-sm">
                Contact your platform administrator to discuss changing your business model 
                to enable membership features including daily schedule management.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[#278DD4]/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-[#20366B] text-lg">
                <Calendar className="h-5 w-5 mr-2" />
                Weekly Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Set up recurring schedules for each day of the week with specific time slots, 
                making it easy for members to know when classes are available.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#278DD4]/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-[#20366B] text-lg">
                <Users className="h-5 w-5 mr-2" />
                Capacity Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Define maximum capacity for each class session and track bookings 
                to ensure you never exceed your space or equipment limitations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#278DD4]/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-[#20366B] text-lg">
                <Clock className="h-5 w-5 mr-2" />
                Time Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Optimize your schedule with clear start and end times, 
                helping members plan their day and ensuring smooth transitions between classes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DailyScheduleManagement 
        organizationId={userOrganization.id} 
        organization={userOrganization}
      />
    </div>
  );
}