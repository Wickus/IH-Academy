import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit3 } from "lucide-react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

export default function CoachAvailabilityGeneral() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: userOrganizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  if (userLoading || organizationsLoading) {
    return (
      <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-[#20366B]">Availability Management</h1>
          <p className="text-slate-600">Manage your availability across all organizations you coach for.</p>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#278DD4] mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Loading your availability settings...</h3>
            <p className="text-slate-500">Please wait while we fetch your coach information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-[#20366B]">Availability Management</h1>
        <p className="text-slate-600">Manage your availability across all organizations you coach for.</p>
      </div>

      {userOrganizations.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Organizations</h3>
            <p className="text-slate-500">
              You haven't been assigned to any organizations yet. Contact an admin to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
              <CardTitle className="text-2xl">Organization Availability</CardTitle>
              <p className="text-white/90">
                Set your availability for each organization you work with.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userOrganizations.map((org) => (
                  <Card key={org.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="pb-4"
                      style={{ backgroundColor: `${org.primaryColor}10` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: org.primaryColor }}
                          >
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg" style={{ color: org.primaryColor }}>
                              {org.name}
                            </h4>
                            <Badge 
                              style={{
                                backgroundColor: `${org.accentColor}20`,
                                color: org.primaryColor,
                                borderColor: `${org.accentColor}30`
                              }}
                            >
                              {org.businessModel} model
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/coach-profile/${org.id}`)}
                          style={{
                            color: org.primaryColor,
                            borderColor: org.primaryColor,
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Weekly Schedule</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {daysOfWeek.slice(0, 4).map((day) => (
                            <div key={day} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                              <span className="font-medium">{day.slice(0, 3)}</span>
                              <div className="text-slate-500">Not set</div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Click "Manage" to set your detailed availability for {org.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Availability Overview */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-[#20366B]/10">
              <CardTitle className="text-[#20366B]">Quick Overview</CardTitle>
              <p className="text-slate-600">
                Your general availability patterns across all organizations.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-[#20366B] mb-2">{day}</h4>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">Available</div>
                      <div className="text-sm font-medium text-slate-600">Not set</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-[#20366B] mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#20366B] mb-1">Set Organization-Specific Availability</h4>
                    <p className="text-sm text-slate-600">
                      Each organization may have different scheduling needs. Click "Manage" on any organization card above 
                      to set your specific availability, working hours, and break times for that organization.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}