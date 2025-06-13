import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PaymentCancelled() {
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Cancelled</CardTitle>
          <p className="text-red-100">Your booking was not completed</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {booking && classData ? (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {classData.name}
                </h3>
                <p className="text-gray-600">
                  Payment was cancelled for {booking.participantName}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                <p className="text-sm text-orange-800">
                  <strong>What happened?</strong> You cancelled the payment process before it was completed.
                </p>
                <p className="text-sm text-orange-800 mt-1">
                  Your spot in the class has not been reserved.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    // Retry payment by redirecting to class booking
                    setLocation(`/classes/${classData.id}`);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Try Payment Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/classes')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Browse Other Classes
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => setLocation('/')}
                  className="w-full text-gray-600"
                >
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Your payment was cancelled. No charges were made to your account.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  If you experienced any issues during the payment process, please contact support.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation('/classes')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  View Available Classes
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