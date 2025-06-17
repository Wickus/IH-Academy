import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { api } from "@/lib/api";

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const booking = urlParams.get('booking');
    setBookingId(booking);
  }, []);

  const { data: booking } = useQuery({
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

  const handleRetryPayment = () => {
    if (booking && classData) {
      // Redirect to class details page where they can retry payment
      setLocation(`/classes/${classData.id}`);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: organization 
          ? `linear-gradient(135deg, ${organization.secondaryColor}10 0%, ${organization.primaryColor}10 100%)`
          : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      }}
    >
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ 
              backgroundColor: organization?.secondaryColor || '#ef4444'
            }}
          >
            <XCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle 
            className="text-2xl font-bold"
            style={{ color: organization?.secondaryColor || '#ef4444' }}
          >
            Payment Cancelled
          </CardTitle>
          <p className="text-gray-600">
            Your payment was cancelled and no charges were made to your account.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Info */}
          {booking && classData && (
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: organization 
                  ? `${organization.primaryColor}10`
                  : '#fef2f2'
              }}
            >
              <h3 
                className="font-semibold mb-2"
                style={{ color: organization?.primaryColor || '#dc2626' }}
              >
                Booking Details
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Class:</span> {classData.name}</p>
                <p><span className="text-gray-500">Participant:</span> {booking.participantName}</p>
                <p><span className="text-gray-500">Status:</span> 
                  <span className="ml-1 text-orange-600 font-medium">Payment Pending</span>
                </p>
              </div>
            </div>
          )}

          {/* Information */}
          <div 
            className="p-4 rounded-lg border-2"
            style={{ 
              borderColor: organization?.accentColor || '#f59e0b',
              backgroundColor: organization 
                ? `${organization.accentColor}05`
                : '#fffbeb'
            }}
          >
            <h4 className="font-semibold mb-2" style={{ color: organization?.primaryColor || '#dc2626' }}>
              What Happened?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your payment was cancelled before completion</li>
              <li>• Your booking is still reserved but requires payment</li>
              <li>• No charges have been made to your payment method</li>
              <li>• You can try the payment again or contact support</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {booking && classData && (
              <Button
                onClick={handleRetryPayment}
                className="w-full"
                style={{ 
                  backgroundColor: organization?.primaryColor || '#dc2626',
                  color: 'white'
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Try Payment Again
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex-1"
                style={{ 
                  color: organization?.primaryColor || '#dc2626',
                  borderColor: organization?.primaryColor || '#dc2626'
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/classes')}
                className="flex-1"
                style={{ 
                  color: organization?.secondaryColor || '#ef4444',
                  borderColor: organization?.secondaryColor || '#ef4444'
                }}
              >
                Browse Classes
              </Button>
            </div>
          </div>

          {/* Support Info */}
          {organization?.phone && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Contact us at{' '}
                <a 
                  href={`tel:${organization.phone}`}
                  className="font-medium"
                  style={{ color: organization.primaryColor }}
                >
                  {organization.phone}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}