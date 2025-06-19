import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, ArrowLeft, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PaymentSuccess() {
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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const orgColors = organization ? {
    primary: organization.primaryColor || '#22c55e',
    secondary: organization.secondaryColor || '#16a34a',
    accent: organization.accentColor || '#15803d'
  } : {
    primary: '#22c55e',
    secondary: '#16a34a', 
    accent: '#15803d'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: orgColors.primary }}
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your booking has been confirmed and payment processed.</p>
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
                Booking Confirmation
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
                    <Badge 
                      className="text-white font-medium"
                      style={{ backgroundColor: orgColors.accent }}
                    >
                      Paid
                    </Badge>
                  </div>
                </div>
                
                {booking.amount && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Total Paid</span>
                      <span className="text-2xl font-bold" style={{ color: orgColors.primary }}>
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

        {/* Next Steps */}
        <Card className="mb-6 shadow-lg border-0 bg-blue-50 border-l-4" style={{ borderLeftColor: orgColors.secondary }}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: orgColors.accent }}></span>
                You'll receive a confirmation email with all booking details
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: orgColors.accent }}></span>
                Arrive 10-15 minutes early for your class
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: orgColors.accent }}></span>
                Check your dashboard for class updates and reminders
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation('/dashboard')}
            className="flex-1 text-white font-medium py-3"
            style={{ backgroundColor: orgColors.primary }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {organization && (
            <Button
              onClick={() => setLocation(`/organizations/${organization.id}/classes`)}
              variant="outline"
              className="flex-1 py-3 font-medium"
              style={{ borderColor: orgColors.secondary, color: orgColors.secondary }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View More Classes
            </Button>
          )}

          {booking && (
            <Button
              onClick={() => booking.id && api.downloadIcal(booking.id)}
              variant="outline"
              className="py-3 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download iCal
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact the organization directly or visit your dashboard for support options.</p>
        </div>
      </div>
    </div>
  );
}