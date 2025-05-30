import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Users, Coins, Presentation, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/api";

interface StatsCardsProps {
  stats?: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const statsData = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toString(),
      change: "+12% from last month",
      icon: CalendarCheck,
      color: "primary",
    },
    {
      title: "Active Classes",
      value: stats.activeClasses.toString(),
      subtitle: `${stats.upcomingClasses} starting today`,
      icon: Users,
      color: "secondary",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "+8% from last month",
      icon: Coins,
      color: "accent",
    },
    {
      title: "Coaches",
      value: stats.totalCoaches.toString(),
      subtitle: `${stats.activeCoaches} active today`,
      icon: Presentation,
      color: "green-sport",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {stat.change}
                    </p>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'primary' ? 'bg-blue-100' :
                  stat.color === 'secondary' ? 'bg-blue-100' :
                  stat.color === 'accent' ? 'bg-green-100' :
                  'bg-green-100'
                }`}>
                  <Icon className={`text-xl ${
                    stat.color === 'primary' ? 'text-blue-600' :
                    stat.color === 'secondary' ? 'text-blue-600' :
                    stat.color === 'accent' ? 'text-green-600' :
                    'text-green-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
