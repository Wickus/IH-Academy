import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Users, Coins, Presentation, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useOrganization } from "@/contexts/organization-context";
import type { DashboardStats } from "@/lib/api";

interface StatsCardsProps {
  stats?: DashboardStats;
  onCardClick?: (cardType: string) => void;
}

export default function StatsCards({ stats, onCardClick }: StatsCardsProps) {
  const { organization } = useOrganization();
  if (!stats || !organization) return null;

  const statsData = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toString(),
      change: "+12% from last month",
      icon: CalendarCheck,
      color: `linear-gradient(to bottom right, ${organization.primaryColor}, ${organization.secondaryColor})`,
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardType: "bookings",
    },
    {
      title: "Active Classes",
      value: stats.activeClasses.toString(),
      subtitle: `${stats.upcomingClasses} starting today`,
      icon: Users,
      color: `linear-gradient(to bottom right, ${organization.secondaryColor}, ${organization.accentColor})`,
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardType: "classes",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "+8% from last month",
      icon: Coins,
      color: `linear-gradient(to bottom right, ${organization.accentColor}, ${organization.primaryColor})`,
      iconBg: "bg-white/20",
      iconColor: "text-white",
      cardType: "payments",
    },
    {
      title: "Coaches",
      value: stats.totalCoaches.toString(),
      subtitle: `${stats.activeCoaches} active today`,
      icon: Presentation,
      color: `linear-gradient(to bottom right, ${organization.primaryColor}88, ${organization.secondaryColor}88)`,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-700",
      cardType: "coaches",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card 
            key={index} 
            className="text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer rounded-lg"
            style={{ background: stat.color }}
            onClick={() => onCardClick?.(stat.cardType)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2 mb-1">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                      <p className="text-sm font-medium text-white/90">
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm text-white/80 mt-1 font-medium">{stat.subtitle}</p>
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
