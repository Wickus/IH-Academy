import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, User, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PaymentSuccess() {
  const [location, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingParam = urlParams.get('booking');
    if (bookingParam) {
      setBookingId(parseInt(bookingParam));
    }
  }, []);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['/api/bookings', bookingId],
    queryFn: () => bookingId ? api.getBooking(bookingId) : null,
    enabled: !!bookingId,
  });

  const { data: classData } = useQuery({
    queryKey: ['/api/classes', booking?.classId],
    queryFn: () => booking?.classId ? api.getClass(booking.classId) : null,
    enabled: !!booking?.classId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <p className="text-green-100">Your booking has been confirmed</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {booking && classData ? (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {classData.name}
                </h3>
                <p className="text-gray-600">
                  Booking confirmed for {booking.participantName}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-gray-600">
                      {new Date(classData.startTime).toLocaleDateString()} at{' '}
                      {new Date(classData.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Participant</p>
                    <p className="text-sm text-gray-600">{booking.participantName}</p>
                  </div>
                </div>

                {classData.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">{classData.location}</p>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Payment Status:</strong> {booking.paymentStatus === 'confirmed' ? 'Confirmed' : 'Processing'}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Amount:</strong> R{parseFloat(booking.amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation('/classes')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  View More Classes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Your payment was successful! You should receive a confirmation email shortly.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation('/classes')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  View Classes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}