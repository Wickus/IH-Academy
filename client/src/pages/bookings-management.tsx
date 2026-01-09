import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Calendar, User, Clock, MapPin, CreditCard, Move, Filter, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Booking, Class, Organization } from '@shared/schema';

export default function BookingsManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch current user's organization
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations/my'],
    queryFn: () => api.getUserOrganizations(),
  });

  const organization = organizations?.[0];

  // Fetch bookings for the organization
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings', { organizationId: organization?.id }],
    queryFn: () => api.getBookings({ organizationId: organization.id }),
    enabled: !!organization,
  });

  // Fetch classes for moving bookings
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes', { organizationId: organization?.id }],
    queryFn: () => api.getClasses({ organizationId: organization.id }),
    enabled: !!organization,
  });

  // Move booking mutation
  const moveBookingMutation = useMutation({
    mutationFn: async ({ bookingId, newClassId }: { bookingId: number; newClassId: number }) => {
      const response = await fetch(`/api/bookings/${bookingId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: newClassId }),
      });
      if (!response.ok) throw new Error('Failed to move booking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: 'Booking moved successfully' });
      setSelectedBooking(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to move booking',
        variant: 'destructive',
      });
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'confirmed' }),
      });
      if (!response.ok) throw new Error('Failed to confirm payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: 'Payment confirmed successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to confirm payment',
        variant: 'destructive',
      });
    },
  });

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return organization?.primaryColor || '#10b981';
      case 'pending': return organization?.secondaryColor || '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground">Please create an organization first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
            style={{ 
              color: organization.primaryColor,
              borderColor: organization.primaryColor,
              '--hover-bg': `${organization.primaryColor}20`
            } as any}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${organization.primaryColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>
              Bookings Management
            </h1>
            <p className="text-muted-foreground">
              Manage all bookings for {organization.name}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6" style={{ borderTopColor: organization.primaryColor, borderTopWidth: '4px' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by participant name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div 
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                  style={{ borderColor: `${organization.primaryColor}40`, borderTopColor: 'transparent' }}
                />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Bookings will appear here once participants start booking your classes.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.participantName}</span>
                            <span className="text-sm text-muted-foreground">{booking.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: organization.secondaryColor }}
                            />
                            {booking.className || 'Unknown Class'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.createdAt || '').toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {new Date(booking.createdAt || '').toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: `${getStatusColor(booking.paymentStatus || 'pending')}20`,
                              color: getStatusColor(booking.paymentStatus || 'pending'),
                              borderColor: getStatusColor(booking.paymentStatus || 'pending'),
                            }}
                          >
                            {booking.paymentStatus || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.paymentStatus === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Confirm this payment as received?')) {
                                    confirmPaymentMutation.mutate(booking.id);
                                  }
                                }}
                                disabled={confirmPaymentMutation.isPending}
                                style={{ 
                                  borderColor: '#10b981',
                                  color: '#10b981'
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                  style={{ 
                                    borderColor: organization.primaryColor,
                                    color: organization.primaryColor 
                                  }}
                                >
                                  <Move className="h-4 w-4 mr-1" />
                                  Move
                                </Button>
                              </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Move Booking</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Moving booking for: <strong>{selectedBooking?.participantName}</strong>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Current class: <strong>{selectedBooking?.className}</strong>
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Select new class:</label>
                                  <Select
                                    onValueChange={(classId) => {
                                      if (selectedBooking) {
                                        moveBookingMutation.mutate({
                                          bookingId: selectedBooking.id,
                                          newClassId: parseInt(classId),
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="mt-2">
                                      <SelectValue placeholder="Choose a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                          {cls.name} - {new Date(cls.startTime).toLocaleString()}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}