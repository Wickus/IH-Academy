import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime, getPaymentStatusColor } from "@/lib/utils";

export default function Payments() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings", { recent: 100 }],
    queryFn: () => api.getBookings({ recent: 100 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getStats,
  });

  const totalRevenue = bookings
    .filter(booking => booking.paymentStatus === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const pendingPayments = bookings
    .filter(booking => booking.paymentStatus === 'pending')
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const failedPayments = bookings.filter(booking => booking.paymentStatus === 'failed').length;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
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
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#20366B]">Payments</h1>
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
                <p className="text-3xl font-bold text-[#20366B] mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm text-[#24D367] mt-1">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#278DD4] to-[#24D367] rounded-lg flex items-center justify-center">
                <DollarSign className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {formatCurrency(pendingPayments)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bookings.filter(b => b.paymentStatus === 'pending').length} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#24D3BF] to-[#22C4B0] rounded-lg flex items-center justify-center">
                <CreditCard className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                <p className="text-3xl font-bold text-foreground mt-1">{failedPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-error text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.participantName}</div>
                        <div className="text-sm text-muted-foreground">{booking.participantEmail}</div>
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
                      <div className="text-sm">
                        {formatDateTime(booking.bookingDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Payfast</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {bookings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <CreditCard className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-500">
                Payment transactions will appear here once bookings are made.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
