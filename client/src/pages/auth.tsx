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
  businessModel: 'membership' | 'pay_per_class';
  planType: 'free' | 'basic' | 'premium';
}

interface AuthProps {
  onAuthSuccess?: (user: User) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [registrationType, setRegistrationType] = useState<"user" | "organization" | null>(null);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormData>({ username: "", password: "" });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: "", email: "", password: "", firstName: "", lastName: "", phone: "", role: "member"
  });
  const [orgData, setOrgData] = useState<OrganizationFormData>({
    name: "", description: "", email: "", phone: "", address: "", website: "",
    primaryColor: "#20366B", secondaryColor: "#278DD4", accentColor: "#24D367", 
    businessModel: "pay_per_class", planType: "free"
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
    mutationFn: async (credentials: LoginFormData) => {
      const user = await api.login(credentials);
      
      // Preload organization data for smoother styling transition
      if (user.role === 'organization_admin' || user.role === 'coach' || user.role === 'member') {
        try {
          const organizations = await api.getUserOrganizations();
          queryClient.setQueryData(['/api/organizations/my'], organizations);
        } catch (error) {
          // Silently handle organization loading error - user can still proceed
          console.warn('Failed to preload organization data:', error);
        }
      }
      
      return user;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user as any).name}` });
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
    mutationFn: async (userData: RegisterFormData) => {
      // First register the user
      const user = await api.register(userData);
      
      // If registering as organization admin, also create the organization
      if (registrationType === "organization") {
        const orgPayload = {
          ...orgData,
          email: userData.email, // Use user's email for organization contact
          maxClasses: orgData.planType === 'free' ? 10 : orgData.planType === 'basic' ? 50 : 200,
          maxMembers: orgData.planType === 'free' ? 100 : orgData.planType === 'basic' ? 500 : 2000,
        };
        const organization = await api.createOrganization(orgPayload);
        return { user, organization };
      }
      
      return { user };
    },
    onSuccess: (result: any) => {
      const { user, organization } = result;
      queryClient.setQueryData(['/api/auth/me'], user);
      
      if (organization) {
        queryClient.setQueryData(['/api/organizations/my'], [organization]);
        toast({ 
          title: "Organisation created!", 
          description: `Welcome ${user.firstName}! ${organization.name} is ready to go.` 
        });
      } else {
        toast({ 
          title: "Account created!", 
          description: `Welcome ${user.firstName} ${user.lastName}` 
        });
      }
      
      if (onAuthSuccess) {
        onAuthSuccess(user);
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error.message || "Failed to create account", variant: "destructive" });
    }
  });

  const orgMutation = useMutation({
    mutationFn: (orgData: OrganizationFormData) => api.createOrganization({
      ...orgData,
      maxClasses: orgData.planType === 'free' ? 10 : orgData.planType === 'basic' ? 50 : 200,
      maxMembers: orgData.planType === 'free' ? 100 : orgData.planType === 'basic' ? 500 : 2000,
    }),
    onSuccess: (org: Organization) => {
      queryClient.setQueryData(['/api/organizations/my'], [org]);
      toast({ title: "Organization created!", description: `${org.name} is ready to go` });
      setShowOrgSetup(false);
      setLocation("/");
    },
    onError: (error: any) => {
      toast({ title: "Organization setup failed", description: error.message || "Failed to create organization", variant: "destructive" });
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    orgMutation.mutate(orgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "login" | "register");
            setRegistrationType(null);
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-md">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-[#20366B] text-white font-medium">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-[#20366B] text-white font-medium">
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                  <CardDescription className="text-white/80">
                    Sign in to your ItsHappening.Africa account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white font-medium">Username</Label>
                      <Input
                        id="username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                        required
                        className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-white text-[#20366B] hover:bg-white/90 font-medium py-2 px-4 rounded-lg transition-colors"
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
                  <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                  <CardDescription className="text-white/80">
                    {!registrationType ? "Choose your account type to get started" : 
                     registrationType === "user" ? "Join ItsHappening.Africa as a member" : 
                     "Register your sports organization"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!registrationType ? (
                    <div className="space-y-4">
                      <Button
                        type="button"
                        onClick={() => {
                          setRegistrationType("user");
                          setRegisterData({...registerData, role: "member"});
                        }}
                        className="w-full h-16 bg-gradient-to-r from-[#278DD4] to-[#24D3BF] hover:from-[#1f7bc4] hover:to-[#1fb5a3] text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Users className="h-6 w-6" />
                          <div className="text-left">
                            <div className="font-bold text-lg">Register as User</div>
                            <div className="text-sm opacity-90">Join organizations and book classes</div>
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={() => {
                          setRegistrationType("organization");
                          setRegisterData({...registerData, role: "organization_admin"});
                        }}
                        className="w-full h-16 bg-gradient-to-r from-[#20366B] to-[#278DD4] hover:from-[#1a2d5a] hover:to-[#1f7bc4] text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Building2 className="h-6 w-6" />
                          <div className="text-left">
                            <div className="font-bold text-lg">Register as Organization</div>
                            <div className="text-sm opacity-90">Manage your sports academy or club</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ) : registrationType === "user" ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">User Registration</h3>
                        <Button
                          type="button"
                          onClick={() => setRegistrationType(null)}
                          variant="ghost"
                          size="sm"
                          className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                          Back
                        </Button>
                      </div>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-white font-medium">First Name</Label>
                            <Input
                              id="firstName"
                              value={registerData.firstName}
                              onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                              required
                              className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-white font-medium">Last Name</Label>
                            <Input
                              id="lastName"
                              value={registerData.lastName}
                              onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                              required
                              className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-medium">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white font-medium">Username</Label>
                          <Input
                            id="username"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white font-medium">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white font-medium">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[#278DD4] hover:bg-[#1f7bc4] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create User Account"}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Organisation Registration</h3>
                        <Button
                          type="button"
                          onClick={() => setRegistrationType(null)}
                          variant="ghost"
                          size="sm"
                          className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                          Back
                        </Button>
                      </div>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgName" className="text-white font-medium">Organisation Name</Label>
                          <Input
                            id="orgName"
                            value={orgData.name}
                            onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                            placeholder="Enter your organisation name"
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-white font-medium">First Name</Label>
                            <Input
                              id="firstName"
                              value={registerData.firstName}
                              onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                              required
                              className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-white font-medium">Last Name</Label>
                            <Input
                              id="lastName"
                              value={registerData.lastName}
                              onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                              required
                              className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-medium">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white font-medium">Username</Label>
                          <Input
                            id="username"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white font-medium">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                            required
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white font-medium">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                            className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white"
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[#20366B] hover:bg-[#1a2d5a] text-white hover:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          disabled={registerMutation.isPending}
                          style={{ color: 'white' }}
                        >
                          <span className="text-white">{registerMutation.isPending ? "Creating account..." : "Create Organisation Account"}</span>
                        </Button>
                      </form>
                    </div>
                  )}
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
                <Label htmlFor="orgPhone" className="text-[#20366B] font-medium">Phone Number</Label>
                <Input
                  id="orgPhone"
                  value={orgData.phone}
                  onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
                  placeholder="+27 XX XXX XXXX"
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="orgAddress" className="text-[#20366B] font-medium">Address</Label>
                <Input
                  id="orgAddress"
                  value={orgData.address}
                  onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                  placeholder="123 Main Street, City, Province"
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="orgWebsite" className="text-[#20366B] font-medium">Website</Label>
                <Input
                  id="orgWebsite"
                  value={orgData.website}
                  onChange={(e) => setOrgData({...orgData, website: e.target.value})}
                  placeholder="https://yourorganisation.com"
                  className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] bg-white"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#278DD4] to-[#24D367] hover:from-[#1f7bc4] hover:to-[#1fb557] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg transform hover:scale-105"
              disabled={orgMutation.isPending}
            >
              {orgMutation.isPending ? "Creating Organisation..." : "Create Organisation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}