import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { formatCurrency, getTimeAgo, getPaymentStatusColor } from "@/lib/utils";

export default function RecentBookings() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings", { recent: 5 }],
    queryFn: () => api.getBookings({ recent: 5 }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#24D367] to-[#1FB856] text-white border-[#24D367]">
      <CardHeader>
        <CardTitle className="text-white">Recent Bookings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {bookings.length > 0 ? (
          <>
            {bookings.map((booking) => {
              const initials = booking.participantName
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();

              return (
                <div key={booking.id} className="flex items-center space-x-4 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-white/30 text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{booking.participantName}</p>
                    <p className="text-sm text-white/80 truncate">{booking.class?.name}</p>
                    <p className="text-xs text-white/70">{getTimeAgo(booking.bookingDate)}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline"
                      className="bg-white/30 text-white border-white/40 mb-1"
                    >
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </Badge>
                    <p className="text-sm font-medium text-white/90">
                      {formatCurrency(Number(booking.amount))}
                    </p>
                  </div>
                </div>
              );
            })}
            
            <Button variant="ghost" className="w-full mt-4 text-white hover:text-white/80 hover:bg-white/10">
              View All Bookings
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-white/70">
            <p>No recent bookings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
