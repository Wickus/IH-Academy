import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { api, type Class } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, ArrowLeft, Calendar, CreditCard, UserPlus } from "lucide-react";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import BookingForm from "@/components/forms/booking-form";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationClasses() {
  const [, params] = useRoute("/organizations/:id/classes");
  const [, setLocation] = useLocation();
  const organizationId = parseInt(params?.id || "0");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["/api/organizations", organizationId],
    queryFn: () => api.getOrganization(organizationId),
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes", { organizationId }],
    queryFn: () => api.getClasses({ organizationId }),
  });

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: () => api.getSports(),
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => api.getMe(),
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["/api/memberships", { userId: user?.id }],
    queryFn: () => api.getMemberships({ userId: user?.id }),
    enabled: !!user?.id,
  });

  const { data: dailySchedules } = useQuery({
    queryKey: ["/api/daily-schedules", organizationId],
    queryFn: () => api.getDailySchedules(organizationId),
    enabled: !!organization && organization.businessModel === 'membership',
  });

  // Check if user has active membership to this organization
  const userMembership = userMemberships?.find(m => m.organizationId === organizationId && m.status === 'active');
  const isMembershipOrg = organization?.businessModel === 'membership';

  const joinMembershipMutation = useMutation({
    mutationFn: () => api.createMembership({
      organizationId: organizationId,
      userId: user?.id!,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({
        title: "Membership Created",
        description: `Welcome to ${organization?.name}! You can now access daily schedules and book classes.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create membership. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (orgLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading classes...</p>
        </div>
      </div>
    );
  }

  const getSportById = (id: number) => sports?.find(s => s.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367]">
      {/* Header Section */}
      <div className="relative py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/discover">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
          
          <div className="flex items-center gap-6 mb-6">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: organization?.primaryColor || '#20366B' }}
            >
              {organization?.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                {organization?.name}
              </h1>
              <p className="text-xl text-white/90 mt-2">
                {organization?.description || "Sports training and coaching"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-slate-50 min-h-screen rounded-t-3xl relative -mt-8 pt-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Membership Section for Membership Organizations */}
          {isMembershipOrg && !userMembership && (
            <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-[#20366B]/5 via-[#278DD4]/5 to-[#24D367]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#20366B]">
                  <UserPlus className="h-5 w-5" />
                  Join {organization?.name} Membership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-slate-700 mb-2">
                      Get unlimited access to daily schedules and all membership benefits.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span>{formatCurrency(parseFloat(organization?.membershipPrice || '0'))} / {organization?.membershipBillingCycle}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Access to daily schedules</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation(`/membership-payment/${organization.id}`)}
                    className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white font-semibold"
                  >
                    Become a Member - R{organization.membershipPrice}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Membership Status */}
          {isMembershipOrg && userMembership && (
            <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-[#24D367]/10 to-[#24D3BF]/10 border-l-4 border-l-[#24D367]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-[#20366B] mb-2">
                  <UserPlus className="h-5 w-5 text-[#24D367]" />
                  <span className="font-semibold">Active Member</span>
                  <Badge className="bg-[#24D367] text-white">Premium Access</Badge>
                </div>
                <p className="text-slate-600 text-sm">
                  You have full access to daily schedules and all membership benefits.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isMembershipOrg ? "Daily Schedules & Classes" : "Available Classes"}
            </h2>
            <p className="text-slate-600">
              {isMembershipOrg 
                ? "Explore our weekly schedule and book your preferred time slots" 
                : "Book your spot in our expert-led training sessions"
              }
            </p>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes?.map((classItem) => {
              const sport = getSportById(classItem.sportId);
              const availableSpots = classItem.capacity - (classItem.bookingCount || 0);
              
              return (
                <Card key={classItem.id} className="hover:shadow-xl transition-all border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                  <div className="h-2 bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367]"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        className="text-white font-medium px-3 py-1"
                        style={{ backgroundColor: sport?.color || '#278DD4' }}
                      >
                        {sport?.name}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {availableSpots} spots left
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {classItem.name}
                    </CardTitle>
                    {classItem.description && (
                      <p className="text-slate-600 text-sm mt-2">
                        {classItem.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {formatDate(classItem.startTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-600">
                        <Clock className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                        </span>
                      </div>

                      {classItem.location && (
                        <div className="flex items-center gap-3 text-slate-600">
                          <MapPin className="w-4 h-4 text-[#20366B]" />
                          <span className="text-sm font-medium">{classItem.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-slate-600">
                        <Users className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {classItem.capacity} max capacity
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-2xl font-bold text-[#20366B]">
                          {formatCurrency(parseFloat(classItem.price.toString()))}
                        </span>
                        <span className="text-slate-500 text-sm ml-1">per class</span>
                      </div>
                      
                      <Button
                        onClick={() => {
                          setSelectedClass(classItem);
                          setShowBookingForm(true);
                        }}
                        disabled={availableSpots === 0}
                        className="bg-[#24D367] hover:bg-[#24D367]/90 text-white font-medium px-6 py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
                      >
                        {availableSpots === 0 ? 'Sold Out' : 'Book Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {classes?.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Classes Available</h3>
              <p className="text-slate-500">This organization hasn't scheduled any classes yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Book Your Class</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookingForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </Button>
              </div>
              
              <BookingForm
                classData={selectedClass}
                onSuccess={() => {
                  setShowBookingForm(false);
                  setSelectedClass(null);
                }}
                onCancel={() => {
                  setShowBookingForm(false);
                  setSelectedClass(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}