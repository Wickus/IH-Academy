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
  Activity
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function Reports() {
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
    queryKey: ["/api/bookings", { recent: 100 }],
    queryFn: () => api.getBookings({ recent: 100 }),
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
        <div className="flex gap-3">
          <Button 
            className="text-white border-0"
            style={{ backgroundColor: organization.secondaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${organization.secondaryColor}dd`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = organization.secondaryColor;
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button 
            className="text-white border-0"
            style={{ backgroundColor: organization.accentColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${organization.accentColor}dd`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = organization.accentColor;
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  +15% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#278DD4] to-[#24D367] rounded-lg flex items-center justify-center">
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
                <p className="text-3xl font-bold text-[#20366B] mt-1">{totalBookings}</p>
                <p className="text-sm text-[#278DD4] mt-1">
                  {monthlyBookings.length} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#24D3BF] to-[#22C4B0] rounded-lg flex items-center justify-center">
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
                <p className="text-3xl font-bold text-[#20366B] mt-1">{totalClasses}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Across all sports
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#20366B] to-[#278DD4] rounded-lg flex items-center justify-center">
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
                <p className="text-3xl font-bold text-[#20366B] mt-1">{totalCoaches}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Professional staff
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#24D367] to-[#1fb557] rounded-lg flex items-center justify-center">
                <Activity className="text-white text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Classes */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white rounded-t-lg">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-[#24D367]' : 
                      index === 1 ? 'bg-[#278DD4]' : 
                      index === 2 ? 'bg-[#24D3BF]' : 'bg-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-[#20366B]">{classItem.name}</p>
                      <p className="text-sm text-slate-600">{classItem.sport?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#24D367]">{classItem.bookingCount}</p>
                    <p className="text-xs text-slate-500">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white rounded-t-lg">
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
                    <p className="font-semibold text-[#20366B]">{booking.participantName}</p>
                    <p className="text-sm text-slate-600">{booking.class?.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(booking.bookingDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#24D367]">{formatCurrency(Number(booking.amount))}</p>
                    <Badge 
                      className={
                        booking.paymentStatus === 'confirmed' 
                          ? 'bg-[#24D367]/10 text-[#24D367] border-[#24D367]/20' 
                          : 'bg-[#278DD4]/10 text-[#278DD4] border-[#278DD4]/20'
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
              <div className="text-[#278DD4] mb-4">
                <BarChart3 className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-bold text-[#20366B] mb-2">No data to report yet</h3>
              <p className="text-slate-600 mb-6">
                Start by creating classes and accepting bookings to generate meaningful reports.
              </p>
              <Button className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}