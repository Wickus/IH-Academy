import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  FileText,
  PieChart,
  Activity,
  ChevronDown,
  CalendarIcon
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);

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

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings", { recent: 500 }],
    queryFn: () => api.getBookings({ recent: 500 }),
    enabled: !!organization,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => api.getClasses({ organizationId: organization?.id }),
    enabled: !!organization,
  });

  const { data: coaches = [], isLoading: coachesLoading } = useQuery({
    queryKey: ["/api/coaches"],
    queryFn: () => api.getCoaches(organization?.id),
    enabled: !!organization,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getStats,
    enabled: !!organization,
  });

  const filteredBookings = bookings.filter((booking: any) => {
    if (!dateRange.from || !dateRange.to) return true;
    const bookingDate = new Date(booking.bookingDate || booking.createdAt);
    const endOfDay = new Date(dateRange.to);
    endOfDay.setHours(23, 59, 59, 999);
    return bookingDate >= dateRange.from && bookingDate <= endOfDay;
  });

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRevenueReport = () => {
    setIsExporting(true);
    try {
      const confirmedBookings = filteredBookings.filter((b: any) => b.paymentStatus === 'confirmed');
      const headers = ['Date', 'Participant', 'Class', 'Amount (ZAR)', 'Payment Status', 'Payment ID'];
      const rows = confirmedBookings.map((booking: any) => [
        new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-ZA'),
        booking.participantName || '',
        booking.className || booking.class?.name || '',
        booking.amount || '0',
        booking.paymentStatus || '',
        booking.payfastPaymentId || ''
      ]);
      
      const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
      rows.push(['', '', '', '', '', '']);
      rows.push(['TOTAL REVENUE', '', '', totalRevenue.toFixed(2), '', '']);
      
      const csv = [headers.join(','), ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
      const dateStr = `${dateRange.from?.toISOString().split('T')[0]}_to_${dateRange.to?.toISOString().split('T')[0]}`;
      downloadCSV(csv, `revenue_report_${dateStr}.csv`);
      toast({ title: 'Revenue report exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Could not generate the report', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportBookingsReport = () => {
    setIsExporting(true);
    try {
      const headers = ['Booking ID', 'Date', 'Participant', 'Email', 'Class', 'Amount (ZAR)', 'Payment Status', 'Created At'];
      const rows = filteredBookings.map((booking: any) => [
        booking.id,
        new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-ZA'),
        booking.participantName || '',
        booking.participantEmail || booking.email || '',
        booking.className || booking.class?.name || '',
        booking.amount || '0',
        booking.paymentStatus || 'pending',
        new Date(booking.createdAt).toLocaleString('en-ZA')
      ]);
      
      const csv = [headers.join(','), ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
      const dateStr = `${dateRange.from?.toISOString().split('T')[0]}_to_${dateRange.to?.toISOString().split('T')[0]}`;
      downloadCSV(csv, `bookings_report_${dateStr}.csv`);
      toast({ title: 'Bookings report exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Could not generate the report', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportClassPerformanceReport = () => {
    setIsExporting(true);
    try {
      const classStats = classes.map((classItem: any) => {
        const classBookings = filteredBookings.filter((b: any) => b.classId === classItem.id);
        const confirmedBookings = classBookings.filter((b: any) => b.paymentStatus === 'confirmed');
        const revenue = confirmedBookings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
        return {
          name: classItem.name,
          sport: classItem.sport?.name || '',
          capacity: classItem.capacity,
          totalBookings: classBookings.length,
          confirmedBookings: confirmedBookings.length,
          revenue: revenue,
          occupancyRate: classItem.capacity > 0 ? ((confirmedBookings.length / classItem.capacity) * 100).toFixed(1) : '0'
        };
      });
      
      const headers = ['Class Name', 'Sport', 'Capacity', 'Total Bookings', 'Confirmed Bookings', 'Revenue (ZAR)', 'Occupancy Rate (%)'];
      const rows = classStats.map((stat: any) => [
        stat.name,
        stat.sport,
        stat.capacity,
        stat.totalBookings,
        stat.confirmedBookings,
        stat.revenue.toFixed(2),
        stat.occupancyRate
      ]);
      
      const totalRevenue = classStats.reduce((sum: number, s: any) => sum + s.revenue, 0);
      rows.push(['', '', '', '', '', '', '']);
      rows.push(['TOTALS', '', '', classStats.reduce((s: number, c: any) => s + c.totalBookings, 0), classStats.reduce((s: number, c: any) => s + c.confirmedBookings, 0), totalRevenue.toFixed(2), '']);
      
      const csv = [headers.join(','), ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
      const dateStr = `${dateRange.from?.toISOString().split('T')[0]}_to_${dateRange.to?.toISOString().split('T')[0]}`;
      downloadCSV(csv, `class_performance_${dateStr}.csv`);
      toast({ title: 'Class performance report exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Could not generate the report', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportFinancialSummary = () => {
    setIsExporting(true);
    try {
      const confirmedBookings = filteredBookings.filter((b: any) => b.paymentStatus === 'confirmed');
      const pendingBookings = filteredBookings.filter((b: any) => b.paymentStatus === 'pending');
      const cancelledBookings = filteredBookings.filter((b: any) => b.paymentStatus === 'cancelled');
      
      const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
      const pendingRevenue = pendingBookings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
      
      const revenueByClass: Record<string, number> = {};
      confirmedBookings.forEach((booking: any) => {
        const className = booking.className || booking.class?.name || 'Unknown';
        revenueByClass[className] = (revenueByClass[className] || 0) + Number(booking.amount || 0);
      });
      
      const lines = [
        `FINANCIAL SUMMARY REPORT`,
        `Organization: ${organization?.name || 'N/A'}`,
        `Report Period: ${dateRange.from?.toLocaleDateString('en-ZA')} to ${dateRange.to?.toLocaleDateString('en-ZA')}`,
        `Generated: ${new Date().toLocaleString('en-ZA')}`,
        ``,
        `OVERVIEW`,
        `Total Confirmed Revenue,R ${totalRevenue.toFixed(2)}`,
        `Pending Payments,R ${pendingRevenue.toFixed(2)}`,
        `Total Bookings,${filteredBookings.length}`,
        `Confirmed Bookings,${confirmedBookings.length}`,
        `Pending Bookings,${pendingBookings.length}`,
        `Cancelled Bookings,${cancelledBookings.length}`,
        ``,
        `REVENUE BY CLASS`,
        ...Object.entries(revenueByClass).map(([name, amount]) => `${name},R ${amount.toFixed(2)}`),
        ``,
        `SUMMARY`,
        `Average Booking Value,R ${confirmedBookings.length > 0 ? (totalRevenue / confirmedBookings.length).toFixed(2) : '0.00'}`,
        `Conversion Rate,${filteredBookings.length > 0 ? ((confirmedBookings.length / filteredBookings.length) * 100).toFixed(1) : '0'}%`
      ];
      
      const dateStr = `${dateRange.from?.toISOString().split('T')[0]}_to_${dateRange.to?.toISOString().split('T')[0]}`;
      downloadCSV(lines.join('\n'), `financial_summary_${dateStr}.csv`);
      toast({ title: 'Financial summary exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Could not generate the report', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate report metrics
  const totalRevenue = bookings
    .filter(booking => booking.paymentStatus === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.amount), 0);

  const totalBookings = bookings.length;
  const totalClasses = classes.length;
  const totalCoaches = coaches.length;

  const monthlyBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.bookingDate);
    const currentMonth = new Date();
    return bookingDate.getMonth() === currentMonth.getMonth() && 
           bookingDate.getFullYear() === currentMonth.getFullYear();
  });

  const popularClasses = classes
    .map(classItem => ({
      ...classItem,
      bookingCount: bookings.filter(booking => booking.classId === classItem.id).length
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  const isLoading = bookingsLoading || classesLoading || coachesLoading;

  if (isLoading || !organization) {
    return (
      <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization?.primaryColor || '#20366B'}10` }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: organization?.primaryColor || '#20366B' }}>Reports</h1>
            <p className="text-slate-600">Generate insights and analytics for your organization</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md bg-white">
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
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: `${organization.primaryColor}10` }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: organization.primaryColor }}>Reports & Analytics</h1>
          <p className="text-slate-600">Generate insights and analytics with ItsHappening.Africa</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className="text-sm"
                style={{ borderColor: organization.secondaryColor, color: organization.primaryColor }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to 
                  ? `${dateRange.from.toLocaleDateString('en-ZA')} - ${dateRange.to.toLocaleDateString('en-ZA')}`
                  : 'Select date range'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({ 
                        from: new Date(now.getFullYear(), now.getMonth(), 1), 
                        to: now 
                      });
                    }}
                  >
                    This Month
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({ 
                        from: new Date(now.getFullYear(), now.getMonth() - 1, 1), 
                        to: new Date(now.getFullYear(), now.getMonth(), 0) 
                      });
                    }}
                  >
                    Last Month
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({ 
                        from: new Date(now.getFullYear(), 0, 1), 
                        to: now 
                      });
                    }}
                  >
                    This Year
                  </Button>
                </div>
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="text-white border-0"
                style={{ backgroundColor: organization.secondaryColor }}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Reports
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={exportFinancialSummary}>
                <FileText className="mr-2 h-4 w-4" />
                Financial Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportRevenueReport}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Revenue Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportBookingsReport}>
                <Calendar className="mr-2 h-4 w-4" />
                All Bookings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportClassPerformanceReport}>
                <PieChart className="mr-2 h-4 w-4" />
                Class Performance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  +15% this month
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.secondaryColor}, ${organization.accentColor})` }}
              >
                <BarChart3 className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>{totalBookings}</p>
                <p className="text-sm mt-1" style={{ color: organization.secondaryColor }}>
                  {monthlyBookings.length} this month
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.accentColor}, ${organization.secondaryColor})` }}
              >
                <Users className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Classes</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>{totalClasses}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Across all sports
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
              >
                <Calendar className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Coaches</p>
                <p className="text-3xl font-bold mt-1" style={{ color: organization.primaryColor }}>{totalCoaches}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Professional staff
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${organization.accentColor}, ${organization.secondaryColor})` }}
              >
                <Activity className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Classes */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader 
            className="text-white rounded-t-lg"
            style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
          >
            <CardTitle className="text-xl font-bold flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Most Popular Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {popularClasses.map((classItem, index) => (
                <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: index === 0 ? organization.accentColor : 
                                       index === 1 ? organization.secondaryColor : 
                                       index === 2 ? organization.primaryColor : '#94a3b8'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: organization.primaryColor }}>{classItem.name}</p>
                      <p className="text-sm text-slate-600">{classItem.sport?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: organization.accentColor }}>{classItem.bookingCount}</p>
                    <p className="text-xs text-slate-500">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader 
            className="text-white rounded-t-lg"
            style={{ background: `linear-gradient(to right, ${organization.primaryColor}, ${organization.secondaryColor})` }}
          >
            <CardTitle className="text-xl font-bold flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold" style={{ color: organization.primaryColor }}>{booking.participantName}</p>
                    <p className="text-sm text-slate-600">{booking.class?.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(booking.bookingDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: organization.accentColor }}>{formatCurrency(Number(booking.amount))}</p>
                    <Badge 
                      className="hover:opacity-80"
                      style={
                        booking.paymentStatus === 'confirmed' 
                          ? { backgroundColor: `${organization.accentColor}20`, color: organization.accentColor, borderColor: `${organization.accentColor}30` }
                          : { backgroundColor: `${organization.secondaryColor}20`, color: organization.secondaryColor, borderColor: `${organization.secondaryColor}30` }
                      }
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {totalBookings === 0 && (
        <Card className="border-0 shadow-md bg-white mt-8">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="mb-4" style={{ color: organization.secondaryColor }}>
                <BarChart3 className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: organization.primaryColor }}>No data to report yet</h3>
              <p className="text-slate-600 mb-6">
                Start by creating classes and accepting bookings to generate meaningful reports.
              </p>
              <Button 
                className="text-white border-0"
                style={{ backgroundColor: organization.accentColor }}
              >
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}