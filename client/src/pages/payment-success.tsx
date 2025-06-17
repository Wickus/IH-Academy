import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const booking = urlParams.get('booking');
    setBookingId(booking);
  }, []);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['/api/bookings', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const bookings = await api.getBookings();
      return bookings.find(b => b.id === parseInt(bookingId));
    },
    enabled: !!bookingId,
  });

  const { data: classData } = useQuery({
    queryKey: ['/api/classes', booking?.classId],
    queryFn: async () => {
      if (!booking?.classId) return null;
      const classes = await api.getClasses();
      return classes.find(c => c.id === booking.classId);
    },
    enabled: !!booking?.classId,
  });

  const { data: organization } = useQuery({
    queryKey: ['/api/organizations', classData?.organizationId],
    queryFn: () => classData ? api.getOrganization(classData.organizationId) : null,
    enabled: !!classData?.organizationId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="h-64 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  if (!booking || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We couldn't find your booking details. Please contact support if you believe this is an error.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: organization 
          ? `linear-gradient(135deg, ${organization.primaryColor}10 0%, ${organization.accentColor}10 100%)`
          : 'linear-gradient(135deg, #22c55e10 0%, #16a34a10 100%)'
      }}
    >
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ 
              backgroundColor: organization?.primaryColor || '#22c55e'
            }}
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle 
            className="text-3xl font-bold"
            style={{ color: organization?.primaryColor || '#22c55e' }}
          >
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Your booking has been confirmed and payment processed successfully.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div 
            className="p-6 rounded-lg"
            style={{ 
              backgroundColor: organization 
                ? `${organization.secondaryColor}10`
                : '#22c55e10'
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4"
              style={{ color: organization?.primaryColor || '#22c55e' }}
            >
              Booking Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5" style={{ color: organization?.secondaryColor || '#16a34a' }} />
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-semibold">{classData.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5" style={{ color: organization?.secondaryColor || '#16a34a' }} />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold">{formatDateTime(classData.startTime)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5" style={{ color: organization?.secondaryColor || '#16a34a' }} />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{classData.location || 'TBA'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: organization?.accentColor || '#16a34a' }}
                  >
                    {formatCurrency(classData.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Participant Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold mb-2" style={{ color: organization?.primaryColor || '#22c55e' }}>
                Participant Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{booking.participantName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.participantEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div 
            className="p-4 rounded-lg border-2"
            style={{ 
              borderColor: organization?.accentColor || '#22c55e',
              backgroundColor: organization 
                ? `${organization.accentColor}05`
                : '#22c55e05'
            }}
          >
            <h4 className="font-semibold mb-2" style={{ color: organization?.primaryColor || '#22c55e' }}>
              What's Next?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Arrive 10-15 minutes before class starts</li>
              <li>• Bring appropriate sports attire and equipment</li>
              {organization?.phone && (
                <li>• Contact {organization.phone} if you have any questions</li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setLocation('/')}
              className="flex-1"
              style={{ 
                backgroundColor: organization?.primaryColor || '#22c55e',
                color: 'white'
              }}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/bookings')}
              className="flex-1"
              style={{ 
                color: organization?.primaryColor || '#22c55e',
                borderColor: organization?.primaryColor || '#22c55e'
              }}
            >
              View My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}