import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Mail, Phone, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, formatCurrency, getPaymentStatusColor, getTimeAgo } from "@/lib/utils";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
    enabled: !!user,
  });

  const organization = organizations?.[0];

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings", { recent: 100 }],
    queryFn: () => api.getBookings({ recent: 100 }),
    enabled: !!organization,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => api.getClasses(),
    enabled: !!organization,
  });

  const filteredBookings = bookings.filter(booking =>
    booking.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.participantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.class?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available classes for move booking - only classes with same cost
  const getAvailableClasses = (currentBooking: any) => {
    if (!currentBooking || !classes) return [];
    return classes.filter(c => 
      c.id !== currentBooking.classId && 
      Number(c.price) === Number(currentBooking.amount) &&
      new Date(c.startTime) > new Date() // Only future classes
    );
  };

  const moveBookingMutation = useMutation({
    mutationFn: async ({ bookingId, newClassId }: { bookingId: number; newClassId: number }) => {
      const response = await fetch(`/api/bookings/${bookingId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId: newClassId }),
      });
      if (!response.ok) throw new Error('Failed to move booking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Moved",
        description: "The booking has been successfully moved to the new class.",
      });
      setSelectedBooking(null);
      setSelectedClass("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMoveBooking = () => {
    if (selectedBooking && selectedClass) {
      moveBookingMutation.mutate({
        bookingId: selectedBooking.id,
        newClassId: parseInt(selectedClass),
      });
    }
  };

  const handleDownloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    }
  };

  if (isLoading || !organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.primaryColor || '#20366B'}10` }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: organization?.primaryColor || '#20366B' }}>Bookings</h1>
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
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>Bookings</h1>
          <p className="text-slate-600">Manage participant bookings and registrations with ItsHappening.Africa</p>
        </div>
      </div>

      <Card className="border-0 shadow-md bg-white">
        <CardHeader 
          className="text-white" 
          style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">All Bookings</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400"
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
                        <div className="font-medium" style={{ color: organization.primaryColor }}>{booking.class?.name}</div>
                        <Badge 
                          variant="outline" 
                          className="text-xs" 
                          style={{ 
                            backgroundColor: `${organization.secondaryColor}15`,
                            borderColor: organization.secondaryColor,
                            color: organization.secondaryColor
                          }}
                        >
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
                        style={{
                          backgroundColor: booking.paymentStatus === 'confirmed' 
                            ? `${organization.accentColor}20` 
                            : `${organization.secondaryColor}15`,
                          color: booking.paymentStatus === 'confirmed' 
                            ? organization.accentColor 
                            : organization.secondaryColor,
                          borderColor: booking.paymentStatus === 'confirmed' 
                            ? `${organization.accentColor}50` 
                            : `${organization.secondaryColor}30`
                        }}
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
                          style={{
                            color: organization.primaryColor,
                            borderColor: organization.primaryColor,
                          }}
                          className="hover:text-white"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = organization.primaryColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          style={{
                            color: organization.accentColor,
                            borderColor: organization.accentColor,
                          }}
                          className="hover:text-white"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = organization.accentColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        {user?.role === 'organization_admin' && getAvailableClasses(booking).length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                style={{
                                  color: organization.secondaryColor,
                                  borderColor: organization.secondaryColor,
                                }}
                                className="hover:text-white"
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = organization.secondaryColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle style={{ color: organization.primaryColor }}>
                                  Move Booking
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-sm font-medium" style={{ color: organization.primaryColor }}>
                                    Current Class: {booking.class?.name}
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.participantName} - {formatCurrency(Number(booking.amount))}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block" style={{ color: organization.primaryColor }}>
                                    Move to Class:
                                  </label>
                                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger 
                                      style={{ 
                                        borderColor: organization.secondaryColor
                                      }}
                                      className="focus:border-opacity-100"
                                      onFocus={(e) => e.currentTarget.style.borderColor = organization.primaryColor}
                                      onBlur={(e) => e.currentTarget.style.borderColor = organization.secondaryColor}
                                    >
                                      <SelectValue placeholder="Select a new class..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableClasses(booking).map((cls) => (
                                        <SelectItem 
                                          key={cls.id} 
                                          value={cls.id.toString()}
                                          className="hover:bg-opacity-10"
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${organization.secondaryColor}15`}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          {cls.name} - {formatDateTime(cls.startTime)} - {formatCurrency(Number(cls.price))}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => {
                                    setSelectedBooking(null);
                                    setSelectedClass("");
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleMoveBooking}
                                    disabled={!selectedClass || moveBookingMutation.isPending}
                                    style={{ 
                                      backgroundColor: organization.accentColor,
                                      borderColor: organization.accentColor 
                                    }}
                                    className="hover:opacity-90"
                                  >
                                    {moveBookingMutation.isPending ? 'Moving...' : 'Move Booking'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[#278DD4] mb-4">
                <Search className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-semibold text-[#20366B] mb-2">
                {searchTerm ? 'No bookings found' : 'No bookings yet'}
              </h3>
              <p className="text-slate-600">
                {searchTerm 
                  ? 'Try adjusting your search terms to find specific bookings' 
                  : 'Bookings will appear here once participants start registering for classes.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
