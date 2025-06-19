import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Calendar, Clock, MapPin, Users, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function CompletedClasses() {
  const [, setLocation] = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["/api/bookings", currentUser?.email],
    queryFn: () => currentUser ? api.getBookings({ email: currentUser.email }) : Promise.resolve([]),
    enabled: !!currentUser,
  });

  const pastBookings = myBookings.filter(booking => 
    new Date(booking.class?.startTime || '') <= new Date()
  );

  const downloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#278DD4] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your completed classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="text-[#20366B] hover:bg-[#20366B]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#20366B] to-[#278DD4] rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">Completed Classes</h1>
                  <p className="text-white/80 text-lg">Your fitness journey achievements</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{pastBookings.length}</div>
                <div className="text-white/80 text-lg">Classes Completed</div>
                <div className="text-sm text-white/60 mt-1">
                  {pastBookings.length * 10} activity points earned
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Classes List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#24D367] to-[#1FB55A] text-white">
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              All Completed Classes ({pastBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((booking: any) => (
                  <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-[#24D367] rounded-full"></div>
                          <Badge variant="outline" className="bg-[#278DD4]/10 text-[#278DD4] border-[#278DD4]/20">
                            {booking.class?.sport?.name || 'Sport'}
                          </Badge>
                          <h3 className="font-semibold text-[#20366B]">{booking.class?.name}</h3>
                          <Badge 
                            variant="default"
                            className="bg-[#24D367] text-white"
                          >
                            Completed
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateTime(booking.class?.startTime)}</span>
                          </div>
                          {booking.class?.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.class.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Coach: {booking.class?.coach?.name || 'TBD'}</span>
                          </div>
                        </div>
                        {booking.participantName !== currentUser.username && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-[#24D3BF]/10 text-[#24D3BF] border-[#24D3BF]/20">
                              Completed by: {booking.participantName}
                            </Badge>
                          </div>
                        )}
                        <div className="mt-3 flex items-center space-x-4">
                          <span className="text-sm text-slate-500">
                            Attended on {formatDateTime(booking.class?.startTime)}
                          </span>
                          <Badge variant="outline" className="bg-[#24D367]/10 text-[#24D367] border-[#24D367]/20">
                            +10 Activity Points
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadIcal(booking.id)}
                          className="text-[#278DD4] border-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          iCal
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-[#20366B] mb-2">No completed classes yet</h3>
                <p className="text-slate-600 mb-4">
                  Start your fitness journey by booking your first class!
                </p>
                <Button 
                  className="bg-[#278DD4] hover:bg-[#278DD4]/90 text-white"
                  onClick={() => setLocation('/book')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Your First Class
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {pastBookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#24D367] mb-2">{pastBookings.length}</div>
                <div className="text-sm text-slate-600">Total Classes Completed</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#278DD4] mb-2">{pastBookings.length * 10}</div>
                <div className="text-sm text-slate-600">Activity Points Earned</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#20366B] mb-2">{Math.floor(pastBookings.length / 5)}</div>
                <div className="text-sm text-slate-600">Milestones Reached</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}