import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Plus, Settings, Eye, ChevronDown, ChevronUp, UserCheck, Mail, Trash2, Edit2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const userEditSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  role: z.enum(['global_admin', 'organization_admin', 'coach', 'member']),
  isActive: z.boolean(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

export default function GlobalAdminDashboard() {
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "member",
      isActive: true,
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

  // Fetch user organizations for displaying relationships
  const { data: userOrganizations = [] } = useQuery({
    queryKey: ['/api/user-organizations'],
    queryFn: async () => {
      const response = await fetch('/api/user-organizations', {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: showUsers && !!users,
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

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: UserEditFormData }) => {
      return fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowEditDialog(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    editForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  };

  const onEditSubmit = (data: UserEditFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.id, userData: data });
    }
  };

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
        .filter((user: any) => !user.isActive && user.role !== 'global_admin')
        .map((user: any) => user.id);
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

  // Helper function to get user's organization relationships
  const getUserOrganizations = (userId: number) => {
    if (!userOrganizations || !organizations) return [];
    
    const userOrgRelations = userOrganizations.filter((rel: any) => rel.userId === userId);
    return userOrgRelations.map((rel: any) => {
      const org = organizations.find((o: any) => o.id === rel.organizationId);
      return {
        ...org,
        role: rel.role,
        isAdmin: rel.role === 'admin'
      };
    }).filter(Boolean);
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
                <p className="text-xs text-slate-600">Active sports organisations</p>
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
                <p className="text-xs text-slate-600">Click to view all users</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-[#24D3BF] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Bookings</CardTitle>
                <CreditCard className="h-4 w-4 text-[#24D3BF]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">{stats?.totalBookings || 0}</div>
                <p className="text-xs text-slate-600">Across all organisations</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#278DD4]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <p className="text-xs text-slate-600">Platform-wide revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
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
                    {/* Bulk Purge Controls */}
                    {users && users.filter((user: any) => !user.isActive && user.role !== 'global_admin').length > 0 && (
                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-orange-800 mb-1">Inactive User Management</h3>
                            <p className="text-sm text-orange-600">
                              {users.filter((user: any) => !user.isActive && user.role !== 'global_admin').length} inactive users found
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
                            <Dialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Bulk Purge ({selectedUsers.length} selected)
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-red-600">Confirm Bulk User Purge</DialogTitle>
                                  <DialogDescription>
                                    This action will permanently delete user accounts and cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-gray-600">
                                    You are about to delete {selectedUsers.length > 0 ? selectedUsers.length : 'all inactive'} user accounts.
                                  </p>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowPurgeDialog(false)}>
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
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleBulkPurge(true)}
                                      disabled={bulkPurgeMutation.isPending}
                                      className="bg-red-700 hover:bg-red-800"
                                    >
                                      {bulkPurgeMutation.isPending ? 'Purging...' : 'Purge All Inactive'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Users List */}
                    <div className="space-y-4">
                      {users?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {!user.isActive && user.role !== 'global_admin' && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                className="h-4 w-4 text-[#24D367] focus:ring-[#24D367] border-gray-300 rounded"
                              />
                            )}
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                                >
                                  <Eye className="h-4 w-4" />
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
                                    <div className="flex items-center gap-2 text-sm">
                                      <UserCheck className="h-4 w-4 text-[#24D367]" />
                                      <span className="text-slate-600">Role: {user.role.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-[#24D367] text-white border-[#24D367]' : 'bg-red-500 text-white border-red-500'}>
                                        {user.isActive ? 'Active Account' : 'Inactive Account'}
                                      </Badge>
                                    </div>
                                    
                                    {/* Organization Relationships */}
                                    {(() => {
                                      const userOrgs = getUserOrganizations(user.id);
                                      if (userOrgs.length > 0) {
                                        return (
                                          <div className="pt-2 border-t border-slate-200">
                                            <p className="text-sm font-medium text-[#20366B] mb-2">
                                              {user.role === 'organization_admin' ? 'Manages Organisation:' : 'Following Organisations:'}
                                            </p>
                                            <div className="space-y-2">
                                              {userOrgs.map((org: any) => (
                                                <div key={org.id} className="bg-gradient-to-r from-[#278DD4]/10 to-[#24D3BF]/10 p-2 rounded border border-[#278DD4]/20">
                                                  <div className="flex items-center justify-between">
                                                    <div>
                                                      <p className="text-sm font-medium text-[#20366B]">{org.name}</p>
                                                      <p className="text-xs text-slate-600">{org.description}</p>
                                                    </div>
                                                    <Badge 
                                                      variant="secondary" 
                                                      className={org.isAdmin ? 'bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30' : 'bg-[#24D3BF]/20 text-[#20366B] border-[#24D3BF]/30'}
                                                    >
                                                      {org.isAdmin ? 'Admin' : 'Follower'}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div className="flex justify-end pt-4 border-t">
                                    <Button
                                      onClick={() => handleEditUser(user)}
                                      className="bg-[#278DD4] hover:bg-[#20366B] text-white"
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit User
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
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
                  </>
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-4 rounded-t-lg text-white -m-6 mb-4">
            <DialogTitle className="text-white text-lg font-bold">Edit User</DialogTitle>
            <DialogDescription className="text-white/90 text-sm">
              Update details for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#20366B] text-sm font-medium">First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="First name" 
                          className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#20366B] text-sm font-medium">Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Last name" 
                          className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#20366B] text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Email address" 
                        className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#20366B] text-sm font-medium">Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="organization_admin">Org Admin</SelectItem>
                          <SelectItem value="global_admin">Global Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#20366B] text-sm font-medium">Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-[#24D367] mr-2"></div>
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="false">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                              Inactive
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-[#278DD4]/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white h-9"
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}