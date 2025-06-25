import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, CreditCard, TrendingUp, Settings, Trash2, Eye, Power, Mail, Phone, MapPin, Calendar, Globe, Plus, Trash, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GlobalAdminDashboard() {
  console.log('GlobalAdminDashboard component rendering');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingFields, setEditingFields] = useState<{[key: string]: any}>({});
  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({});

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
      // Immediately remove from cache to prevent re-appearance
      queryClient.setQueryData(['/api/organizations'], (oldData: any[]) => {
        if (oldData) {
          return oldData.filter(org => org.id !== organizationId);
        }
        return [];
      });
      
      // Clear all cache and force fresh fetch
      queryClient.removeQueries({ queryKey: ['/api/organizations'] });
      queryClient.removeQueries({ queryKey: ['/api/stats/global'] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/organizations'] });
        queryClient.refetchQueries({ queryKey: ['/api/stats/global'] });
      }, 100);
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
      const response = await apiRequest("GET", "/api/organizations");
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
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
        <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            Organizations
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Global Admins
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
              className="bg-white border-l-4 border-l-[#278DD4] shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => {
                const orgTab = document.querySelector('[value="organizations"]') as HTMLElement;
                if (orgTab) orgTab.click();
              }}
            >
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

            <Card className="bg-white border-l-4 border-l-[#24D367] shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => {
                const adminsTab = document.querySelector('[value="admins"]') as HTMLElement;
                if (adminsTab) adminsTab.click();
              }}
            >
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

            <Card className="bg-white border-l-4 border-l-[#24D3BF] shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105">
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

            <Card className="bg-white border-l-4 border-l-[#278DD4] shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => {
                const settingsTab = document.querySelector('[value="settings"]') as HTMLElement;
                if (settingsTab) settingsTab.click();
              }}
            >
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

        <TabsContent value="debit-orders" className="space-y-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#20366B]">Global Debit Order Management</CardTitle>
              <CardDescription>Manage debit order collections across all organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#278DD4]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Active Mandates</p>
                        <p className="text-2xl font-bold text-[#20366B]">247</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-[#278DD4]" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#24D367]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Collection</p>
                        <p className="text-2xl font-bold text-[#20366B]">R73,410</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-[#24D367]" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#F97316]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Failed Collections</p>
                        <p className="text-2xl font-bold text-[#20366B]">12</p>
                      </div>
                      <Building2 className="h-8 w-8 text-[#F97316]" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#278DD4]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-[#20366B]">95.1%</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-[#278DD4]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button className="bg-[#278DD4] hover:bg-[#1e6ba8] text-white">
                  Process All Collections
                </Button>
                <Button variant="outline" className="border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white">
                  Download Collection Report
                </Button>
                <Button variant="outline" className="border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white">
                  View Failed Collections
                </Button>
              </div>

              {/* Organizations with Debit Orders */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#20366B]">Organizations by Collection Amount</h3>
                {organizations.slice(0, 5).map((org: any) => (
                  <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: org.primaryColor || '#278DD4' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#20366B]">{org.name}</h4>
                          <p className="text-sm text-gray-600">
                            {Math.floor(Math.random() * 20 + 5)} active mandates
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#24D367]">
                          R{(Math.random() * 15000 + 2000).toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-500">monthly collection</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" 
                      style={{ 
                        background: `linear-gradient(135deg, ${selectedOrganization?.primaryColor || '#20366B'}15, ${selectedOrganization?.secondaryColor || '#278DD4'}10)`,
                        borderColor: selectedOrganization?.primaryColor || '#278DD4'
                      }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3" 
                        style={{ color: selectedOrganization?.primaryColor || '#20366B' }}>
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
                    style={{ 
                      backgroundColor: selectedOrganization?.subscriptionStatus === 'active' ? selectedOrganization?.accentColor + '20' || '#24D36720' :
                                       selectedOrganization?.subscriptionStatus === 'trial' ? selectedOrganization?.secondaryColor + '20' || '#278DD420' :
                                       '#f59e0b20',
                      color: selectedOrganization?.subscriptionStatus === 'active' ? selectedOrganization?.accentColor || '#24D367' :
                             selectedOrganization?.subscriptionStatus === 'trial' ? selectedOrganization?.secondaryColor || '#278DD4' :
                             '#f59e0b'
                    }}
                  >
                    {selectedOrganization?.subscriptionStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  style={{ 
                    borderColor: selectedOrganization?.primaryColor || '#278DD4',
                    color: selectedOrganization?.primaryColor || '#278DD4'
                  }}
                  onClick={() => {
                    localStorage.setItem('globalAdminOrgAccess', selectedOrganization?.id.toString());
                    window.location.href = `/organization-dashboard?orgId=${selectedOrganization?.id}&globalAdminAccess=true`;
                  }}
                >
                  Access Dashboard
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete organization details and management information
            </DialogDescription>
          </DialogHeader>

          {selectedOrganization && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card style={{ borderColor: selectedOrganization?.primaryColor + '30' || '#278DD430' }}>
                <CardHeader style={{ backgroundColor: selectedOrganization?.primaryColor + '10' || '#278DD410' }}>
                  <CardTitle style={{ color: selectedOrganization?.primaryColor || '#20366B' }} className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Organization Name</Label>
                      {isEditing.name ? (
                        <Input
                          value={editingFields.name || selectedOrganization.name}
                          onChange={(e) => setEditingFields({...editingFields, name: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-[#20366B] font-semibold cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, name: true})}>
                          {selectedOrganization.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      {isEditing.description ? (
                        <Input
                          value={editingFields.description || selectedOrganization.description || ''}
                          onChange={(e) => setEditingFields({...editingFields, description: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-gray-800 cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, description: true})}>
                          {selectedOrganization.description || 'Click to add description'}
                        </p>
                      )}
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
                      {isEditing.email ? (
                        <Input
                          value={editingFields.email || selectedOrganization.email}
                          onChange={(e) => setEditingFields({...editingFields, email: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-gray-800 cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, email: true})}>
                          {selectedOrganization.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      {isEditing.phone ? (
                        <Input
                          value={editingFields.phone || selectedOrganization.phone || ''}
                          onChange={(e) => setEditingFields({...editingFields, phone: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-gray-800 cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, phone: true})}>
                          {selectedOrganization.phone || 'Click to add phone'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      {isEditing.address ? (
                        <Input
                          value={editingFields.address || selectedOrganization.address || ''}
                          onChange={(e) => setEditingFields({...editingFields, address: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-gray-800 cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, address: true})}>
                          {selectedOrganization.address || 'Click to add address'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      {isEditing.website ? (
                        <Input
                          value={editingFields.website || selectedOrganization.website || ''}
                          onChange={(e) => setEditingFields({...editingFields, website: e.target.value})}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                        />
                      ) : (
                        <p className="text-gray-800 cursor-pointer hover:underline" 
                           onClick={() => setIsEditing({...isEditing, website: true})}>
                          {selectedOrganization.website || 'Click to add website'}
                        </p>
                      )}
                    </div>
                  </div>
                  {Object.keys(isEditing).length > 0 && (
                    <div className="col-span-2 flex gap-2 pt-4 border-t">
                      <Button
                        style={{ backgroundColor: selectedOrganization?.primaryColor || '#278DD4' }}
                        className="text-white hover:opacity-90"
                        onClick={async () => {
                          try {
                            const response = await apiRequest("PATCH", `/api/organizations/${selectedOrganization.id}`, editingFields);
                            if (response.ok) {
                              toast({
                                title: "Organization Updated",
                                description: "Organization details saved successfully.",
                              });
                              setSelectedOrganization({...selectedOrganization, ...editingFields});
                              setIsEditing({});
                              setEditingFields({});
                              queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
                            }
                          } catch (error) {
                            toast({
                              title: "Update Failed",
                              description: "Failed to update organization details.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing({});
                          setEditingFields({});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee Management */}
              <Card style={{ borderColor: selectedOrganization?.accentColor + '30' || '#24D36730' }}>
                <CardHeader style={{ backgroundColor: selectedOrganization?.accentColor + '10' || '#24D36710' }}>
                  <CardTitle style={{ color: selectedOrganization?.primaryColor || '#20366B' }} className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Fee Management & Discounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Custom Monthly Fee (R)</Label>
                        <Input
                          type="number"
                          defaultValue={selectedOrganization?.membershipPrice || '299'}
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                          className="focus:ring-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Discount Percentage (%)</Label>
                        <Input
                          type="number"
                          defaultValue="0"
                          max="100"
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                          className="focus:ring-2"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Commission Rate (%)</Label>
                        <Input
                          type="number"
                          defaultValue="5"
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                          className="focus:ring-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Special Notes</Label>
                        <Input
                          placeholder="Special pricing arrangements..."
                          style={{ borderColor: selectedOrganization?.primaryColor + '50' || '#278DD450' }}
                          className="focus:ring-2"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    style={{ backgroundColor: selectedOrganization?.accentColor || '#24D367' }}
                    className="text-white hover:opacity-90"
                    onClick={async () => {
                      try {
                        const feeData = {
                          membershipPrice: document.querySelector('input[type="number"]')?.value || selectedOrganization?.membershipPrice,
                          discountPercentage: document.querySelectorAll('input[type="number"]')[1]?.value || 0,
                          commissionRate: document.querySelectorAll('input[type="number"]')[2]?.value || 5,
                          specialNotes: document.querySelector('input[placeholder*="Special"]')?.value || ''
                        };
                        
                        const response = await apiRequest("PATCH", `/api/organizations/${selectedOrganization.id}/fees`, feeData);
                        if (response.ok) {
                          toast({
                            title: "Fee Changes Applied",
                            description: "Custom pricing and discounts have been updated successfully.",
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
                        }
                      } catch (error) {
                        toast({
                          title: "Fee Update Failed",
                          description: "Failed to apply fee changes. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Apply Fee Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Information */}
              <Card style={{ borderColor: selectedOrganization?.secondaryColor + '30' || '#278DD430' }}>
                <CardHeader style={{ backgroundColor: selectedOrganization?.secondaryColor + '10' || '#278DD410' }}>
                  <CardTitle style={{ color: selectedOrganization?.primaryColor || '#20366B' }} className="flex items-center gap-2">
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

              {/* Debit Order Management */}
              <Card style={{ borderColor: selectedOrganization?.primaryColor + '30' || '#278DD430' }}>
                <CardHeader style={{ backgroundColor: selectedOrganization?.primaryColor + '10' || '#278DD410' }}>
                  <CardTitle style={{ color: selectedOrganization?.primaryColor || '#20366B' }} className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Debit Order Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Active Mandates</Label>
                        <p className="text-2xl font-bold" style={{ color: selectedOrganization?.primaryColor || '#20366B' }}>
                          {selectedOrganization?.debitOrderStats?.activeMandates || 0}
                        </p>
                        <p className="text-sm text-gray-500">Currently active for {selectedOrganization?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Monthly Collection</Label>
                        <p className="text-2xl font-bold" style={{ color: selectedOrganization?.accentColor || '#24D367' }}>
                          R{selectedOrganization?.debitOrderStats?.monthlyCollection || '0'}
                        </p>
                        <p className="text-sm text-gray-500">Next collection: 25th</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Success Rate</Label>
                        <p className="text-lg font-semibold" style={{ color: selectedOrganization?.secondaryColor || '#278DD4' }}>
                          {selectedOrganization?.debitOrderStats?.successRate || '0%'}
                        </p>
                        <p className="text-sm text-gray-500">Last 3 months</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{ 
                          borderColor: selectedOrganization?.primaryColor || '#278DD4',
                          color: selectedOrganization?.primaryColor || '#278DD4'
                        }}
                        onClick={() => {
                          toast({
                            title: "Mandate Management",
                            description: `Opening mandate management for ${selectedOrganization?.name}`,
                          });
                        }}
                      >
                        View {selectedOrganization?.name} Mandates
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{ 
                          borderColor: selectedOrganization?.secondaryColor || '#278DD4',
                          color: selectedOrganization?.secondaryColor || '#278DD4'
                        }}
                        onClick={() => {
                          toast({
                            title: "Collection Processing",
                            description: `Processing collections for ${selectedOrganization?.name}`,
                          });
                        }}
                      >
                        Process {selectedOrganization?.name} Collection
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{ 
                          borderColor: selectedOrganization?.accentColor || '#24D367',
                          color: selectedOrganization?.accentColor || '#24D367'
                        }}
                        onClick={() => {
                          toast({
                            title: "Report Generation",
                            description: `Generating reports for ${selectedOrganization?.name}`,
                          });
                        }}
                      >
                        Download {selectedOrganization?.name} Reports
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding Information */}
              <Card style={{ borderColor: selectedOrganization?.accentColor + '30' || '#24D36730' }}>
                <CardHeader style={{ backgroundColor: selectedOrganization?.accentColor + '10' || '#24D36710' }}>
                  <CardTitle style={{ color: selectedOrganization?.primaryColor || '#20366B' }} className="flex items-center gap-2">
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
                      {isEditing.primaryColor ? (
                        <Input
                          type="color"
                          value={editingFields.primaryColor || selectedOrganization.primaryColor || '#278DD4'}
                          onChange={(e) => setEditingFields({...editingFields, primaryColor: e.target.value})}
                          className="w-16 h-8 p-0 border-0"
                        />
                      ) : (
                        <p className="text-gray-800 font-mono text-sm cursor-pointer hover:underline"
                           onClick={() => setIsEditing({...isEditing, primaryColor: true})}>
                          {selectedOrganization.primaryColor || '#278DD4'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: selectedOrganization.secondaryColor || '#24D367' }}
                      ></div>
                      {isEditing.secondaryColor ? (
                        <Input
                          type="color"
                          value={editingFields.secondaryColor || selectedOrganization.secondaryColor || '#24D367'}
                          onChange={(e) => setEditingFields({...editingFields, secondaryColor: e.target.value})}
                          className="w-16 h-8 p-0 border-0"
                        />
                      ) : (
                        <p className="text-gray-800 font-mono text-sm cursor-pointer hover:underline"
                           onClick={() => setIsEditing({...isEditing, secondaryColor: true})}>
                          {selectedOrganization.secondaryColor || '#24D367'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Accent Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: selectedOrganization.accentColor || '#F97316' }}
                      ></div>
                      {isEditing.accentColor ? (
                        <Input
                          type="color"
                          value={editingFields.accentColor || selectedOrganization.accentColor || '#F97316'}
                          onChange={(e) => setEditingFields({...editingFields, accentColor: e.target.value})}
                          className="w-16 h-8 p-0 border-0"
                        />
                      ) : (
                        <p className="text-gray-800 font-mono text-sm cursor-pointer hover:underline"
                           onClick={() => setIsEditing({...isEditing, accentColor: true})}>
                          {selectedOrganization.accentColor || '#F97316'}
                        </p>
                      )}
                    </div>
                  </div>
                  {(isEditing.primaryColor || isEditing.secondaryColor || isEditing.accentColor) && (
                    <div className="col-span-3 flex gap-2 pt-4 border-t">
                      <Button
                        style={{ backgroundColor: selectedOrganization?.primaryColor || '#278DD4' }}
                        className="text-white hover:opacity-90"
                        onClick={async () => {
                          try {
                            const colorData = {
                              primaryColor: editingFields.primaryColor || selectedOrganization.primaryColor,
                              secondaryColor: editingFields.secondaryColor || selectedOrganization.secondaryColor,
                              accentColor: editingFields.accentColor || selectedOrganization.accentColor
                            };
                            
                            const response = await apiRequest("PATCH", `/api/organizations/${selectedOrganization.id}`, colorData);
                            if (response.ok) {
                              toast({
                                title: "Branding Updated",
                                description: "Organization colors have been updated successfully.",
                              });
                              setSelectedOrganization({...selectedOrganization, ...colorData});
                              setIsEditing({});
                              setEditingFields({});
                              queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
                            }
                          } catch (error) {
                            toast({
                              title: "Update Failed",
                              description: "Failed to update organization branding.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Colors
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing({});
                          setEditingFields({});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
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
                  style={{ 
                    borderColor: selectedOrganization.isActive ? '#f97316' : selectedOrganization?.accentColor || '#24D367',
                    color: selectedOrganization.isActive ? '#f97316' : selectedOrganization?.accentColor || '#24D367'
                  }}
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
                  style={{ backgroundColor: '#dc2626' }}
                  className="text-white hover:opacity-90"
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
    mutationFn: async (adminData: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/global-admins", adminData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add global admin");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Global admin added successfully",
      });
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminName("");
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Global admin removed successfully",
      });
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    addAdminMutation.mutate({
      email: newAdminEmail.trim(),
      name: newAdminName.trim()
    });
  };

  const handleRemoveAdmin = (adminId: number, adminName: string) => {
    if (confirm(`Are you sure you want to remove ${adminName} as a global admin?`)) {
      removeAdminMutation.mutate(adminId);
    }
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
          <h3 className="text-lg font-semibold">Current Global Admins</h3>
          <p className="text-sm text-gray-600">Users with full administrative access to the platform</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#278DD4' }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Global Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {!globalAdmins || globalAdmins.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No global admins found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {globalAdmins.map((admin: any) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
                      {admin.name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{admin.name || admin.username}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500">
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
                      onClick={() => handleRemoveAdmin(admin.id, admin.name || admin.email)}
                      disabled={removeAdminMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
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
              style={{ backgroundColor: '#278DD4' }}
              className="text-white hover:opacity-90"
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Settings Tab Component - shows global platform settings
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
      toast({
        title: "Success",
        description: "PayFast settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSavePayfast = () => {
    if (!payfastSettings.merchantId.trim() || !payfastSettings.merchantKey.trim()) {
      toast({
        title: "Error",
        description: "Please fill in Merchant ID and Merchant Key",
        variant: "destructive",
      });
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
      {/* PayFast Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PayFast Configuration
          </CardTitle>
          <CardDescription>
            Global PayFast settings used as fallback when organizations don't have their own settings
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
              style={{ backgroundColor: '#278DD4' }}
              className="text-white hover:opacity-90"
            >
              {savePayfastMutation.isPending ? "Saving..." : "Save PayFast Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>
            Current platform configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Platform Version</p>
              <p className="text-gray-600">IH Academy v2.0</p>
            </div>
            <div>
              <p className="font-semibold">Database</p>
              <p className="text-gray-600">PostgreSQL (Neon)</p>
            </div>
            <div>
              <p className="font-semibold">Email Service</p>
              <p className="text-gray-600">SendGrid</p>
            </div>
            <div>
              <p className="font-semibold">Payment Gateway</p>
              <p className="text-gray-600">PayFast + Debit Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Global Admins Tab Component  
function GlobalAdminsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-gray-500">Global Admins management will be implemented here</p>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-gray-500">Global Settings will be implemented here</p>
      </div>
    </div>
  );
}
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
      toast({
        title: "Success",
        description: "Global admin added successfully",
      });
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminName("");
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Global admin removed successfully",
      });
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    addAdminMutation.mutate({
      email: newAdminEmail.trim(),
      name: newAdminName.trim()
    });
  };

  const handleRemoveAdmin = (adminId: number, adminName: string) => {
    if (confirm(`Are you sure you want to remove ${adminName} as a global admin?`)) {
      removeAdminMutation.mutate(adminId);
    }
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
          <p className="text-gray-600">Manage users with global admin access to the platform</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#278DD4' }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Global Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Global Admins
          </CardTitle>
          <CardDescription>
            Users with full administrative access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!globalAdmins || globalAdmins.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No global admins found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {globalAdmins.map((admin: any) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
                      {admin.name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{admin.name || admin.username}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500">
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
                      onClick={() => handleRemoveAdmin(admin.id, admin.name || admin.email)}
                      disabled={removeAdminMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
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
              style={{ backgroundColor: '#278DD4' }}
              className="text-white hover:opacity-90"
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  const [payfastSettings, setPayfastSettings] = useState({
    merchantId: "",
    merchantKey: "", 
    passphrase: "",
    sandbox: true
  });

  const { toast } = useToast();

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
      toast({
        title: "Success",
        description: "PayFast settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSavePayfast = () => {
    if (!payfastSettings.merchantId.trim() || !payfastSettings.merchantKey.trim()) {
      toast({
        title: "Error",
        description: "Please fill in Merchant ID and Merchant Key",
        variant: "destructive",
      });
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
        <p className="text-gray-600">Configure platform-wide settings and integrations</p>
      </div>

      {/* PayFast Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PayFast Configuration
          </CardTitle>
          <CardDescription>
            Global PayFast settings used as fallback when organizations don't have their own settings
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
              style={{ backgroundColor: '#278DD4' }}
              className="text-white hover:opacity-90"
            >
              {savePayfastMutation.isPending ? "Saving..." : "Save PayFast Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional global settings can be added here */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>
            Current platform configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Platform Version</p>
              <p className="text-gray-600">IH Academy v2.0</p>
            </div>
            <div>
              <p className="font-semibold">Database</p>
              <p className="text-gray-600">PostgreSQL (Neon)</p>
            </div>
            <div>
              <p className="font-semibold">Email Service</p>
              <p className="text-gray-600">SendGrid</p>
            </div>
            <div>
              <p className="font-semibold">Payment Gateway</p>
              <p className="text-gray-600">PayFast + Debit Orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}