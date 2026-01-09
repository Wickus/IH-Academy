import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { api, type GlobalDashboardStats, type Organization, type User } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Plus, Settings, Eye, ChevronDown, ChevronUp, UserCheck, Mail, Calendar, Phone, MapPin, Globe, Palette, DollarSign, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
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

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ orgId, subscriptionStatus, planType }: { orgId: number; subscriptionStatus: string; planType?: string }) => {
      const response = await fetch(`/api/organizations/${orgId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionStatus, planType })
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: "Success",
        description: "Subscription status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription status",
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

  const bulkPurgeMutation = useMutation({
    mutationFn: async ({ userIds, purgeInactive }: { userIds?: number[]; purgeInactive?: boolean }) => {
      const response = await fetch('/api/users/bulk-purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userIds, purgeInactive }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purge users');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUsers([]);
      setShowPurgeDialog(false);
      toast({
        title: "Bulk Purge Complete",
        description: `Successfully purged ${data.deletedCount} users`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to purge users",
        variant: "destructive",
      });
    },
  });

  const handleUserSelection = (userId: number, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      const inactiveUserIds = users
        .filter(user => !user.isActive && user.role !== 'global_admin')
        .map(user => user.id);
      setSelectedUsers(inactiveUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkPurge = (purgeAll: boolean = false) => {
    if (purgeAll) {
      bulkPurgeMutation.mutate({ purgeInactive: true });
    } else if (selectedUsers.length > 0) {
      bulkPurgeMutation.mutate({ userIds: selectedUsers });
    }
  };

  const saveGlobalSettingsMutation = useMutation({
    mutationFn: async (data: GlobalSettingsForm) => {
      console.log("Saving global settings:", data);
      
      // For now, we'll save PayFast settings to a default organization
      // In a real implementation, you might want to save these globally
      const response = await fetch('/api/organizations/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          payfastMerchantId: data.payfastMerchantId,
          payfastMerchantKey: data.payfastMerchantKey,
          payfastPassphrase: data.payfastPassphrase,
          payfastSandbox: data.payfastSandbox,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: "Settings Updated",
        description: "Global PayFast settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error saving global settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSettingsSubmit = (data: GlobalSettingsForm) => {
    console.log("Global settings form submitted:", data);
    saveGlobalSettingsMutation.mutate(data);
  };

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
                    <>
                      {/* Bulk Operations Controls */}
                      {users && users.filter(user => !user.isActive && user.role !== 'global_admin').length > 0 && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-orange-800 mb-1">Inactive User Management</h3>
                              <p className="text-sm text-orange-600">
                                {users.filter(user => !user.isActive && user.role !== 'global_admin').length} inactive users found
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll(selectedUsers.length === 0)}
                                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                              >
                                {selectedUsers.length === 0 ? 'Select All Inactive' : 'Deselect All'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowPurgeDialog(true)}
                                disabled={selectedUsers.length === 0 && !users.some(user => !user.isActive && user.role !== 'global_admin')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Bulk Purge ({selectedUsers.length} selected)
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                      {users?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {/* Selection checkbox for inactive users */}
                            {!user.isActive && user.role !== 'global_admin' && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-300 rounded"
                              />
                            )}
                            <div className="w-10 h-10 bg-gradient-to-br from-[#278DD4] to-[#24D367] rounded-full flex items-center justify-center text-white font-bold">
                              {user.firstName ? user.firstName.charAt(0) : user.username.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#20366B]">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                              </h3>
                              <p className="text-sm text-slate-600">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {user.role.replace('_', ' ')}
                                </Badge>
                                <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-[#24D3BF] text-white' : ''}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {user.createdAt && (
                                  <span className="text-xs text-slate-500">
                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                  </span>
                                )}
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
                                  <DialogTitle className="text-[#20366B]">User Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#20366B] to-[#278DD4] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                      {user.firstName ? user.firstName.charAt(0) : user.username.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-[#20366B]">
                                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                      </h3>
                                      <p className="text-slate-600">{user.email}</p>
                                      <p className="text-sm text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-[#278DD4]" />
                                        <span className="text-sm text-slate-600">Status: {user.isActive ? 'Active' : 'Inactive'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-[#278DD4]" />
                                        <span className="text-sm text-slate-600">
                                          Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-[#278DD4]" />
                                        <span className="text-sm text-slate-600">{user.email}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <Button 
                                      variant="outline" 
                                      className="gap-1 border-[#20366B] text-[#20366B] hover:bg-[#20366B] hover:text-white"
                                      onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Email
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
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
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="organizations" className="space-y-8">
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
                            <Badge 
                              variant="outline" 
                              className={
                                org.subscriptionStatus === 'active' ? 'border-green-500 text-green-600' :
                                org.subscriptionStatus === 'trial' ? 'border-yellow-500 text-yellow-600' :
                                org.subscriptionStatus === 'expired' ? 'border-red-500 text-red-600' :
                                'border-gray-500 text-gray-600'
                              }
                            >
                              {org.subscriptionStatus || 'trial'}
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
                                  <h3 className="text-lg font-semibold text-[#20366B]">{org.name}</h3>
                                  <p className="text-slate-600">{org.email}</p>
                                  <p className="text-sm text-slate-500">Since {new Date(org.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-600">{org.phone || 'Not provided'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-600">{org.address || 'Not provided'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-600">{org.website || 'Not provided'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4" style={{ color: org.primaryColor }} />
                                    <span className="text-sm text-slate-600">Primary: {org.primaryColor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4" style={{ color: org.secondaryColor }} />
                                    <span className="text-sm text-slate-600">Secondary: {org.secondaryColor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 capitalize">{org.planType} Plan</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Subscription Status</Label>
                                  <Select
                                    value={org.subscriptionStatus || 'trial'}
                                    onValueChange={(value) => {
                                      updateSubscriptionMutation.mutate({ 
                                        orgId: org.id, 
                                        subscriptionStatus: value 
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="trial">Trial</SelectItem>
                                      <SelectItem value="active">Active (Paid)</SelectItem>
                                      <SelectItem value="expired">Expired</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Plan Type</Label>
                                  <Select
                                    value={org.planType || 'free'}
                                    onValueChange={(value) => {
                                      updateSubscriptionMutation.mutate({ 
                                        orgId: org.id, 
                                        subscriptionStatus: org.subscriptionStatus || 'active',
                                        planType: value 
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Free</SelectItem>
                                      <SelectItem value="basic">Basic</SelectItem>
                                      <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-4 border-t">
                                <Button 
                                  variant="outline" 
                                  className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
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
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            {/* Global Settings Panel */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Global Platform Settings
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure platform-wide settings including PayFast integration and membership pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Membership Pricing Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <DollarSign className="w-5 h-5 text-[#24D367]" />
                          <h3 className="text-lg font-semibold text-[#20366B]">Membership Pricing</h3>
                        </div>
                        
                        <FormField
                          control={settingsForm.control}
                          name="defaultMembershipPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Membership Price (ZAR)</FormLabel>
                              <FormControl>
                                <Input placeholder="299.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="basicPlanPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Basic Plan Price (ZAR)</FormLabel>
                              <FormControl>
                                <Input placeholder="199.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="premiumPlanPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Premium Plan Price (ZAR)</FormLabel>
                              <FormControl>
                                <Input placeholder="499.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* PayFast Configuration Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <CreditCard className="w-5 h-5 text-[#278DD4]" />
                          <h3 className="text-lg font-semibold text-[#20366B]">PayFast Configuration</h3>
                        </div>

                        <FormField
                          control={settingsForm.control}
                          name="payfastMerchantId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayFast Merchant ID</FormLabel>
                              <FormControl>
                                <Input placeholder="10000100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="payfastMerchantKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayFast Merchant Key</FormLabel>
                              <FormControl>
                                <Input placeholder="46f0cd694581a" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="payfastPassphrase"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayFast Passphrase (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional security passphrase" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="payfastSandbox"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Sandbox Mode
                                </FormLabel>
                                <div className="text-sm text-slate-600">
                                  Enable for testing, disable for production
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button type="submit" className="bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white">
                        Save Global Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Purge Confirmation Dialog */}
      <Dialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Bulk User Purge</DialogTitle>
            <DialogDescription>
              This action will permanently delete the selected inactive users from the platform. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {selectedUsers.length > 0 
                  ? `You are about to permanently delete ${selectedUsers.length} selected inactive users.`
                  : users && users.filter(user => !user.isActive && user.role !== 'global_admin').length > 0
                  ? `You are about to permanently delete all ${users.filter(user => !user.isActive && user.role !== 'global_admin').length} inactive users.`
                  : 'No inactive users to purge.'
                }
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPurgeDialog(false)}
                disabled={bulkPurgeMutation.isPending}
              >
                Cancel
              </Button>
              {selectedUsers.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => handleBulkPurge(false)}
                  disabled={bulkPurgeMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {bulkPurgeMutation.isPending ? 'Purging...' : `Purge ${selectedUsers.length} Selected`}
                </Button>
              )}
              {users && users.filter(user => !user.isActive && user.role !== 'global_admin').length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => handleBulkPurge(true)}
                  disabled={bulkPurgeMutation.isPending}
                  className="bg-red-700 hover:bg-red-800"
                >
                  {bulkPurgeMutation.isPending ? 'Purging...' : 'Purge All Inactive'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-8">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
            <CardTitle className="text-white">Global Platform Settings</CardTitle>
            <CardDescription className="text-blue-100">
              Configure platform-wide settings and payment integration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultMembershipPrice" className="text-[#20366B] font-medium">Default Membership Price (ZAR)</Label>
                    <Input
                      id="defaultMembershipPrice"
                      {...settingsForm.register("defaultMembershipPrice")}
                      placeholder="299.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="basicPlanPrice" className="text-[#20366B] font-medium">Basic Plan Price (ZAR)</Label>
                    <Input
                      id="basicPlanPrice"
                      {...settingsForm.register("basicPlanPrice")}
                      placeholder="199.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="premiumPlanPrice" className="text-[#20366B] font-medium">Premium Plan Price (ZAR)</Label>
                    <Input
                      id="premiumPlanPrice"
                      {...settingsForm.register("premiumPlanPrice")}
                      placeholder="499.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-[#20366B] mb-4">PayFast Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payfastMerchantId" className="text-[#20366B] font-medium">Merchant ID</Label>
                      <Input
                        id="payfastMerchantId"
                        {...settingsForm.register("payfastMerchantId")}
                        placeholder="Enter PayFast Merchant ID"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfastMerchantKey" className="text-[#20366B] font-medium">Merchant Key</Label>
                      <Input
                        id="payfastMerchantKey"
                        {...settingsForm.register("payfastMerchantKey")}
                        placeholder="Enter PayFast Merchant Key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfastPassphrase" className="text-[#20366B] font-medium">Passphrase (Optional)</Label>
                      <Input
                        id="payfastPassphrase"
                        {...settingsForm.register("payfastPassphrase")}
                        placeholder="Enter PayFast Passphrase"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t space-x-4">
                  <Button 
                    type="button"
                    onClick={() => {
                      console.log("Direct test button clicked!");
                      console.log("Form values:", settingsForm.getValues());
                      console.log("Form errors:", settingsForm.formState.errors);
                    }}
                    variant="outline"
                  >
                    Test Form Values
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveGlobalSettingsMutation.isPending}
                    className="bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white"
                    onClick={() => console.log("Save button clicked!")}
                  >
                    {saveGlobalSettingsMutation.isPending ? "Saving..." : "Save PayFast Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
    </div>
  );
}