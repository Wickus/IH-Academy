import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function Auth() {
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

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormData) => api.login(credentials),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.firstName} ${user.lastName}` });
      setLocation("/");
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
        setShowOrgSetup(true);
      } else {
        setLocation("/");
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
      toast({ title: "Organisation created!", description: `${organization.name} is ready to go!` });
      // Redirect to organisation dashboard
      setLocation(`/organization-dashboard?orgId=${organization.id}`);
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

  const handleCreateOrganization = (e: React.FormEvent) => {
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
    </div>
  );
}