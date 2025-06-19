import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { api, type Class } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Star, Calendar, ArrowLeft } from "lucide-react";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import BookingForm from "@/components/forms/booking-form";

export default function PublicBooking() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [, setLocation] = useLocation();

  // Get current user to filter classes by their organizations
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  // Get user's organizations
  const { data: userOrganizations = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!currentUser,
  });

  // Only fetch classes from organizations the user is a member of
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes", userOrganizations.map(org => org.id)],
    queryFn: async () => {
      if (userOrganizations.length === 0) return [];
      const allClasses = await Promise.all(
        userOrganizations.map(org => api.getClasses({ organizationId: org.id }))
      );
      return allClasses.flat();
    },
    enabled: userOrganizations.length > 0,
  });

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: () => api.getSports(),
  });

  if (classesLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading your classes...</p>
        </div>
      </div>
    );
  }

  // Show message if user has no organizations
  if (userOrganizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367]">
        {/* Back Navigation */}
        <div className="p-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white p-8">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-4">No Organizations Found</h2>
            <p className="text-lg opacity-90 mb-6 max-w-md">
              You need to join an organization first to book classes. Use an invite code to get started!
            </p>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-white text-[#20366B] hover:bg-white/90"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getSportById = (id: number) => sports?.find(s => s.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367]">
      {/* Back Navigation */}
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header Section */}
      <div className="relative py-8 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Book a Class
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Choose from classes available in your member organizations.
            Book your spot in just a few clicks!
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-slate-50 min-h-screen rounded-t-3xl relative -mt-8 pt-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Discover Amazing Sports Classes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Browse all available classes and find the perfect fit for your fitness goals.
            </p>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes?.map((classItem) => {
              const sport = getSportById(classItem.sportId);
              const availableSpots = classItem.capacity - (classItem.bookingCount || 0);
              
              return (
                <Card key={classItem.id} className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367]"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        className="text-white font-medium"
                        style={{ backgroundColor: sport?.color || '#278DD4' }}
                      >
                        {sport?.name}
                      </Badge>
                      <div className="flex items-center space-x-1 text-[#24D3BF]">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-slate-600">4.8</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-[#20366B] transition-colors">
                      {classItem.name}
                    </CardTitle>
                    {classItem.description && (
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {classItem.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-slate-600">
                        <Calendar className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {formatDate(classItem.startTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-slate-600">
                        <Clock className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                        </span>
                      </div>

                      {classItem.location && (
                        <div className="flex items-center space-x-3 text-slate-600">
                          <MapPin className="w-4 h-4 text-[#20366B]" />
                          <span className="text-sm font-medium">{classItem.location}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 text-slate-600">
                        <Users className="w-4 h-4 text-[#20366B]" />
                        <span className="text-sm font-medium">
                          {availableSpots} spots available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-2xl font-bold text-slate-800">
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
                        className="bg-gradient-to-r from-[#20366B] to-[#278DD4] hover:from-[#20366B]/90 hover:to-[#278DD4]/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
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
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Classes Available</h3>
              <p className="text-slate-500">Check back soon for new class schedules!</p>
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
                  &times;
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