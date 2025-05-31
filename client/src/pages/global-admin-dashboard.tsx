import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type GlobalDashboardStats, type Organization } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Plus, Settings, Eye } from "lucide-react";

export default function GlobalAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/global'],
    queryFn: () => api.getGlobalStats(),
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
  });

  if (statsLoading || orgsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#278DD4] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading global dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#20366B]">Global Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">
              System-wide overview and organisation management for ItsHappening.Africa
            </p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white border-0">
            <Plus className="h-4 w-4" />
            Add Organisation
          </Button>
        </div>

        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#20366B]">Total Organisations</CardTitle>
              <Building2 className="h-4 w-4 text-[#278DD4]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#20366B]">{stats?.totalOrganizations || 0}</div>
              <p className="text-xs text-slate-600">
                Active sports organisations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-[#24D367] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#20366B]">Total Users</CardTitle>
              <Users className="h-4 w-4 text-[#24D367]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#20366B]">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-slate-600">
                Registered platform users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-[#24D3BF] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#20366B]">Total Bookings</CardTitle>
              <CreditCard className="h-4 w-4 text-[#24D3BF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#20366B]">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-slate-600">
                Across all organisations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#20366B]">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#278DD4]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#20366B]">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-slate-600">
                Platform-wide revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Management */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white rounded-t-lg">
            <CardTitle className="text-white">Organisations</CardTitle>
            <CardDescription className="text-blue-100">
              Manage sports organisations on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {organizations?.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
                      style={{ backgroundColor: org.primaryColor }}
                    >
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#20366B]">{org.name}</h3>
                      <p className="text-sm text-slate-600">{org.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={org.planType === 'premium' ? 'default' : 'secondary'} className="bg-[#24D367] text-white">
                          {org.planType}
                        </Badge>
                        <Badge variant={org.isActive ? 'default' : 'destructive'} className={org.isActive ? 'bg-[#24D3BF] text-white' : ''}>
                          {org.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white">
                      <Settings className="h-4 w-4" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}