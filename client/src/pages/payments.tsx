import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime, getPaymentStatusColor } from "@/lib/utils";

export default function Payments() {
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

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getStats,
    enabled: !!organization,
  });

  const totalRevenue = bookings
    .filter(booking => booking.paymentStatus === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const pendingPayments = bookings
    .filter(booking => booking.paymentStatus === 'pending')
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const failedPayments = bookings.filter(booking => booking.paymentStatus === 'failed').length;

  if (isLoading || !organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.accentColor || '#24D367'}10` }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: organization?.accentColor || '#24D367' }}>Payments</h1>
            <p className="text-muted-foreground">Monitor payment status and revenue</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.accentColor}10` }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.accentColor }}>Payments</h1>
          <p className="text-slate-600">Monitor payment status and revenue with ItsHappening.Africa</p>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm mt-1" style={{ color: organization.accentColor }}>
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.secondaryColor}, ${organization.accentColor})` }}
              >
                <DollarSign className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Payments</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>
                  {formatCurrency(pendingPayments)}
                </p>
                <p className="text-sm mt-1" style={{ color: organization.secondaryColor }}>
                  {bookings.filter(b => b.paymentStatus === 'pending').length} transactions
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.accentColor}, ${organization.secondaryColor})` }}
              >
                <CreditCard className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Failed Payments</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>{failedPayments}</p>
                <p className="text-sm text-red-500 mt-1">
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card className="border-0 shadow-md bg-white">
        <CardHeader 
          className="text-white rounded-t-lg"
          style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
        >
          <CardTitle className="text-xl font-bold">Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Participant</TableHead>
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Class</TableHead>
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Amount</TableHead>
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Status</TableHead>
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Date</TableHead>
                  <TableHead className="font-semibold" style={{ color: organization.primaryColor }}>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking, index) => (
                  <TableRow key={booking.id} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <TableCell>
                      <div>
                        <div className="font-semibold" style={{ color: organization.primaryColor }}>{booking.participantName}</div>
                        <div className="text-sm text-slate-600">{booking.participantEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{booking.class?.name}</div>
                        <Badge 
                          className="text-xs hover:opacity-80"
                          style={{
                            backgroundColor: `${organization.accentColor}20`,
                            color: organization.primaryColor,
                            borderColor: `${organization.accentColor}30`
                          }}
                        >
                          {booking.sport?.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg" style={{ color: organization.accentColor }}>
                        {formatCurrency(Number(booking.amount))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className="hover:opacity-80"
                        style={
                          booking.paymentStatus === 'confirmed' 
                            ? { backgroundColor: `${organization.accentColor}20`, color: organization.accentColor, borderColor: `${organization.accentColor}30` }
                            : booking.paymentStatus === 'pending'
                            ? { backgroundColor: `${organization.secondaryColor}20`, color: organization.secondaryColor, borderColor: `${organization.secondaryColor}30` }
                            : { backgroundColor: 'rgb(239 68 68 / 0.1)', color: 'rgb(239 68 68)', borderColor: 'rgb(239 68 68 / 0.2)' }
                        }
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700 font-medium">
                        {formatDateTime(booking.bookingDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" style={{ color: organization.secondaryColor }} />
                        <span className="text-sm font-medium text-slate-700">Payfast</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4" style={{ color: organization.secondaryColor }}>
                <CreditCard className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-bold text-[#20366B] mb-2">No payments yet</h3>
              <p className="text-slate-600">
                Payment transactions will appear here once bookings are made with ItsHappening.Africa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
