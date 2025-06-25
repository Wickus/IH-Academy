import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Settings, 
  TrendingUp,
  User,
  Plus,
  Trash
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

export default function GlobalAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Fetch organizations data
  const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      if (!response.ok) throw new Error("Failed to fetch organizations");
      return response.json();
    }
  });

  // Fetch global stats
  const { data: globalStats = {}, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/global-stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/global-stats");
      if (!response.ok) throw new Error("Failed to fetch global stats");
      return response.json();
    }
  });

  // Calculate overview stats
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((org: any) => org.status === 'active').length;
  const trialOrgs = organizations.filter((org: any) => org.trialStatus === 'active').length;
  const totalUsers = globalStats.totalUsers || 0;

  if (loadingOrgs || loadingStats) {
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="global-admins">Global Admins</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            totalOrgs={totalOrgs}
            activeOrgs={activeOrgs}
            trialOrgs={trialOrgs}
            totalUsers={totalUsers}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganizationsTab organizations={organizations} />
        </TabsContent>

        <TabsContent value="global-admins" className="space-y-6">
          <GlobalAdminsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ totalOrgs, activeOrgs, trialOrgs, totalUsers, onTabChange }: {
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  totalUsers: number;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange("organizations")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#20366B' }}>{totalOrgs}</div>
            <p className="text-xs text-muted-foreground">
              {activeOrgs} active, {trialOrgs} in trial
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange("organizations")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#278DD4' }}>{activeOrgs}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeOrgs / totalOrgs) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange("organizations")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#24D367' }}>{trialOrgs}</div>
            <p className="text-xs text-muted-foreground">
              Evaluating the platform
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTabChange("global-admins")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#20366B' }}>{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onTabChange("organizations")}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Organizations</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onTabChange("global-admins")}
            >
              <Users className="h-6 w-6" />
              <span>Manage Admins</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
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
function OrganizationsTab({ organizations }: { organizations: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#20366B' }}>Organizations</h2>
          <p className="text-gray-600">Manage all organizations on the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Organizations
          </CardTitle>
          <CardDescription>
            {organizations.length} organizations registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org: any) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {org.logoUrl ? (
                      <img 
                        src={org.logoUrl} 
                        alt={org.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{org.name}</p>
                      <p className="text-sm text-gray-600">{org.contactEmail}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={org.status === 'active' ? 'default' : 'secondary'}
                      style={{ 
                        backgroundColor: org.status === 'active' ? '#24D367' : '#6B7280',
                        color: 'white' 
                      }}
                    >
                      {org.status}
                    </Badge>
                    {org.trialStatus === 'active' && (
                      <Badge variant="outline" style={{ borderColor: '#278DD4', color: '#278DD4' }}>
                        Trial
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
        <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Global Settings will be implemented here</p>
      </div>
    </div>
  );
}