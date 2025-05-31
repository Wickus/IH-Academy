import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Mail, Phone, Calendar } from "lucide-react";
import { formatDateTime, formatCurrency, getPaymentStatusColor, getTimeAgo } from "@/lib/utils";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings", { recent: 100 }],
    queryFn: () => api.getBookings({ recent: 100 }),
  });

  const filteredBookings = bookings.filter(booking =>
    booking.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.participantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.class?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage participant bookings and registrations</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#20366B]">Bookings</h1>
          <p className="text-slate-600">Manage participant bookings and registrations with ItsHappening.Africa</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Bookings</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#20366B]">{booking.participantName}</div>
                        <div className="text-sm text-slate-600 flex items-center">
                          <Mail className="mr-1 h-3 w-3 text-[#278DD4]" />
                          {booking.participantEmail}
                        </div>
                        {booking.participantPhone && (
                          <div className="text-sm text-slate-600 flex items-center">
                            <Phone className="mr-1 h-3 w-3 text-[#278DD4]" />
                            {booking.participantPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.class?.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {booking.sport?.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.class && (
                        <div className="text-sm">
                          {formatDateTime(booking.class.startTime)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(Number(booking.amount))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={booking.paymentStatus === 'confirmed' ? 'default' : 'secondary'}
                        className={`bg-${getPaymentStatusColor(booking.paymentStatus)}/10 text-${getPaymentStatusColor(booking.paymentStatus)} border-${getPaymentStatusColor(booking.paymentStatus)}/20`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {getTimeAgo(booking.bookingDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadIcal(booking.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Search className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No bookings found' : 'No bookings yet'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Bookings will appear here once participants start registering for classes.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
