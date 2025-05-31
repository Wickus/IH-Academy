import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Class } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Star, Calendar } from "lucide-react";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import BookingForm from "@/components/forms/booking-form";

export default function PublicBooking() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => api.getClasses({}),
  });

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: () => api.getSports(),
  });

  if (classesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSportById = (id: number) => sports?.find(s => s.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Star className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">ItsHappening.Africa</h1>
                <p className="text-slate-600">Sports booking platform for everyone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Discover Amazing Sports Classes
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Join our expert-led sports programs and take your fitness journey to the next level.
            Book your spot in just a few clicks!
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes?.map((classItem) => {
            const sport = getSportById(classItem.sportId);
            const availableSpots = classItem.capacity - (classItem.bookingCount || 0);
            
            return (
              <Card key={classItem.id} className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
                
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
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors">
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
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatDate(classItem.startTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                      </span>
                    </div>

                    {classItem.location && (
                      <div className="flex items-center space-x-3 text-slate-600">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{classItem.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-slate-600">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {availableSpots} spots available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        {formatCurrency(parseFloat(classItem.price))}
                      </span>
                      <span className="text-slate-500 text-sm ml-1">per class</span>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setSelectedClass(classItem);
                        setShowBookingForm(true);
                      }}
                      disabled={availableSpots === 0}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
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