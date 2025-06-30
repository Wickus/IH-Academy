import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Settings, 
  TrendingUp,
  User,
  Plus,
  Trash,
  Eye,
  Power,
  DollarSign,
  Edit,
  Calendar,
  Key
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Fetch organisations data
  const { data: organisations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      if (!response.ok) throw new Error("Failed to fetch organisations");
      return response.json();
    }
  });

  // Fetch global stats
  const { data: globalStats = {}, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/stats/global'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stats/global");
      if (!response.ok) throw new Error("Failed to fetch global stats");
      return response.json();
    }
  });

  // Fetch users data
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  // Calculate overview stats
  const totalOrgs = organisations.length;
  const activeOrgs = organisations.filter((org: any) => org.subscriptionStatus === 'active').length;
  const trialOrgs = organisations.filter((org: any) => org.subscriptionStatus === 'trial').length;
  const totalUsers = users.length;

  if (loadingOrgs || loadingStats || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#20366B' }}>Global Admin Dashboard</h1>
          <p className="text-gray-600">Manage the IH Academy platform</p>
        </div>
        <div className="flex items-center gap-2">
          <img 
            src="https://itshappening.africa/wp-content/uploads/2024/06/images-1.jpeg" 
            alt="IH Academy"
            className="h-8 w-8 rounded object-cover"
          />
          <span className="font-semibold" style={{ color: '#20366B' }}>IH Academy</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">Organisations</TabsTrigger>
          <TabsTrigger value="global-admins" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">Global Admins</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            totalOrgs={totalOrgs}
            activeOrgs={activeOrgs}
            trialOrgs={trialOrgs}
            totalUsers={totalUsers}
            globalStats={globalStats}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganisationsTab organisations={organisations} />
        </TabsContent>

        <TabsContent value="global-admins" className="space-y-6">
          <GlobalAdminsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTab users={users} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueTab globalStats={globalStats} organisations={organisations} />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <PricingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ totalOrgs, activeOrgs, trialOrgs, totalUsers, globalStats, onTabChange }: {
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  totalUsers: number;
  globalStats: any;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-none shadow-md"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
          onClick={() => onTabChange("organizations")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organisations</CardTitle>
            <Building2 className="h-4 w-4" style={{ color: '#20366B' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#20366B' }}>{totalOrgs}</div>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {activeOrgs} active, {trialOrgs} in trial
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-none shadow-md"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
          onClick={() => onTabChange("users")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4" style={{ color: '#278DD4' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#278DD4' }}>{totalUsers}</div>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Across all organisations
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-none shadow-md"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
          onClick={() => onTabChange("revenue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: '#24D367' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#24D367' }}>
              R{globalStats?.totalRevenue ? Number(globalStats.totalRevenue).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </div>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Total platform revenue
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-none shadow-md"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
          onClick={() => onTabChange("pricing")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pricing Plans</CardTitle>
            <Settings className="h-4 w-4" style={{ color: '#20366B' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#20366B' }}>6</div>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Available pricing tiers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#1E293B' }}>Quick Actions</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:shadow-md transition-all"
              style={{ borderColor: '#E2E8F0', color: '#475569' }}
              onClick={() => onTabChange("organizations")}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Organisations</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:shadow-md transition-all"
              style={{ borderColor: '#E2E8F0', color: '#475569' }}
              onClick={() => onTabChange("global-admins")}
            >
              <Users className="h-6 w-6" />
              <span>Manage Admins</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 border-2 hover:shadow-md transition-all"
              style={{ borderColor: '#E2E8F0', color: '#475569' }}
              onClick={() => onTabChange("settings")}
            >
              <Settings className="h-6 w-6" />
              <span>Platform Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Organizations Tab Component
function OrganisationsTab({ organisations }: { organisations: any[] }) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'inactive'>('all');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [pricingData, setPricingData] = useState({
    membershipPrice: '',
    discountPercentage: '',
    commissionRate: '',
    paymentTerms: ''
  });
  const { toast } = useToast();

  // Filter organisations based on status
  const filteredOrgs = organisations.filter(org => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return org.isActive === true && (!org.trialEndDate || new Date(org.trialEndDate) < new Date());
    if (filterStatus === 'trial') return org.trialEndDate && new Date(org.trialEndDate) > new Date();
    if (filterStatus === 'inactive') return org.isActive === false;
    return true;
  });

  // Toggle organisation status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ orgId, newStatus }: { orgId: number; newStatus: boolean }) => {
      const response = await apiRequest("PUT", `/api/organizations/${orgId}/status`, { isActive: newStatus });
      if (!response.ok) throw new Error("Failed to update organisation status");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Organisation status updated" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  });

  // Delete organisation mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: number) => {
      const response = await apiRequest("DELETE", `/api/organizations/${orgId}`);
      if (!response.ok) throw new Error("Failed to delete organisation");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Organisation deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete organisation", variant: "destructive" });
    }
  });

  const handleToggleStatus = (org: any) => {
    const newStatus = org.isActive ? false : true;
    toggleStatusMutation.mutate({ orgId: org.id, newStatus });
  };

  const handleDelete = (org: any) => {
    if (confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
      deleteMutation.mutate(org.id);
    }
  };

  const handleView = (org: any) => {
    setSelectedOrg(org);
    setShowViewModal(true);
    // Initialize pricing data with organization's current values
    setPricingData({
      membershipPrice: org.membershipPrice || '',
      discountPercentage: org.customDiscount || '',
      commissionRate: org.commissionRate || '',
      paymentTerms: org.specialNotes ? org.specialNotes.replace('Payment Terms: ', '').replace(' days', '') : ''
    });
  };

  // Save pricing configuration mutation
  const savePricingMutation = useMutation({
    mutationFn: async (data: { orgId: number; pricing: any }) => {
      const response = await apiRequest("PATCH", `/api/organizations/${data.orgId}/fees`, {
        membershipPrice: data.pricing.membershipPrice,
        discountPercentage: data.pricing.discountPercentage,
        commissionRate: data.pricing.commissionRate,
        specialNotes: `Payment Terms: ${data.pricing.paymentTerms} days`
      });
      if (!response.ok) throw new Error("Failed to save pricing configuration");
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Pricing configuration saved successfully",
      });
      // Update the selected organization data immediately
      if (response.organization) {
        setSelectedOrg(response.organization);
        // Also update the form data to reflect the saved values
        setPricingData({
          membershipPrice: response.organization.membershipPrice || '',
          discountPercentage: response.organization.customDiscount || '',
          commissionRate: response.organization.commissionRate || '',
          paymentTerms: response.organization.specialNotes ? response.organization.specialNotes.replace('Payment Terms: ', '').replace(' days', '') : ''
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive",
      });
    }
  });

  const handleSavePricing = () => {
    if (!selectedOrg) return;
    savePricingMutation.mutate({
      orgId: selectedOrg.id,
      pricing: pricingData
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Organisations</h2>
          <p style={{ color: '#64748B' }}>Manage all organisations on the platform</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          style={filterStatus === 'all' ? { backgroundColor: '#20366B', color: 'white' } : { borderColor: '#E2E8F0' }}
        >
          All ({organisations.length})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
          style={filterStatus === 'active' ? { backgroundColor: '#24D367', color: 'white' } : { borderColor: '#E2E8F0' }}
        >
          Active ({organisations.filter(org => org.isActive === true && (!org.trialEndDate || new Date(org.trialEndDate) < new Date())).length})
        </Button>
        <Button
          variant={filterStatus === 'trial' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('trial')}
          style={filterStatus === 'trial' ? { backgroundColor: '#278DD4', color: 'white' } : { borderColor: '#E2E8F0' }}
        >
          Free Trial ({organisations.filter(org => org.trialEndDate && new Date(org.trialEndDate) > new Date()).length})
        </Button>
        <Button
          variant={filterStatus === 'inactive' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('inactive')}
          style={filterStatus === 'inactive' ? { backgroundColor: '#6B7280', color: 'white' } : { borderColor: '#E2E8F0' }}
        >
          Inactive ({organisations.filter(org => org.isActive === false).length})
        </Button>
      </div>

      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Building2 className="h-5 w-5" />
            {filterStatus === 'all' ? 'All Organisations' : 
             filterStatus === 'active' ? 'Active Organisations' :
             filterStatus === 'trial' ? 'Trial Organisations' : 'Inactive Organisations'}
          </CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            {filteredOrgs.length} organisations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrgs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
              <p style={{ color: '#64748B' }}>No organisations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrgs.map((org: any) => (
                <div key={org.id} className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full relative">
                      {org.logo ? (
                        <img 
                          src={org.logo} 
                          alt={org.name}
                          className="w-12 h-12 rounded-full object-cover border-2"
                          style={{ borderColor: org.primaryColor || '#E2E8F0' }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="fallback-avatar w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg absolute top-0 left-0"
                        style={{ 
                          background: org.primaryColor && org.secondaryColor ? 
                            `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)` :
                            'linear-gradient(135deg, #20366B 0%, #278DD4 100%)',
                          display: org.logo ? 'none' : 'flex'
                        }}
                      >
                        {org.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-lg" style={{ color: '#1E293B' }}>{org.name}</p>
                      <p className="text-sm" style={{ color: '#64748B' }}>{org.contactEmail}</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        Created: {org.createdAt && org.createdAt !== '1970-01-01T00:00:00.000Z' ? 
                          new Date(org.createdAt).toLocaleDateString() : 
                          'Date not available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        style={{ 
                          backgroundColor: org.isActive ? '#24D367' : '#6B7280',
                          color: 'white' 
                        }}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {org.trialEndDate && new Date(org.trialEndDate) > new Date() && (
                        <Badge variant="outline" className="text-xs px-2 py-1" style={{ borderColor: '#278DD4', color: '#278DD4' }}>
                          Trial
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 hover:bg-blue-50"
                        style={{ borderColor: '#E2E8F0' }}
                        onClick={() => handleView(org)}
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" style={{ color: '#64748B' }} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 hover:bg-green-50"
                        style={{ borderColor: '#E2E8F0' }}
                        onClick={() => handleToggleStatus(org)}
                        disabled={toggleStatusMutation.isPending}
                        title={org.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-5 w-5" style={{ color: org.isActive ? '#24D367' : '#6B7280' }} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 hover:bg-red-50"
                        style={{ borderColor: '#E2E8F0' }}
                        onClick={() => handleDelete(org)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                      >
                        <Trash className="h-5 w-5" style={{ color: '#EF4444' }} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Organization Management Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#20366B' }}>Organisation Management</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="fees">Fee Management</TabsTrigger>
                  <TabsTrigger value="debit-orders">Debit Orders</TabsTrigger>
                  <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div 
                  className="p-6 rounded-lg border-2"
                  style={{ 
                    background: selectedOrg.primaryColor && selectedOrg.secondaryColor ? 
                      `linear-gradient(135deg, ${selectedOrg.primaryColor}20 0%, ${selectedOrg.secondaryColor}20 100%)` :
                      'linear-gradient(135deg, #20366B20 0%, #278DD420 100%)',
                    borderColor: selectedOrg.primaryColor || '#20366B'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full relative">
                      {selectedOrg.logo ? (
                        <img 
                          src={selectedOrg.logo} 
                          alt={selectedOrg.name}
                          className="w-20 h-20 rounded-full object-cover border-3"
                          style={{ borderColor: selectedOrg.primaryColor || '#E2E8F0' }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="fallback-avatar w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl absolute top-0 left-0"
                        style={{ 
                          background: selectedOrg.primaryColor && selectedOrg.secondaryColor ? 
                            `linear-gradient(135deg, ${selectedOrg.primaryColor} 0%, ${selectedOrg.secondaryColor} 100%)` :
                            'linear-gradient(135deg, #20366B 0%, #278DD4 100%)',
                          display: selectedOrg.logo ? 'none' : 'flex'
                        }}
                      >
                        {selectedOrg.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold" style={{ color: '#1E293B' }}>{selectedOrg.name}</h3>
                      <p className="text-lg" style={{ color: '#64748B' }}>{selectedOrg.description || 'No description available'}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: selectedOrg.isActive ? '#24D367' : '#6B7280',
                            color: 'white' 
                          }}
                        >
                          {selectedOrg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {selectedOrg.trialEndDate && new Date(selectedOrg.trialEndDate) > new Date() && (
                          <Badge variant="outline" style={{ borderColor: '#278DD4', color: '#278DD4' }}>
                            Trial Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Organisation Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">ID</Label>
                        <p className="text-sm text-gray-600">{selectedOrg.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-gray-600">
                          {selectedOrg.createdAt ? new Date(selectedOrg.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {selectedOrg.inviteCode && (
                        <div>
                          <Label className="text-sm font-medium">Invite Code</Label>
                          <p className="text-sm text-gray-600 font-mono">{selectedOrg.inviteCode}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Branding</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: selectedOrg.primaryColor || '#20366B' }}
                          />
                          <span className="text-sm text-gray-600">{selectedOrg.primaryColor || '#20366B'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: selectedOrg.secondaryColor || '#278DD4' }}
                          />
                          <span className="text-sm text-gray-600">{selectedOrg.secondaryColor || '#278DD4'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Accent Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: selectedOrg.accentColor || '#24D367' }}
                          />
                          <span className="text-sm text-gray-600">{selectedOrg.accentColor || '#24D367'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Trial Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedOrg.trialEndDate ? (
                        <>
                          <div>
                            <Label className="text-sm font-medium">Trial End Date</Label>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedOrg.trialEndDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Days Remaining</Label>
                            <p className="text-sm text-gray-600">
                              {Math.max(0, Math.ceil((new Date(selectedOrg.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">No active trial</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="fees" className="space-y-6">
                {/* Current Pricing Display */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Pricing Configuration</CardTitle>
                    <CardDescription>Active pricing settings for {selectedOrg.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium text-gray-600">Membership Price</Label>
                        <p className="text-2xl font-bold text-gray-900">
                          R{selectedOrg.membershipPrice || 'Default'}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium text-gray-600">Discount Rate</Label>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedOrg.customDiscount || '0'}%
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium text-gray-600">Commission Rate</Label>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedOrg.commissionRate || '5'}%
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium text-gray-600">Payment Terms</Label>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedOrg.specialNotes ? selectedOrg.specialNotes.replace('Payment Terms: ', '').replace(' days', '') + ' days' : '30 days'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Pricing Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Update Pricing & Discounts</CardTitle>
                    <CardDescription>Modify organisation-specific pricing and discount rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Custom Membership Price (R)</Label>
                        <Input 
                          placeholder="299.00" 
                          value={pricingData.membershipPrice}
                          onChange={(e) => setPricingData(prev => ({ ...prev, membershipPrice: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Percentage (%)</Label>
                        <Input 
                          placeholder="0" 
                          type="number" 
                          min="0" 
                          max="100"
                          value={pricingData.discountPercentage}
                          onChange={(e) => setPricingData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Commission Rate (%)</Label>
                        <Input 
                          placeholder="5" 
                          type="number" 
                          min="0" 
                          max="100"
                          value={pricingData.commissionRate}
                          onChange={(e) => setPricingData(prev => ({ ...prev, commissionRate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Terms (Days)</Label>
                        <Input 
                          placeholder="30" 
                          type="number" 
                          min="1"
                          value={pricingData.paymentTerms}
                          onChange={(e) => setPricingData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSavePricing}
                      disabled={savePricingMutation.isPending}
                      className="text-white font-medium"
                      style={{ backgroundColor: '#20366B', color: 'white' }}
                    >
                      {savePricingMutation.isPending ? 'Saving...' : 'Save Pricing Configuration'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="debit-orders" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Active Mandates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">0</div>
                      <p className="text-sm text-gray-600">Current mandates</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Monthly Collection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">R0</div>
                      <p className="text-sm text-gray-600">This month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">0%</div>
                      <p className="text-sm text-gray-600">Collection rate</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Debit Order Management</CardTitle>
                    <CardDescription>Monitor and manage automated payment collections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No debit order data available</p>
                      <Button variant="outline" className="mt-4">
                        Set Up Debit Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Administrative Actions</CardTitle>
                      <CardDescription>Quick access to common management tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => window.open(`/dashboard?org=${selectedOrg.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Access Organisation Dashboard
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => handleToggleStatus(selectedOrg)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {selectedOrg.isActive ? 'Deactivate Organisation' : 'Activate Organisation'}
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Organisation Details
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Communication</CardTitle>
                      <CardDescription>Contact and messaging options</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start" variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Send Message to Admins
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Generate Support Report
                      </Button>
                      <Button 
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" 
                        variant="outline"
                        onClick={() => handleDelete(selectedOrg)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Organisation
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                  style={{ borderColor: '#E2E8F0' }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Global Admins Tab Component  
function GlobalAdminsTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const { toast } = useToast();

  // Fetch global admins
  const { data: globalAdmins = [], isLoading: loadingAdmins, refetch: refetchAdmins } = useQuery({
    queryKey: ['/api/global-admins'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/global-admins");
      if (!response.ok) throw new Error("Failed to fetch global admins");
      return response.json();
    }
  });

  // Add global admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (adminData: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/global-admins", adminData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add global admin");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Global admin added successfully" });
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminName("");
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove global admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await apiRequest("DELETE", `/api/global-admins/${adminId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove global admin");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Global admin removed successfully" });
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { adminId: number; newPassword: string }) => {
      const response = await apiRequest("POST", `/api/global-admins/${data.adminId}/reset-password`, {
        newPassword: data.newPassword
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset successfully" });
      setShowResetModal(false);
      setSelectedAdmin(null);
      setNewPassword("");
      setConfirmPassword("");
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    addAdminMutation.mutate({ email: newAdminEmail.trim(), name: newAdminName.trim() });
  };

  const handleRemoveAdmin = (adminId: number, adminName: string) => {
    if (confirm(`Are you sure you want to remove ${adminName} as a global admin?`)) {
      removeAdminMutation.mutate(adminId);
    }
  };

  const handleResetPassword = (admin: any) => {
    setSelectedAdmin(admin);
    setShowResetModal(true);
  };

  const submitPasswordReset = () => {
    if (!newPassword.trim()) {
      toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters long", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    resetPasswordMutation.mutate({ 
      adminId: selectedAdmin.id, 
      newPassword: newPassword.trim() 
    });
  };

  if (loadingAdmins) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Global Administrators</h2>
          <p style={{ color: '#64748B' }}>Manage users with global admin access to the platform</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#278DD4', color: 'white' }}
          className="hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Global Admin
        </Button>
      </div>

      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Users className="h-5 w-5" />
            Current Global Admins
          </CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Users with full administrative access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!globalAdmins || globalAdmins.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
              <p style={{ color: '#64748B' }}>No global admins found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {globalAdmins.map((admin: any) => (
                <div key={admin.id} className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, #20366B 0%, #24D367 100%)' }}>
                      {admin.name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1E293B' }}>{admin.name || admin.username}</p>
                      <p className="text-sm" style={{ color: '#64748B' }}>{admin.email}</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        Added: {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" style={{ backgroundColor: '#24D367', color: 'white' }}>
                      Global Admin
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(admin)}
                      disabled={resetPasswordMutation.isPending}
                      style={{ borderColor: '#E2E8F0' }}
                    >
                      <Key className="h-4 w-4" style={{ color: '#278DD4' }} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id, admin.name || admin.email)}
                      disabled={removeAdminMutation.isPending}
                      style={{ borderColor: '#E2E8F0' }}
                    >
                      <Trash className="h-4 w-4" style={{ color: '#EF4444' }} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Global Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Global Administrator</DialogTitle>
            <DialogDescription>
              Create a new global admin account with full platform access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="Enter full name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={addAdminMutation.isPending}
              style={{ backgroundColor: '#278DD4', color: 'white' }}
              className="hover:opacity-90"
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Global Admin Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedAdmin?.name || selectedAdmin?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (minimum 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPasswordReset}
              disabled={resetPasswordMutation.isPending}
              style={{ backgroundColor: '#278DD4', color: 'white' }}
              className="hover:opacity-90"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  const { toast } = useToast();
  const [payfastSettings, setPayfastSettings] = useState({
    merchantId: "",
    merchantKey: "", 
    passphrase: "",
    sandbox: true
  });

  // Fetch global settings
  const { data: globalSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/global-settings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/global-settings");
      if (!response.ok) throw new Error("Failed to fetch global settings");
      return response.json();
    }
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (globalSettings?.payfast) {
      setPayfastSettings(globalSettings.payfast);
    }
  }, [globalSettings]);

  // Save PayFast settings mutation
  const savePayfastMutation = useMutation({
    mutationFn: async (settings: typeof payfastSettings) => {
      const response = await apiRequest("POST", "/api/global-settings/payfast", settings);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save PayFast settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "PayFast settings saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSavePayfast = () => {
    if (!payfastSettings.merchantId.trim() || !payfastSettings.merchantKey.trim()) {
      toast({ title: "Error", description: "Please fill in Merchant ID and Merchant Key", variant: "destructive" });
      return;
    }
    savePayfastMutation.mutate(payfastSettings);
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Global Settings</h2>
        <p style={{ color: '#64748B' }}>Configure platform-wide settings and integrations</p>
      </div>

      {/* PayFast Configuration */}
      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Settings className="h-5 w-5" />
            PayFast Configuration
          </CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Global PayFast settings used as fallback when organisations don't have their own settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="merchant-id">Merchant ID</Label>
              <Input
                id="merchant-id"
                placeholder="Enter Merchant ID"
                value={payfastSettings.merchantId}
                onChange={(e) => setPayfastSettings(prev => ({ ...prev, merchantId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="merchant-key">Merchant Key</Label>
              <Input
                id="merchant-key"
                placeholder="Enter Merchant Key"
                value={payfastSettings.merchantKey}
                onChange={(e) => setPayfastSettings(prev => ({ ...prev, merchantKey: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="passphrase">Passphrase (Optional)</Label>
            <Input
              id="passphrase"
              placeholder="Enter Passphrase"
              value={payfastSettings.passphrase}
              onChange={(e) => setPayfastSettings(prev => ({ ...prev, passphrase: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="sandbox-mode"
              checked={payfastSettings.sandbox}
              onCheckedChange={(checked) => setPayfastSettings(prev => ({ ...prev, sandbox: checked }))}
            />
            <Label htmlFor="sandbox-mode">Sandbox Mode</Label>
          </div>
          <div className="pt-4">
            <Button
              onClick={handleSavePayfast}
              disabled={savePayfastMutation.isPending}
              style={{ backgroundColor: '#278DD4', color: 'white' }}
              className="hover:opacity-90"
            >
              {savePayfastMutation.isPending ? "Saving..." : "Save PayFast Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#1E293B' }}>Platform Information</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Current platform configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold" style={{ color: '#374151' }}>Platform Version</p>
              <p style={{ color: '#64748B' }}>IH Academy v2.0</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#374151' }}>Database</p>
              <p style={{ color: '#64748B' }}>PostgreSQL (Neon)</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#374151' }}>Email Service</p>
              <p style={{ color: '#64748B' }}>SendGrid</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#374151' }}>Payment Gateway</p>
              <p style={{ color: '#64748B' }}>PayFast + Debit Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users }: { users: any[] }) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cleanup orphaned users mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/users/cleanup-orphaned");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cleanup orphaned users");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Cleanup Completed", 
        description: `Removed ${data.deletedCount} orphaned users: ${data.deletedUsers.join(', ')}` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      // Invalidate all related queries with aggressive cache clearing
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      // Remove specific user from cache
      queryClient.removeQueries({ queryKey: ['/api/users', selectedUser?.id] });
      // Clear all query cache to force fresh data
      queryClient.clear();
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/users'] });
        queryClient.refetchQueries({ queryKey: ['/api/stats/global'] });
      }, 100);
      setShowViewModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch user details
  const { data: userDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['/api/users', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const response = await apiRequest("GET", `/api/users/${selectedUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      return response.json();
    },
    enabled: !!selectedUser?.id
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDeleteUser = (user: any) => {
    if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleCleanupOrphaned = () => {
    if (confirm('Are you sure you want to remove all orphaned users? This will permanently delete users not associated with any organisation.')) {
      cleanupMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Users</h2>
          <p style={{ color: '#64748B' }}>Manage all users across the platform</p>
        </div>
        <Button
          onClick={handleCleanupOrphaned}
          disabled={cleanupMutation.isPending}
          style={{ backgroundColor: '#EF4444', color: 'white' }}
          className="hover:opacity-90"
        >
          <Trash className="h-4 w-4 mr-2" />
          Cleanup Orphaned Users
        </Button>
      </div>

      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#1E293B' }}>
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            {users.length} users registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
              <p style={{ color: '#64748B' }}>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, #278DD4 0%, #24D367 100%)' }}>
                      {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1E293B' }}>{user.username}</p>
                      <p className="text-sm" style={{ color: '#64748B' }}>{user.email}</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        Role: {user.role || 'member'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: user.role === 'global_admin' ? '#20366B' : 
                                       user.role === 'organization_admin' ? '#278DD4' : 
                                       user.role === 'coach' ? '#24D367' : '#6B7280',
                        color: 'white' 
                      }}
                    >
                      {user.role || 'member'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                      style={{ borderColor: '#E2E8F0' }}
                      title="View User Details"
                    >
                      <Eye className="h-4 w-4" style={{ color: '#64748B' }} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={deleteMutation.isPending}
                      style={{ borderColor: '#E2E8F0' }}
                      title="Delete User"
                    >
                      <Trash className="h-4 w-4" style={{ color: '#EF4444' }} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal - Optimized for smaller screens */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2" style={{ color: '#20366B' }}>
              <User className="h-5 w-5" />
              User Details - {selectedUser?.username}
            </DialogTitle>
            <DialogDescription style={{ color: '#64748B' }}>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : userDetails ? (
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {/* User Info - Compact layout */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1E293B' }}>
                    <User className="h-4 w-4" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Username</label>
                      <p className="font-medium" style={{ color: '#1F2937' }}>{userDetails.username}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="font-medium" style={{ color: '#1F2937' }}>{userDetails.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Role</label>
                      <Badge className="text-xs" style={{ backgroundColor: '#278DD4', color: 'white' }}>
                        {userDetails.role || 'member'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <Badge className="text-xs" style={{ backgroundColor: userDetails.isActive ? '#24D367' : '#EF4444', color: 'white' }}>
                        {userDetails.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organisations - Scrollable list */}
              {userDetails.organizations && userDetails.organizations.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1E293B' }}>
                      <Building2 className="h-4 w-4" />
                      Organisations ({userDetails.organizations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {userDetails.organizations.map((org: any) => (
                        <div key={org.organizationId} className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate" style={{ color: '#1E293B' }}>
                              {org.organizationName || `Organisation ${org.organizationId}`}
                            </p>
                            <p className="text-xs" style={{ color: '#64748B' }}>Role: {org.role}</p>
                          </div>
                          <Badge className="text-xs ml-2" style={{ backgroundColor: '#20366B', color: 'white' }}>
                            {org.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Bookings - Scrollable list */}
              {userDetails.recentBookings && userDetails.recentBookings.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#1E293B' }}>
                      <Calendar className="h-4 w-4" />
                      Recent Bookings ({userDetails.bookingCount} total)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {userDetails.recentBookings.map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-2 rounded border border-gray-200 bg-gray-50">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate" style={{ color: '#1E293B' }}>{booking.className}</p>
                            <p className="text-xs" style={{ color: '#64748B' }}>
                              {booking.organizationName} • {new Date(booking.bookingDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="text-xs ml-2" style={{ backgroundColor: '#24D367', color: 'white' }}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: '#64748B' }}>Failed to load user details</p>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowViewModal(false)}
              style={{ borderColor: '#E2E8F0' }}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => handleDeleteUser(selectedUser)}
              disabled={deleteMutation.isPending}
              style={{ backgroundColor: '#EF4444', color: 'white' }}
              className="hover:opacity-90"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Revenue Tab Component
function RevenueTab({ globalStats, organisations }: { globalStats: any; organisations: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Revenue Dashboard</h2>
          <p style={{ color: '#64748B' }}>Monitor platform revenue and financial metrics</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <CardHeader>
            <CardTitle style={{ color: '#1E293B' }}>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#24D367' }}>
              R{globalStats?.totalRevenue ? Number(globalStats.totalRevenue).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </div>
            <p className="text-xs" style={{ color: '#64748B' }}>All-time platform revenue</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <CardHeader>
            <CardTitle style={{ color: '#1E293B' }}>Active Organisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#278DD4' }}>
              {organisations ? organisations.filter((org: any) => org.subscriptionStatus === 'active').length : 0}
            </div>
            <p className="text-xs" style={{ color: '#64748B' }}>Active organisations</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <CardHeader>
            <CardTitle style={{ color: '#1E293B' }}>Average Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#20366B' }}>
              R{globalStats?.totalRevenue && globalStats?.totalOrganizations > 0 
                ? Math.round(globalStats.totalRevenue / globalStats.totalOrganizations).toLocaleString('en-ZA') 
                : '0'}
            </div>
            <p className="text-xs" style={{ color: '#64748B' }}>Per organisation</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#1E293B' }}>Revenue Overview</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Detailed revenue reporting will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
            <p style={{ color: '#64748B' }}>Revenue charts and analytics coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Pricing Tab Component
function PricingTab() {
  const [pricingConfig, setPricingConfig] = useState({
    membership: {
      free: { name: "Starter", price: "0", maxMembers: "25", maxClasses: "5", storage: "1" },
      basic: { name: "Professional", price: "299", maxMembers: "100", maxClasses: "25", storage: "10" },
      premium: { name: "Enterprise", price: "599", maxMembers: "Unlimited", maxClasses: "Unlimited", storage: "100" }
    },
    payPerClass: {
      free: { name: "Basic", commission: "5", maxBookings: "50", storage: "1" },
      basic: { name: "Standard", commission: "3", maxBookings: "200", storage: "10" },
      premium: { name: "Premium", commission: "2", maxBookings: "Unlimited", storage: "100" }
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved pricing configuration
  const { data: savedPricingConfig, isLoading: loadingPricingConfig } = useQuery({
    queryKey: ['/api/admin/pricing-config'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/pricing-config");
        return response.json();
      } catch (error) {
        console.warn('Error loading pricing configuration:', error);
        return null;
      }
    },
  });

  // Update local state when saved pricing config is loaded
  useEffect(() => {
    if (savedPricingConfig) {
      setPricingConfig(savedPricingConfig);
    }
  }, [savedPricingConfig]);

  // Handle pricing configuration changes
  const updatePricingConfig = (model: 'membership' | 'payPerClass', plan: 'free' | 'basic' | 'premium', field: string, value: string) => {
    setPricingConfig(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        [plan]: {
          ...prev[model][plan],
          [field]: value
        }
      }
    }));
  };

  // Save pricing configuration mutation
  const savePricingMutation = useMutation({
    mutationFn: async (config: typeof pricingConfig) => {
      const response = await apiRequest("POST", "/api/admin/pricing-config", config);
      if (!response.ok) throw new Error('Failed to save pricing configuration');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pricing configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pricing'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    savePricingMutation.mutate(pricingConfig);
  };

  if (loadingPricingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Pricing Configuration</h2>
          <p style={{ color: '#64748B' }}>Manage subscription plans and pricing tiers for all organisations</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={savePricingMutation.isPending}
          className="text-white font-medium"
          style={{ backgroundColor: '#20366B', color: 'white' }}
        >
          {savePricingMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Membership Business Model */}
      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#20366B' }}>Membership-Based Organisations</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Monthly subscription pricing for membership organisations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className="border-2" style={{ borderColor: '#278DD4' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.membership.free.name}
                    onChange={(e) => updatePricingConfig('membership', 'free', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    R
                    <Input 
                      value={pricingConfig.membership.free.price}
                      onChange={(e) => updatePricingConfig('membership', 'free', 'price', e.target.value)}
                      className="inline-block w-20 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Members</Label>
                  <Input 
                    value={pricingConfig.membership.free.maxMembers}
                    onChange={(e) => updatePricingConfig('membership', 'free', 'maxMembers', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Classes</Label>
                  <Input 
                    value={pricingConfig.membership.free.maxClasses}
                    onChange={(e) => updatePricingConfig('membership', 'free', 'maxClasses', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.membership.free.storage}
                    onChange={(e) => updatePricingConfig('membership', 'free', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="border-2" style={{ borderColor: '#24D367' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.membership.basic.name}
                    onChange={(e) => updatePricingConfig('membership', 'basic', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    R
                    <Input 
                      value={pricingConfig.membership.basic.price}
                      onChange={(e) => updatePricingConfig('membership', 'basic', 'price', e.target.value)}
                      className="inline-block w-20 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Members</Label>
                  <Input 
                    value={pricingConfig.membership.basic.maxMembers}
                    onChange={(e) => updatePricingConfig('membership', 'basic', 'maxMembers', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Classes</Label>
                  <Input 
                    value={pricingConfig.membership.basic.maxClasses}
                    onChange={(e) => updatePricingConfig('membership', 'basic', 'maxClasses', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.membership.basic.storage}
                    onChange={(e) => updatePricingConfig('membership', 'basic', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2" style={{ borderColor: '#F59E0B' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.membership.premium.name}
                    onChange={(e) => updatePricingConfig('membership', 'premium', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    R
                    <Input 
                      value={pricingConfig.membership.premium.price}
                      onChange={(e) => updatePricingConfig('membership', 'premium', 'price', e.target.value)}
                      className="inline-block w-20 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Members</Label>
                  <Input 
                    value={pricingConfig.membership.premium.maxMembers}
                    onChange={(e) => updatePricingConfig('membership', 'premium', 'maxMembers', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Classes</Label>
                  <Input 
                    value={pricingConfig.membership.premium.maxClasses}
                    onChange={(e) => updatePricingConfig('membership', 'premium', 'maxClasses', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.membership.premium.storage}
                    onChange={(e) => updatePricingConfig('membership', 'premium', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Pay Per Class Business Model */}
      <Card className="border-none shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#20366B' }}>Pay-Per-Class Organisations</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            Commission-based pricing for pay-per-class organisations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className="border-2" style={{ borderColor: '#278DD4' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.payPerClass.free.name}
                    onChange={(e) => updatePricingConfig('payPerClass', 'free', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    <Input 
                      value={pricingConfig.payPerClass.free.commission}
                      onChange={(e) => updatePricingConfig('payPerClass', 'free', 'commission', e.target.value)}
                      className="inline-block w-16 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                    %
                  </div>
                  <p className="text-sm text-gray-600">commission</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Bookings</Label>
                  <Input 
                    value={pricingConfig.payPerClass.free.maxBookings}
                    onChange={(e) => updatePricingConfig('payPerClass', 'free', 'maxBookings', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.payPerClass.free.storage}
                    onChange={(e) => updatePricingConfig('payPerClass', 'free', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="border-2" style={{ borderColor: '#24D367' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.payPerClass.basic.name}
                    onChange={(e) => updatePricingConfig('payPerClass', 'basic', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    <Input 
                      value={pricingConfig.payPerClass.basic.commission}
                      onChange={(e) => updatePricingConfig('payPerClass', 'basic', 'commission', e.target.value)}
                      className="inline-block w-16 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                    %
                  </div>
                  <p className="text-sm text-gray-600">commission</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Bookings</Label>
                  <Input 
                    value={pricingConfig.payPerClass.basic.maxBookings}
                    onChange={(e) => updatePricingConfig('payPerClass', 'basic', 'maxBookings', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.payPerClass.basic.storage}
                    onChange={(e) => updatePricingConfig('payPerClass', 'basic', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2" style={{ borderColor: '#F59E0B' }}>
              <CardHeader className="text-center pb-4">
                <div className="space-y-2">
                  <Input 
                    value={pricingConfig.payPerClass.premium.name}
                    onChange={(e) => updatePricingConfig('payPerClass', 'premium', 'name', e.target.value)}
                    className="text-center font-bold text-lg border-0 p-0"
                    style={{ color: '#20366B' }}
                  />
                  <div className="text-3xl font-bold" style={{ color: '#278DD4' }}>
                    <Input 
                      value={pricingConfig.payPerClass.premium.commission}
                      onChange={(e) => updatePricingConfig('payPerClass', 'premium', 'commission', e.target.value)}
                      className="inline-block w-16 text-center border-0 p-0 text-3xl font-bold"
                      style={{ color: '#278DD4' }}
                    />
                    %
                  </div>
                  <p className="text-sm text-gray-600">commission</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Bookings</Label>
                  <Input 
                    value={pricingConfig.payPerClass.premium.maxBookings}
                    onChange={(e) => updatePricingConfig('payPerClass', 'premium', 'maxBookings', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage (GB)</Label>
                  <Input 
                    value={pricingConfig.payPerClass.premium.storage}
                    onChange={(e) => updatePricingConfig('payPerClass', 'premium', 'storage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}