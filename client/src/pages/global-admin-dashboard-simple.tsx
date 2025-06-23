import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, CreditCard, TrendingUp, Settings, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GlobalAdminDashboard() {
  console.log('GlobalAdminDashboard component rendering');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
                  {statsLoading ? "..." : globalStats?.totalOrganizations || organizations.length}
                </div>
                <p className="text-xs text-slate-600">Active sports organizations</p>
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
                <div className="text-2xl font-bold text-[#20366B]">R0</div>
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
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Organizations Found</h3>
                <p className="text-slate-500">Organizations will appear here once they register.</p>
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
    </div>
  );
}