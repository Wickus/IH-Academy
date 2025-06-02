import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Calendar, 
  Download, 
  Star, 
  Target, 
  Activity,
  Award,
  Users,
  Clock,
  TrendingUp
} from "lucide-react";
import { formatDateTime, formatCurrency, getTimeAgo } from "@/lib/utils";

export default function UserDashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userBookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: () => api.getBookings({}),
    enabled: !!currentUser,
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ["/api/achievements/user", currentUser?.id],
    queryFn: () => api.getUserAchievements(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/stats/user", currentUser?.id],
    queryFn: () => api.getUserStats(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const handleDownloadIcal = async (bookingId: number) => {
    try {
      await api.downloadIcal(bookingId);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    }
  };

  const upcomingBookings = userBookings.filter(booking => 
    booking.class?.startTime && new Date(booking.class.startTime) > new Date()
  );

  const completedBookings = userBookings.filter(booking => 
    booking.class?.startTime && new Date(booking.class.startTime) <= new Date()
  );

  if (!currentUser) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#20366B]">My Dashboard</h1>
          <p className="text-slate-600">Welcome back, {currentUser.name || currentUser.username}!</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#20366B]">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-[#278DD4]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#20366B]">{userStats?.totalBookings || 0}</div>
            <p className="text-xs text-slate-600">
              All time sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#20366B]">Sessions Attended</CardTitle>
            <Activity className="h-4 w-4 text-[#24D367]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24D367]">{userStats?.attendedSessions || 0}</div>
            <p className="text-xs text-slate-600">
              Completed activities
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#20366B]">Achievement Points</CardTitle>
            <Trophy className="h-4 w-4 text-[#24D3BF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#24D3BF]">{userStats?.totalPoints || 0}</div>
            <p className="text-xs text-slate-600">
              Earned through activities
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#20366B]">Achievements</CardTitle>
            <Award className="h-4 w-4 text-[#278DD4]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#278DD4]">{userAchievements.length}</div>
            <p className="text-xs text-slate-600">
              Badges unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Calendar className="mr-2 h-4 w-4" />
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Trophy className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Activity className="mr-2 h-4 w-4" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Bookings */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
                <CardTitle className="flex items-center text-xl">
                  <Clock className="mr-2 h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#20366B]">{booking.class?.name}</h4>
                          <Badge className="bg-[#24D367] text-white">
                            {booking.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {booking.class?.startTime && formatDateTime(booking.class.startTime)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadIcal(booking.id)}
                            className="text-[#278DD4] border-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No upcoming sessions</p>
                    <p className="text-sm text-slate-500">Book a class to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="bg-gradient-to-r from-[#24D367] to-[#1fb557] text-white">
                <CardTitle className="flex items-center text-xl">
                  <Activity className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {completedBookings.length > 0 ? (
                  <div className="space-y-4">
                    {completedBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#20366B]">{booking.class?.name}</h4>
                          <span className="text-sm text-slate-500">
                            {booking.class?.startTime && getTimeAgo(booking.class.startTime)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatCurrency(Number(booking.amount))} • {booking.class?.sport?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No completed sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white">
              <CardTitle className="flex items-center text-xl">
                <Trophy className="mr-2 h-5 w-5" />
                Achievement Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {userAchievements.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userAchievements.map((userAchievement) => (
                    <div 
                      key={userAchievement.id} 
                      className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg text-center"
                    >
                      <div className="text-4xl mb-2">{userAchievement.achievement?.icon}</div>
                      <h4 className="font-semibold text-[#20366B] mb-1">
                        {userAchievement.achievement?.name}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {userAchievement.achievement?.description}
                      </p>
                      <Badge 
                        style={{ backgroundColor: userAchievement.achievement?.color }}
                        className="text-white"
                      >
                        +{userAchievement.achievement?.points} points
                      </Badge>
                      <p className="text-xs text-slate-500 mt-2">
                        Unlocked {getTimeAgo(userAchievement.unlockedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-[#20366B] mb-2">No achievements yet</h3>
                  <p className="text-slate-600 mb-4">
                    Complete activities and attend sessions to unlock achievements
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-gradient-to-r from-[#24D3BF] to-[#22c4b0] text-white">
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="mr-2 h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#20366B]">Progress This Month</span>
                    <span className="text-sm text-slate-600">
                      {userStats?.monthlyProgress || 0}% of goal
                    </span>
                  </div>
                  <Progress 
                    value={userStats?.monthlyProgress || 0} 
                    className="h-2"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-[#278DD4]" />
                      <span className="font-medium text-[#20366B]">Monthly Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-[#278DD4]">
                      {userStats?.monthlyGoal || 4} sessions
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="h-5 w-5 text-[#24D367]" />
                      <span className="font-medium text-[#20366B]">Current Streak</span>
                    </div>
                    <p className="text-2xl font-bold text-[#24D367]">
                      {userStats?.currentStreak || 0} days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}