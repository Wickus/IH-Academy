import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, type User, type Organization } from "@/lib/api";
import { UserPlus, LogIn, Building2, Users, Dumbbell } from "lucide-react";
import { useLocation } from "wouter";

interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'global_admin' | 'organization_admin' | 'coach' | 'member';
}

interface OrganizationFormData {
  name: string;
  description: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  planType: 'free' | 'basic' | 'premium';
}

interface AuthProps {
  onAuthSuccess?: (user: User) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormData>({ username: "", password: "" });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: "", email: "", password: "", firstName: "", lastName: "", phone: "", role: "member"
  });
  const [orgData, setOrgData] = useState<OrganizationFormData>({
    name: "", description: "", email: "", phone: "", address: "", website: "",
    primaryColor: "#20366B", secondaryColor: "#278DD4", accentColor: "#24D367", planType: "free"
  });
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrganisations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!currentUser && currentUser.role === 'organization_admin',
  });

  // Check if current user is an organisation admin without an organisation
  useEffect(() => {
    if (currentUser?.role === 'organization_admin' && userOrganisations !== undefined) {
      if (userOrganisations.length === 0) {
        setShowOrgSetup(true);
      }
    }
  }, [currentUser, userOrganisations]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormData) => api.login(credentials),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.firstName} ${user.lastName}` });
      if (onAuthSuccess) {
        onAuthSuccess(user);
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterFormData) => api.register(userData),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      toast({ title: "Registration successful!", description: `Welcome ${user.firstName}!` });
      
      if (user.role === 'organization_admin') {
        // Don't redirect - stay on auth page to show modal
        setShowOrgSetup(true);
      } else {
        if (onAuthSuccess) {
          onAuthSuccess(user);
        } else {
          setLocation("/");
        }
      }
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error.message || "Failed to create account", variant: "destructive" });
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: (orgData: OrganizationFormData) => api.createOrganization({
      ...orgData,
      maxClasses: 50,
      maxMembers: 500
    }),
    onSuccess: (organization: Organization) => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/my'] });
      setShowOrgSetup(false); // Close the modal first
      toast({ title: "Organisation created!", description: `${organization.name} is ready for setup!` });
      
      // Trigger auth success to properly set authentication state
      if (onAuthSuccess) {
        const currentUser = queryClient.getQueryData(['/api/auth/me']);
        if (currentUser) {
          onAuthSuccess(currentUser as User);
        }
      }
      
      // Use setTimeout to ensure modal closes and auth state is set before redirect
      setTimeout(() => {
        setLocation(`/organization-setup?orgId=${organization.id}`);
      }, 200);
    },
    onError: (error: any) => {
      console.error("Organisation creation error:", error);
      toast({ title: "Failed to create organisation", description: error.message || "Please try again", variant: "destructive" });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleOrgSetup = (e: React.FormEvent) => {
    e.preventDefault();
    createOrgMutation.mutate(orgData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #20366B 0%, #278DD4 50%, #F8FAFC 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: '900',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>ItsHappening.Africa</h1>
          <p className="text-white font-medium" style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>Sports booking platform for everyone</p>
        </div>

        <Card className="bg-white border-0 shadow-2xl" style={{
          backdropFilter: 'blur(20px)',
          borderRadius: '12px'
        }}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="login" className="gap-1 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
                <UserPlus className="h-4 w-4" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                  <CardDescription className="text-gray-600">
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
                  <CardDescription className="text-gray-600">
                    Join ItsHappening.Africa as a member or organization admin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                        <Input
                          id="firstName"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                        <Input
                          id="lastName"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                          required
                          className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                      <Input
                        id="username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 font-medium">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-700 font-medium">Account Type</Label>
                      <Select value={registerData.role} onValueChange={(value) => setRegisterData({...registerData, role: value as any})}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          <SelectItem value="member" className="text-gray-900 focus:bg-blue-50 focus:text-blue-900">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Member - Follow organizations and book classes
                            </div>
                          </SelectItem>
                          <SelectItem value="organization_admin" className="text-gray-900 focus:bg-blue-50 focus:text-blue-900">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-4 w-4" />
                              Organization Admin - Manage your sports business
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Organisation Setup Modal */}
      <Dialog open={showOrgSetup} onOpenChange={setShowOrgSetup}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#20366B] font-bold">Set Up Your Organisation</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleOrgSetup} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName" className="text-[#20366B] font-medium">Organisation Name *</Label>
                <Input
                  id="orgName"
                  value={orgData.name}
                  onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                  placeholder="Enter your organisation name"
                  required
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="orgDescription" className="text-[#20366B] font-medium">Description *</Label>
                <Input
                  id="orgDescription"
                  value={orgData.description}
                  onChange={(e) => setOrgData({...orgData, description: e.target.value})}
                  placeholder="Brief description of your organisation"
                  required
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="orgEmail" className="text-[#20366B] font-medium">Contact Email *</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  value={orgData.email}
                  onChange={(e) => setOrgData({...orgData, email: e.target.value})}
                  placeholder="contact@yourorganisation.com"
                  required
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
              
              <div>
                <Label className="text-[#20366B] font-medium">Select Your Plan</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  {[
                    { value: 'free', name: 'Free', price: 'R0/month', features: ['Up to 10 classes', 'Up to 100 members', 'Basic analytics'] },
                    { value: 'basic', name: 'Basic', price: 'R299/month', features: ['Up to 50 classes', 'Up to 500 members', 'Advanced analytics', 'Email support'] },
                    { value: 'premium', name: 'Premium', price: 'R599/month', features: ['Unlimited classes', 'Unlimited members', 'Full analytics suite', 'Priority support'] }
                  ].map((plan) => (
                    <div
                      key={plan.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        orgData.planType === plan.value 
                          ? 'border-[#278DD4] bg-[#278DD4]/10' 
                          : 'border-slate-300 hover:border-[#278DD4]/50'
                      }`}
                      onClick={() => setOrgData({...orgData, planType: plan.value as any})}
                    >
                      <div className="text-center">
                        <h3 className="font-semibold text-[#20366B]">{plan.name}</h3>
                        <p className="text-2xl font-bold text-[#278DD4] mt-2">{plan.price}</p>
                        <ul className="text-sm text-slate-600 mt-3 space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowOrgSetup(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Skip for Now
              </Button>
              <Button 
                type="submit"
                disabled={createOrgMutation.isPending}
                className="bg-[#24D367] hover:bg-[#24D367]/90 text-white"
              >
                {createOrgMutation.isPending ? "Creating..." : "Create Organisation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}