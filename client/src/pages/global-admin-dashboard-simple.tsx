import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, CreditCard, TrendingUp, Settings, Trash2, Eye, Power, Mail, Phone, MapPin, Calendar, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GlobalAdminDashboard() {
  console.log('GlobalAdminDashboard component rendering');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Delete organization mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (organizationId: number) => {
      const response = await apiRequest("DELETE", `/api/organizations/${organizationId}`);
      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }
      return response.json();
    },
    onSuccess: (data, organizationId) => {
      toast({
        title: "Organization Deleted",
        description: data.message || "Organization has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/global'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete organization.",
        variant: "destructive",
      });
    },
  });

  // Toggle organization status mutation
  const toggleOrganizationMutation = useMutation({
    mutationFn: async ({ organizationId, isActive }: { organizationId: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/organizations/${organizationId}`, {
        isActive: !isActive
      });
      if (!response.ok) {
        throw new Error("Failed to update organization status");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Organization Updated",
        description: `Organization has been ${variables.isActive ? 'deactivated' : 'activated'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update organization.",
        variant: "destructive",
      });
    },
  });

  // Fetch organizations data
  const { data: organizations = [], isLoading: orgLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations?includeInactive=true");
      return response.json();
    },
  });

  // Fetch global stats
  const { data: globalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/global'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stats/global");
      return response.json();
    },
  });
  
  // Pricing configuration state
  const [pricingConfig, setPricingConfig] = useState({
    membership: {
      free: { 
        name: "Starter",
        price: "0", 
        maxMembers: "25", 
        maxClasses: "5", 
        storage: "1" 
      },
      basic: { 
        name: "Professional",
        price: "299", 
        maxMembers: "100", 
        maxClasses: "25", 
        storage: "10" 
      },
      premium: { 
        name: "Enterprise",
        price: "599", 
        maxMembers: "Unlimited", 
        maxClasses: "Unlimited", 
        storage: "100" 
      }
    },
    payPerClass: {
      free: { 
        name: "Starter",
        commission: "5", 
        maxBookings: "50", 
        storage: "1" 
      },
      basic: { 
        name: "Professional",
        commission: "3", 
        maxBookings: "200", 
        storage: "10" 
      },
      premium: { 
        name: "Enterprise",
        commission: "2", 
        maxBookings: "Unlimited", 
        storage: "100" 
      }
    }
  });

  // Load saved pricing configuration
  const { data: savedPricingConfig } = useQuery({
    queryKey: ['/api/admin/pricing-config'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/pricing-config', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.warn('Failed to load pricing configuration:', response.status);
          return null;
        }
        
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
      const response = await fetch('/api/admin/pricing-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save pricing configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pricing configuration saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header with ItsHappening.Africa branding */}
      <div className="bg-gradient-to-r from-[#20366B] via-[#278DD4] to-[#24D367] p-6 rounded-lg text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Global Administration</h1>
            <p className="text-white/90 mt-2">
              ItsHappening.Africa platform overview and management
            </p>
          </div>
          <Button 
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  window.location.href = '/';
                } else {
                  console.error('Logout failed');
                }
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Organizations
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Pricing Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Global Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-[#278DD4]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">
                  {statsLoading ? "..." : organizations.length}
                </div>
                <div className="flex gap-2 text-xs text-slate-600 mt-1">
                  <span>Active: {organizations.filter(org => org.subscriptionStatus === 'active').length}</span>
                  <span>•</span>
                  <span>Trial: {organizations.filter(org => org.subscriptionStatus === 'trial').length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-[#24D367] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Users</CardTitle>
                <Users className="h-4 w-4 text-[#24D367]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">
                  {statsLoading ? "..." : globalStats?.totalUsers || "0"}
                </div>
                <p className="text-xs text-slate-600">Platform members</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-[#24D3BF] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Bookings</CardTitle>
                <CreditCard className="h-4 w-4 text-[#24D3BF]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">
                  {statsLoading ? "..." : globalStats?.totalBookings || "0"}
                </div>
                <p className="text-xs text-slate-600">Across all organizations</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#20366B]">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#278DD4]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#20366B]">
                  R{statsLoading ? "..." : globalStats?.totalRevenue || "0"}
                </div>
                <p className="text-xs text-slate-600">Platform-wide revenue</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#20366B]">Organizations Management</CardTitle>
              <CardDescription>Manage all sports organizations on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {orgLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#278DD4] mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading organizations...</p>
                </div>
              ) : organizations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Organizations Found</h3>
                  <p className="text-slate-500">Organizations will appear here once they register.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {organizations.map((org: any) => (
                    <div key={org.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {org.logoUrl ? (
                            <img 
                              src={org.logoUrl} 
                              alt={org.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${!org.logoUrl ? '' : 'hidden'}`}
                               style={{ backgroundColor: org.primaryColor || '#278DD4' }}>
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#20366B]">{org.name}</h3>
                            <p className="text-sm text-slate-600">{org.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                org.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                                org.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {org.subscriptionStatus || 'Unknown'}
                              </span>
                              <span className="text-xs text-slate-500">
                                Plan: {org.planType || 'Free'}
                              </span>
                              {org.trialEndDate && org.subscriptionStatus === 'trial' && (
                                <span className="text-xs text-slate-500">
                                  Trial ends: {new Date(org.trialEndDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedOrganization(org);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${org.isActive ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                            onClick={() => {
                              toggleOrganizationMutation.mutate({ organizationId: org.id, isActive: org.isActive });
                            }}
                            disabled={toggleOrganizationMutation.isPending}
                          >
                            <Power className="h-4 w-4 mr-1" />
                            {org.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete ${org.name}? This action cannot be undone and will remove all associated data including classes, bookings, and members.`)) {
                                deleteOrganizationMutation.mutate(org.id);
                              }
                            }}
                            disabled={deleteOrganizationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleteOrganizationMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#20366B]">Pricing Configuration</CardTitle>
              <CardDescription>
                Configure plan names and pricing for both membership and pay-per-class models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Membership Plans */}
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-4">Membership Plans</h3>
                <div className="grid gap-6 md:grid-cols-3">
                  {Object.entries(pricingConfig.membership).map(([planKey, plan]) => (
                    <Card key={planKey} className="border-2 border-[#278DD4]/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-[#20366B] capitalize">{planKey} Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor={`membership-${planKey}-name`} className="text-[#20366B] text-sm font-medium">
                            Plan Name
                          </Label>
                          <Input
                            id={`membership-${planKey}-name`}
                            value={plan.name}
                            onChange={(e) => updatePricingConfig('membership', planKey as 'free' | 'basic' | 'premium', 'name', e.target.value)}
                            className="border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                            placeholder="Plan name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`membership-${planKey}-price`} className="text-[#20366B] text-sm font-medium">
                            Monthly Price (R)
                          </Label>
                          <Input
                            id={`membership-${planKey}-price`}
                            value={plan.price}
                            onChange={(e) => updatePricingConfig('membership', planKey as 'free' | 'basic' | 'premium', 'price', e.target.value)}
                            className="border-[#278DD4]/30 focus:border-[#278DD4] focus:ring-[#278DD4]/20"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-[#20366B] text-sm font-medium">Features</Label>
                          <div className="text-xs text-slate-600 space-y-1">
                            <div>• {plan.maxMembers} members</div>
                            <div>• {plan.maxClasses} classes</div>
                            <div>• {plan.storage}GB storage</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pay-per-Class Plans */}
              <div>
                <h3 className="text-lg font-semibold text-[#20366B] mb-4">Pay-per-Class Plans</h3>
                <div className="grid gap-6 md:grid-cols-3">
                  {Object.entries(pricingConfig.payPerClass).map(([planKey, plan]) => (
                    <Card key={planKey} className="border-2 border-[#24D367]/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-[#20366B] capitalize">{planKey} Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor={`payperclass-${planKey}-name`} className="text-[#20366B] text-sm font-medium">
                            Plan Name
                          </Label>
                          <Input
                            id={`payperclass-${planKey}-name`}
                            value={plan.name}
                            onChange={(e) => updatePricingConfig('payPerClass', planKey as 'free' | 'basic' | 'premium', 'name', e.target.value)}
                            className="border-[#24D367]/30 focus:border-[#24D367] focus:ring-[#24D367]/20"
                            placeholder="Plan name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`payperclass-${planKey}-commission`} className="text-[#20366B] text-sm font-medium">
                            Commission (%)
                          </Label>
                          <Input
                            id={`payperclass-${planKey}-commission`}
                            value={plan.commission}
                            onChange={(e) => updatePricingConfig('payPerClass', planKey as 'free' | 'basic' | 'premium', 'commission', e.target.value)}
                            className="border-[#24D367]/30 focus:border-[#24D367] focus:ring-[#24D367]/20"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <Label className="text-[#20366B] text-sm font-medium">Features</Label>
                          <div className="text-xs text-slate-600 space-y-1">
                            <div>• {plan.maxBookings} bookings</div>
                            <div>• {plan.storage}GB storage</div>
                            <div>• {plan.commission}% commission</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                  onClick={() => savePricingMutation.mutate(pricingConfig)}
                  disabled={savePricingMutation.isPending}
                  className="bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#20366B] hover:to-[#278DD4] text-white"
                >
                  {savePricingMutation.isPending ? "Saving..." : "Save Pricing Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Organization Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-[#20366B]">
              <div className="flex items-center gap-3">
                {selectedOrganization?.logo ? (
                  <img 
                    src={selectedOrganization.logo} 
                    alt={selectedOrganization.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: selectedOrganization?.primaryColor || '#278DD4' }}
                  >
                    {selectedOrganization?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedOrganization?.name}</h2>
                  <Badge 
                    className={`mt-1 ${
                      selectedOrganization?.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                      selectedOrganization?.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedOrganization?.subscriptionStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete organization details and management information
            </DialogDescription>
          </DialogHeader>

          {selectedOrganization && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#20366B] flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Organization Name</Label>
                      <p className="text-[#20366B] font-semibold">{selectedOrganization.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-gray-800">{selectedOrganization.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Business Model</Label>
                      <Badge variant="outline" className="ml-0">
                        {selectedOrganization.businessModel === 'membership' ? 'Membership' : 'Pay per Class'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Plan Type</Label>
                      <Badge variant="outline" className="ml-0 capitalize">
                        {selectedOrganization.planType || 'Free'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="text-gray-800">{selectedOrganization.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <p className="text-gray-800">{selectedOrganization.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      <p className="text-gray-800">{selectedOrganization.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <p className="text-gray-800">{selectedOrganization.website || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#20366B] flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Subscription Status</Label>
                      <Badge 
                        className={`ml-0 ${
                          selectedOrganization.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                          selectedOrganization.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {selectedOrganization.subscriptionStatus || 'Unknown'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Membership Price</Label>
                      <p className="text-[#20366B] font-semibold">R{selectedOrganization.membershipPrice}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Billing Cycle</Label>
                      <p className="text-gray-800 capitalize">{selectedOrganization.membershipBillingCycle || 'Monthly'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedOrganization.trialStartDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Trial Start Date
                        </Label>
                        <p className="text-gray-800">{new Date(selectedOrganization.trialStartDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedOrganization.trialEndDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Trial End Date
                        </Label>
                        <p className="text-gray-800">{new Date(selectedOrganization.trialEndDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={selectedOrganization.isActive ? "default" : "secondary"}>
                        {selectedOrganization.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#20366B] flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Branding & Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: selectedOrganization.primaryColor || '#278DD4' }}
                      ></div>
                      <p className="text-gray-800 font-mono text-sm">{selectedOrganization.primaryColor || '#278DD4'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: selectedOrganization.secondaryColor || '#24D367' }}
                      ></div>
                      <p className="text-gray-800 font-mono text-sm">{selectedOrganization.secondaryColor || '#24D367'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Accent Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: selectedOrganization.accentColor || '#F97316' }}
                      ></div>
                      <p className="text-gray-800 font-mono text-sm">{selectedOrganization.accentColor || '#F97316'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className={`${selectedOrganization.isActive ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                  onClick={() => {
                    toggleOrganizationMutation.mutate({ 
                      organizationId: selectedOrganization.id, 
                      isActive: selectedOrganization.isActive 
                    });
                    setShowViewModal(false);
                  }}
                  disabled={toggleOrganizationMutation.isPending}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {selectedOrganization.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete ${selectedOrganization.name}? This action cannot be undone and will remove all associated data including classes, bookings, and members.`)) {
                      deleteOrganizationMutation.mutate(selectedOrganization.id);
                      setShowViewModal(false);
                    }
                  }}
                  disabled={deleteOrganizationMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteOrganizationMutation.isPending ? 'Deleting...' : 'Delete Organization'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}