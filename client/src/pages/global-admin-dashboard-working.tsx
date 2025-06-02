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

const orgEditSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Invalid email address"),
  description: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  planType: z.enum(['free', 'basic', 'premium']).optional(),
  isActive: z.boolean(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;
type OrgEditFormData = z.infer<typeof orgEditSchema>;

export default function GlobalAdminDashboard() {
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showOrgEditDialog, setShowOrgEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [showBookingsDialog, setShowBookingsDialog] = useState(false);
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);
  const [showOrganizations, setShowOrganizations] = useState(false);
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

  const orgEditForm = useForm<OrgEditFormData>({
    resolver: zodResolver(orgEditSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
      primaryColor: "#278DD4",
      secondaryColor: "#24D367",
      planType: "free",
      isActive: true,
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/global'],
    queryFn: () => api.getGlobalStats(),
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/organizations?includeInactive=true', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    },
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

  const { data: allBookings = [] } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
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

  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, orgData }: { orgId: number; orgData: OrgEditFormData }) => {
      return fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orgData),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update organization');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      setShowOrgEditDialog(false);
      setEditingOrg(null);
      orgEditForm.reset();
      toast({
        title: "Success",
        description: "Organisation updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organisation",
        variant: "destructive",
      });
    },
  });

  const handleViewOrg = (org: any) => {
    setSelectedOrg(org);
    setShowOrgDialog(true);
  };

  const handleEditOrg = (org: any) => {
    setEditingOrg(org);
    orgEditForm.reset({
      name: org.name || "",
      email: org.email || "",
      description: org.description || "",
      primaryColor: org.primaryColor || "#278DD4",
      secondaryColor: org.secondaryColor || "#24D367",
      planType: org.planType || "free",
      isActive: org.isActive ?? true,
    });
    setShowOrgDialog(false);
    setShowOrgEditDialog(true);
  };

  const onOrgEditSubmit = (data: OrgEditFormData) => {
    if (editingOrg) {
      updateOrgMutation.mutate({ orgId: editingOrg.id, orgData: data });
    }
  };

  const updateOrgStatusMutation = useMutation({
    mutationFn: ({ orgId, isActive }: { orgId: number; isActive: boolean }) => {
      return fetch(`/api/organizations/${orgId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update organization status');
        return res.json();
      });
    },
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
        <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Global Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="bg-white border-l-4 border-l-[#278DD4] shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
              onClick={() => setShowOrganizations(!showOrganizations)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Organisations</CardTitle>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#278DD4]" />
                  {showOrganizations ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">{stats?.totalOrganizations || 0}</div>
                <p className="text-xs text-slate-600">Click to view all organisations</p>
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

            <Card 
              className="bg-white border-l-4 border-l-[#24D3BF] shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowBookingsDialog(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Bookings</CardTitle>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#24D3BF]" />
                  <Eye className="h-3 w-3 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">{allBookings?.length || 0}</div>
                <p className="text-xs text-slate-600">Click to view all bookings</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-white border-l-4 border-l-[#278DD4] shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowRevenueDialog(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Revenue</CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#278DD4]" />
                  <Eye className="h-3 w-3 text-slate-400" />
                </div>
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

          {/* Organisations List */}
          {showOrganizations && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
                <CardTitle className="text-white">Platform Organisations</CardTitle>
                <CardDescription className="text-blue-100">
                  All registered organisations across ItsHappening.Africa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {orgsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#278DD4] border-t-transparent"></div>
                  </div>
                ) : (
                  <>
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
                              <h4 className="font-semibold text-[#20366B]">{org.name}</h4>
                              <p className="text-sm text-slate-600">{org.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant="secondary" 
                                  className={org.planType === 'premium' ? 'bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30' : 'bg-[#278DD4]/20 text-[#20366B] border-[#278DD4]/30'}
                                >
                                  {org.planType || 'free'}
                                </Badge>
                                <Badge 
                                  variant={org.isActive ? 'default' : 'secondary'}
                                  className={org.isActive ? 'bg-[#24D367] text-white' : 'bg-red-100 text-red-700'}
                                >
                                  {org.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewOrg(org)}
                              className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                            >
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
                              <UserCheck className="h-3 w-3" />
                              {org.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewOrg(org)}
                        className="gap-1 border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
                      >
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
                        <UserCheck className="h-3 w-3" />
                        {org.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-8">
          {/* PayFast Integration */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-[#278DD4] to-[#24D367] text-white rounded-t-lg">
              <CardTitle className="text-white">PayFast Integration</CardTitle>
              <CardDescription className="text-blue-100">
                Configure PayFast payment gateway for South African transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#20366B]">Merchant ID</label>
                    <Input placeholder="Enter PayFast Merchant ID" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#20366B]">Merchant Key</label>
                    <Input placeholder="Enter PayFast Merchant Key" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#20366B]">Passphrase</label>
                    <Input placeholder="Enter PayFast Passphrase" type="password" className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#20366B]/5 to-[#278DD4]/5 p-4 rounded-lg border border-[#278DD4]/20">
                    <h4 className="font-semibold text-[#20366B] mb-2">PayFast Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Not Connected</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Configure your PayFast credentials to enable payments
                    </p>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white">
                    Save PayFast Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white rounded-t-lg">
              <CardTitle className="text-white">Pricing Plans Configuration</CardTitle>
              <CardDescription className="text-white/90">
                Set pricing for Free, Basic and Premium plans across both business models
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Membership Business Model */}
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-4">Membership-Based Organisations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-2 border-[#278DD4]/30">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-[#20366B]">Free Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#278DD4]">R0</div>
                      <p className="text-sm text-slate-600">per month</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Members" value="25" className="text-center" />
                        <Input placeholder="Max Classes" value="5" className="text-center" />
                        <Input placeholder="Storage (GB)" value="1" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#24D367]/50 bg-gradient-to-b from-[#24D367]/5 to-white">
                    <CardHeader className="text-center pb-4">
                      <Badge className="mb-2 bg-[#24D367] text-white">Most Popular</Badge>
                      <CardTitle className="text-[#20366B]">Basic Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#24D367]">R299</div>
                      <p className="text-sm text-slate-600">per month</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Members" value="100" className="text-center" />
                        <Input placeholder="Max Classes" value="25" className="text-center" />
                        <Input placeholder="Storage (GB)" value="10" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#24D3BF]/50">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-[#20366B]">Premium Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#24D3BF]">R599</div>
                      <p className="text-sm text-slate-600">per month</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Members" value="Unlimited" className="text-center" />
                        <Input placeholder="Max Classes" value="Unlimited" className="text-center" />
                        <Input placeholder="Storage (GB)" value="100" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Pay-per-Class Business Model */}
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-4">Pay-per-Class Organisations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-2 border-[#278DD4]/30">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-[#20366B]">Free Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#278DD4]">5%</div>
                      <p className="text-sm text-slate-600">transaction fee</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Bookings/Month" value="50" className="text-center" />
                        <Input placeholder="Commission %" value="5" className="text-center" />
                        <Input placeholder="Storage (GB)" value="1" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#24D367]/50 bg-gradient-to-b from-[#24D367]/5 to-white">
                    <CardHeader className="text-center pb-4">
                      <Badge className="mb-2 bg-[#24D367] text-white">Most Popular</Badge>
                      <CardTitle className="text-[#20366B]">Basic Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#24D367]">3%</div>
                      <p className="text-sm text-slate-600">transaction fee</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Bookings/Month" value="200" className="text-center" />
                        <Input placeholder="Commission %" value="3" className="text-center" />
                        <Input placeholder="Storage (GB)" value="10" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#24D3BF]/50">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-[#20366B]">Premium Plan</CardTitle>
                      <div className="text-3xl font-bold text-[#24D3BF]">2%</div>
                      <p className="text-sm text-slate-600">transaction fee</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Input placeholder="Max Bookings/Month" value="Unlimited" className="text-center" />
                        <Input placeholder="Commission %" value="2" className="text-center" />
                        <Input placeholder="Storage (GB)" value="100" className="text-center" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <Button variant="outline" className="border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10">
                  Reset to Defaults
                </Button>
                <Button className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white">
                  Save Pricing Configuration
                </Button>
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

      {/* Organization Details Dialog */}
      <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#20366B]">Organisation Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#20366B]/5 via-[#278DD4]/5 to-[#24D367]/5 p-4 rounded-lg border border-[#278DD4]/20">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: selectedOrg.primaryColor || '#278DD4' }}
                  >
                    {selectedOrg.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#20366B]">{selectedOrg.name}</h3>
                    <p className="text-sm text-slate-600">{selectedOrg.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#20366B]">Description</label>
                  <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border">
                    {selectedOrg.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#20366B]">Plan Type</label>
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border">
                      <Badge 
                        variant="secondary" 
                        className={selectedOrg.planType === 'premium' ? 'bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30' : 'bg-[#278DD4]/20 text-[#20366B] border-[#278DD4]/30'}
                      >
                        {selectedOrg.planType || 'free'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#20366B]">Status</label>
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border">
                      <div className={`w-2 h-2 rounded-full ${selectedOrg.isActive ? 'bg-[#24D367]' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-slate-700">
                        {selectedOrg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#20366B]">Primary Color</label>
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: selectedOrg.primaryColor || '#278DD4' }}
                      ></div>
                      <span className="text-sm text-slate-700">
                        {selectedOrg.primaryColor || '#278DD4'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#20366B]">Organisation ID</label>
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border">
                      #{selectedOrg.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#278DD4]/20">
                <Button
                  onClick={() => handleEditOrg(selectedOrg)}
                  className="w-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Organisation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Organization Edit Dialog */}
      <Dialog open={showOrgEditDialog} onOpenChange={setShowOrgEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-4 rounded-t-lg text-white -m-6 mb-4">
            <DialogTitle className="text-white text-lg font-bold">Edit Organisation</DialogTitle>
            <DialogDescription className="text-white/90 text-sm">
              Update details for {editingOrg?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...orgEditForm}>
            <form onSubmit={orgEditForm.handleSubmit(onOrgEditSubmit)} className="space-y-4">
              <FormField
                control={orgEditForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#20366B] text-sm font-medium">Organisation Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Organisation name" 
                        className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={orgEditForm.control}
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

              <FormField
                control={orgEditForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#20366B] text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Organisation description" 
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
                  control={orgEditForm.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#20366B] text-sm font-medium">Plan Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={orgEditForm.control}
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
                  onClick={() => setShowOrgEditDialog(false)}
                  className="border-[#278DD4]/30 text-[#20366B] hover:bg-[#278DD4]/10 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateOrgMutation.isPending}
                  className="bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white h-9"
                >
                  {updateOrgMutation.isPending ? (
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

      {/* Bookings Details Dialog */}
      <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#20366B]">All Platform Bookings</DialogTitle>
            <DialogDescription>
              Complete list of bookings across all organisations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allBookings?.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#278DD4] rounded-lg flex items-center justify-center text-white font-bold">
                        {booking.participantName?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#20366B]">{booking.participantName}</h4>
                        <p className="text-sm text-slate-600">{booking.participantEmail}</p>
                        <p className="text-xs text-slate-500">
                          Booking #{booking.id} • {new Date(booking.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className={booking.status === 'confirmed' ? 'bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30' : 'bg-[#278DD4]/20 text-[#20366B] border-[#278DD4]/30'}
                      >
                        {booking.status || 'confirmed'}
                      </Badge>
                      {booking.amount && (
                        <p className="text-sm font-semibold text-[#20366B] mt-1">
                          {formatCurrency(booking.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Bookings Found</h3>
                <p className="text-slate-500">
                  No bookings have been made across the platform yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue Details Dialog */}
      <Dialog open={showRevenueDialog} onOpenChange={setShowRevenueDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#20366B]">Platform Revenue Analytics</DialogTitle>
            <DialogDescription>
              Revenue breakdown across all organisations and payment methods
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-[#24D367]/30">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm text-[#20366B]">Total Revenue</CardTitle>
                  <div className="text-2xl font-bold text-[#24D367]">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                </CardHeader>
              </Card>
              <Card className="border-2 border-[#278DD4]/30">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm text-[#20366B]">Commission Earned</CardTitle>
                  <div className="text-2xl font-bold text-[#278DD4]">
                    {formatCurrency((stats?.totalRevenue || 0) * 0.03)}
                  </div>
                </CardHeader>
              </Card>
              <Card className="border-2 border-[#24D3BF]/30">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm text-[#20366B]">Active Subscriptions</CardTitle>
                  <div className="text-2xl font-bold text-[#24D3BF]">
                    {organizations?.filter((org: any) => org.planType !== 'free').length || 0}
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#20366B]">Revenue by Organisation</h4>
              {organizations?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {organizations.map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: org.primaryColor || '#278DD4' }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-medium text-[#20366B]">{org.name}</h5>
                          <Badge 
                            variant="secondary" 
                            className={org.planType === 'premium' ? 'bg-[#24D367]/20 text-[#20366B] border-[#24D367]/30' : 'bg-[#278DD4]/20 text-[#20366B] border-[#278DD4]/30'}
                          >
                            {org.planType || 'free'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#20366B]">
                          {formatCurrency(Math.random() * 10000)} {/* This would come from actual revenue data */}
                        </p>
                        <p className="text-xs text-slate-500">This month</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Revenue Data</h3>
                  <p className="text-slate-500">
                    Revenue analytics will appear here as organisations start generating income.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}