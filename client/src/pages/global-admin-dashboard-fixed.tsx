import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Plus, Settings, Eye, ChevronDown, ChevronUp, UserCheck, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalAdminDashboard() {
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/global'],
    queryFn: () => api.getGlobalStats(),
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => api.getUsers(),
    enabled: showUsers,
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      api.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const updateOrgStatusMutation = useMutation({
    mutationFn: ({ orgId, isActive }: { orgId: number; isActive: boolean }) =>
      api.updateOrganizationStatus(orgId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: "Success",
        description: "Organisation status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organisation status",
        variant: "destructive",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (orgId: number) => api.deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: "Success",
        description: "Organisation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organisation",
        variant: "destructive",
      });
    },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-8">
      {/* Header with ItsHappening.Africa branding */}
      <div className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-6 rounded-lg text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Global Administration</h1>
            <p className="text-white/90 mt-2">
              ItsHappening.Africa platform overview and management
            </p>
          </div>
          <Button className="bg-white text-[#20366B] hover:bg-white/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Organisation
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Organisations
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
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

            <Card 
              className="bg-white border-l-4 border-l-[#24D367] shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
              onClick={() => setShowUsers(!showUsers)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Users</CardTitle>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#24D367]" />
                  {showUsers ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-slate-600">
                  Click to view all users
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

          {/* Users Management - Only show when expanded */}
          {showUsers && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] text-white rounded-t-lg">
                <CardTitle className="text-white">Platform Users</CardTitle>
                <CardDescription className="text-green-100">
                  All registered users across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#24D367]"></div>
                    <span className="ml-2 text-slate-600">Loading users...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] flex items-center justify-center text-white font-bold">
                            {user.firstName?.charAt(0) || user.username.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#20366B]">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={user.role === 'global_admin' ? 'default' : user.role === 'organization_admin' ? 'secondary' : 'outline'}
                                className={
                                  user.role === 'global_admin' ? 'bg-[#20366B] text-white' : 
                                  user.role === 'organization_admin' ? 'bg-[#278DD4] text-white' : 
                                  user.role === 'coach' ? 'bg-[#24D3BF] text-white' :
                                  'bg-[#24D367] text-white'
                                }
                              >
                                {user.role.replace('_', ' ')}
                              </Badge>
                              <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-[#24D367] text-white' : ''}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateUserStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                            disabled={updateUserStatusMutation.isPending}
                            className="gap-1 border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white"
                          >
                            <UserCheck className="h-3 w-3" />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          {user.role !== 'global_admin' && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
              <CardTitle className="text-white">Platform Organisations</CardTitle>
              <CardDescription className="text-blue-100">
                All registered organisations across ItsHappening.Africa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {organizations?.map((org: any) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
                        style={{ backgroundColor: org.primaryColor || '#278DD4' }}
                      >
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#20366B]">{org.name}</h3>
                        <p className="text-sm text-slate-600">{org.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-[#24D367] text-white">
                            {org.planType || 'basic'}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateOrgStatusMutation.mutate({ orgId: org.id, isActive: !org.isActive })}
                        disabled={updateOrgStatusMutation.isPending}
                        className="gap-1 border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white"
                      >
                        {org.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteOrgMutation.mutate(org.id)}
                        disabled={deleteOrgMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
              <CardTitle className="text-white">Global Platform Settings</CardTitle>
              <CardDescription className="text-blue-100">
                Configure platform-wide settings for ItsHappening.Africa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Settings className="h-16 w-16 mx-auto mb-4 text-[#278DD4]" />
                <h3 className="text-lg font-semibold text-[#20366B] mb-2">Settings Panel</h3>
                <p className="text-slate-600">
                  Global settings configuration will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}