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
      color: "from-blue-600 to-blue-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      title: "Active Classes",
      value: stats.activeClasses.toString(),
      subtitle: `${stats.upcomingClasses} starting today`,
      icon: Users,
      color: "from-green-600 to-green-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "+8% from last month",
      icon: Coins,
      color: "from-yellow-600 to-yellow-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-800",
    },
    {
      title: "Coaches",
      value: stats.totalCoaches.toString(),
      subtitle: `${stats.activeCoaches} active today`,
      icon: Presentation,
      color: "from-indigo-600 to-indigo-500",
      iconBg: "bg-slate-50",
      iconColor: "text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="bg-white/70 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2 mb-1">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-emerald-700">
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm text-slate-500 mt-1 font-medium">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`${stat.iconColor} text-2xl`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
