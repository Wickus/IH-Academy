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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading global dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide overview and organization management
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active sports organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Management */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Manage sports organizations on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizations?.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: org.primaryColor }}
                  >
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-muted-foreground">{org.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={org.planType === 'premium' ? 'default' : 'secondary'}>
                        {org.planType}
                      </Badge>
                      <Badge variant={org.isActive ? 'default' : 'destructive'}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
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
  );
}