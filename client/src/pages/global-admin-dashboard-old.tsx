import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { api, type GlobalDashboardStats, type Organization, type User } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Plus, Settings, Eye, ChevronDown, ChevronUp, UserCheck, Mail, Calendar, Phone, MapPin, Globe, Palette, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const globalSettingsSchema = z.object({
  defaultMembershipPrice: z.string().min(1, "Price is required"),
  basicPlanPrice: z.string().min(1, "Price is required"),
  premiumPlanPrice: z.string().min(1, "Price is required"),
  payfastMerchantId: z.string().min(1, "Merchant ID is required"),
  payfastMerchantKey: z.string().min(1, "Merchant Key is required"),
  payfastPassphrase: z.string().optional(),
  payfastSandbox: z.boolean().default(true),
});

type GlobalSettingsForm = z.infer<typeof globalSettingsSchema>;

export default function GlobalAdminDashboard() {
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsForm = useForm<GlobalSettingsForm>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      defaultMembershipPrice: "299.00",
      basicPlanPrice: "199.00", 
      premiumPlanPrice: "499.00",
      payfastMerchantId: "",
      payfastMerchantKey: "",
      payfastPassphrase: "",
      payfastSandbox: true,
    },
  });

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

  // User management mutations
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => 
      api.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
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

  // Organization management mutations
  const updateOrgStatusMutation = useMutation({
    mutationFn: ({ orgId, isActive }: { orgId: number; isActive: boolean }) => 
      api.updateOrganizationStatus(orgId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
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

  const onSettingsSubmit = (data: GlobalSettingsForm) => {
    toast({
      title: "Settings Updated",
      description: "Global settings have been saved successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="p-4 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#20366B]">Global Administration</h1>
            <p className="text-slate-600 mt-2">
              Platform overview, organisation management, and system settings
            </p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white border-0">
            <Plus className="h-4 w-4" />
            Add Organisation
          </Button>
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
                {showUsers ? <ChevronUp className="h-4 w-4 text-[#24D367]" /> : <ChevronDown className="h-4 w-4 text-[#24D367]" />}
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
                  {users?.map((user) => (
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white">
                              <UserCheck className="h-3 w-3" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-[#20366B]">User Details</DialogTitle>
                              <DialogDescription>
                                Complete information for {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] flex items-center justify-center text-white font-bold text-lg">
                                  {user.firstName?.charAt(0) || user.username.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#20366B]">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                  </h3>
                                  <p className="text-sm text-slate-600">@{user.username}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-[#278DD4]" />
                                  <span className="text-slate-600">{user.email}</span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-[#278DD4]" />
                                    <span className="text-slate-600">{user.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <UserCheck className="h-4 w-4 text-[#278DD4]" />
                                  <Badge className={
                                    user.role === 'global_admin' ? 'bg-[#20366B] text-white' : 
                                    user.role === 'organization_admin' ? 'bg-[#278DD4] text-white' : 
                                    user.role === 'coach' ? 'bg-[#24D3BF] text-white' :
                                    'bg-[#24D367] text-white'
                                  }>
                                    {user.role.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-[#278DD4]" />
                                  <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-[#24D367] text-white' : ''}>
                                    {user.isActive ? 'Active Account' : 'Inactive Account'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white">
                              <Settings className="h-3 w-3" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-[#20366B]">Manage User</DialogTitle>
                              <DialogDescription>
                                Administrative actions for {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <Button 
                                  className="bg-[#278DD4] hover:bg-[#20366B] text-white"
                                  onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white"
                                  onClick={() => toast({
                                    title: "Feature Coming Soon",
                                    description: "User profile editing will be available in a future update",
                                  })}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit Profile
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className={`border-2 ${
                                    user.isActive 
                                      ? 'border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white' 
                                      : 'border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white'
                                  }`}
                                  onClick={() => updateUserStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                                  disabled={updateUserStatusMutation.isPending}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  {updateUserStatusMutation.isPending 
                                    ? 'Updating...' 
                                    : user.isActive ? 'Deactivate User' : 'Activate User'
                                  }
                                </Button>
                                {user.role !== 'global_admin' && (
                                  <Button 
                                    variant="destructive" 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}? This action cannot be undone.`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                    disabled={deleteUserMutation.isPending}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                  {users && users.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No users found on the platform.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-[#20366B]">Organisation Details</DialogTitle>
                          <DialogDescription>
                            Complete information for {org.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
                              style={{ backgroundColor: org.primaryColor }}
                            >
                              {org.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-[#20366B]">{org.name}</h3>
                              {org.description && (
                                <p className="text-sm text-slate-600">{org.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-[#278DD4]" />
                              <span className="text-slate-600">{org.email}</span>
                            </div>
                            {org.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-[#278DD4]" />
                                <span className="text-slate-600">{org.phone}</span>
                              </div>
                            )}
                            {org.address && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-[#278DD4]" />
                                <span className="text-slate-600">{org.address}</span>
                              </div>
                            )}
                            {org.website && (
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-[#278DD4]" />
                                <span className="text-slate-600">{org.website}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Palette className="h-4 w-4 text-[#278DD4]" />
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: org.primaryColor }}></div>
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: org.secondaryColor }}></div>
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: org.accentColor }}></div>
                                <span className="text-slate-600">Brand Colors</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={org.planType === 'premium' ? 'default' : 'secondary'} className="bg-[#24D367] text-white">
                                {org.planType} plan
                              </Badge>
                              <Badge variant={org.isActive ? 'default' : 'destructive'} className={org.isActive ? 'bg-[#24D3BF] text-white' : ''}>
                                {org.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white">
                          <Settings className="h-4 w-4" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-[#20366B]">Manage Organisation</DialogTitle>
                          <DialogDescription>
                            Administrative actions for {org.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Button 
                              className="bg-[#278DD4] hover:bg-[#20366B] text-white"
                              onClick={() => toast({
                                title: "Feature Coming Soon",
                                description: "Direct dashboard access will be available in a future update",
                              })}
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              View Dashboard
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white"
                              onClick={() => toast({
                                title: "Feature Coming Soon",
                                description: "Organisation settings editing will be available in a future update",
                              })}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Settings
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-[#24D3BF] text-[#24D3BF] hover:bg-[#24D3BF] hover:text-white"
                              onClick={() => window.open(`mailto:${org.email}`, '_blank')}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact Admin
                            </Button>
                            <Button 
                              variant="outline" 
                              className={`border-2 ${
                                org.isActive 
                                  ? 'border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white' 
                                  : 'border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white'
                              }`}
                              onClick={() => updateOrgStatusMutation.mutate({ orgId: org.id, isActive: !org.isActive })}
                              disabled={updateOrgStatusMutation.isPending}
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              {updateOrgStatusMutation.isPending 
                                ? 'Updating...' 
                                : org.isActive ? 'Suspend Organisation' : 'Activate Organisation'
                              }
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone and will affect all associated users and data.`)) {
                                  deleteOrgMutation.mutate(org.id);
                                }
                              }}
                              disabled={deleteOrgMutation.isPending}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              {deleteOrgMutation.isPending ? 'Deleting...' : 'Delete Organisation'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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