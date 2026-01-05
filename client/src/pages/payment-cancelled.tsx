import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, Calendar, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const bookingId = searchParams.get('booking_id');
  const orgId = searchParams.get('org_id');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['/api/bookings', bookingId],
    queryFn: () => bookingId ? api.getBooking(parseInt(bookingId)) : null,
    enabled: !!bookingId,
  });

  const { data: organization } = useQuery({
    queryKey: ['/api/organizations', orgId],
    queryFn: () => orgId ? api.getOrganization(parseInt(orgId)) : null,
    enabled: !!orgId,
  });

  useEffect(() => {
		if (window.ReactNativeWebView) {
			window.ReactNativeWebView.postMessage(JSON.stringify({
				bookingId,
				status:'canceled'
			}));
		}
	}, [])

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const orgColors = organization ? {
    primary: organization.primaryColor || '#ef4444',
    secondary: organization.secondaryColor || '#dc2626',
    accent: organization.accentColor || '#b91c1c'
  } : {
    primary: '#ef4444',
    secondary: '#dc2626', 
    accent: '#b91c1c'
  };

  const handleRetryPayment = () => {
    if (booking && organization) {
      // Navigate back to booking with retry intent
      setLocation(`/organizations/${organization.id}/classes`);
    } else {
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancelled Header */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: orgColors.primary }}
          >
            <XCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">Your payment was not completed. Don't worry, no charges were applied.</p>
        </div>

        {/* Booking Details */}
        {booking && (
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader 
              className="text-white rounded-t-lg"
              style={{ backgroundColor: orgColors.primary }}
            >
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Class</p>
                    <p className="text-lg font-semibold">{booking.className || 'Class Details'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Participant</p>
                    <p className="text-lg font-semibold">{booking.participantName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date & Time</p>
                    <p className="text-lg font-semibold">
                      {booking.classDate ? new Date(booking.classDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Status</p>
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      Payment Pending
                    </Badge>
                  </div>
                </div>
                
                {booking.amount && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Amount Due</span>
                      <span className="text-2xl font-bold text-red-600">
                        R{parseFloat(booking.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Info */}
        {organization && (
          <Card className="mb-6 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: orgColors.primary }}
                >
                  {organization.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{organization.name}</h3>
                  <p className="text-gray-600">{organization.description}</p>
                  {organization.email && (
                    <p className="text-sm text-gray-500 mt-1">Contact: {organization.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Notice */}
        <Card className="mb-6 shadow-lg border-0 bg-amber-50 border-l-4 border-l-amber-400">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Your Booking is Still Reserved</h3>
                <p className="text-amber-800 mb-3">
                  Your spot is temporarily held, but payment is required to confirm your booking. 
                  Complete your payment soon to secure your place in the class.
                </p>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>• Your booking will expire if payment is not completed within 24 hours</li>
                  <li>• No charges have been applied to your payment method</li>
                  <li>• You can retry payment at any time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleRetryPayment}
            className="flex-1 text-white font-medium py-3"
            style={{ backgroundColor: orgColors.primary }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Payment
          </Button>
          
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="flex-1 py-3 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {organization && (
            <Button
              onClick={() => setLocation(`/organizations/${organization.id}/classes`)}
              variant="outline"
              className="py-3 font-medium"
              style={{ borderColor: orgColors.secondary, color: orgColors.secondary }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Browse Classes
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Having trouble with payment? Contact the organization directly for assistance.</p>
        </div>
      </div>
    </div>
  );
}