import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Calendar, CheckCircle, ArrowRight, Heart, Star } from "lucide-react";
import { api } from "@/lib/api";

export default function OrganizationInvite() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  
  // Extract invite code from URL if not available from params
  const extractedInviteCode = inviteCode || location.split('/invite/')[1];
  
  console.log('Current location:', location);
  console.log('InviteCode from params:', inviteCode);
  console.log('Extracted invite code:', extractedInviteCode);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization info by invite code
  const { data: orgData, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ['/api/organizations/invite', extractedInviteCode],
    queryFn: async () => {
      console.log('Fetching organization with invite code:', extractedInviteCode);
      const response = await fetch(`/api/organizations/invite/${extractedInviteCode}`);
      if (!response.ok) {
        console.error('Failed to fetch organization:', response.status, response.statusText);
        throw new Error('Organization not found');
      }
      const data = await response.json();
      console.log('Organization data received:', data);
      return data;
    },
    enabled: !!extractedInviteCode
  });

  // Check if user is already authenticated
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: "Logged in successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: "Account created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Join organization mutation
  const joinMutation = useMutation({
    mutationFn: () => api.joinOrganizationByInviteCode(extractedInviteCode!),
    onSuccess: (data) => {
      toast({
        title: "Welcome!",
        description: `You've successfully joined ${data.organization.name}!`
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join organization",
        variant: "destructive"
      });
    }
  });

  const organization = orgData?.organization;

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading organization invite...</p>
          <p className="text-sm text-gray-600 mt-2">Code: {extractedInviteCode}</p>
        </div>
      </div>
    );
  }

  if (orgError || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
            <p className="text-gray-600 mb-6">
              This invite link is not valid or has expired.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleJoinOrganization = () => {
    joinMutation.mutate();
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${organization.primaryColor}15 0%, ${organization.secondaryColor}10 50%, ${organization.accentColor}05 100%)`
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Organization Header */}
          <Card className="mb-8 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                  style={{ backgroundColor: organization.primaryColor }}
                >
                  {organization.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 
                    className="text-4xl font-bold mb-2"
                    style={{ color: organization.primaryColor }}
                  >
                    {organization.name}
                  </h1>
                  <p className="text-xl text-gray-600 mb-4">
                    You're invited to join our sports community!
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline"
                      className="text-lg px-4 py-2"
                      style={{ 
                        borderColor: organization.secondaryColor, 
                        color: organization.secondaryColor,
                        backgroundColor: `${organization.secondaryColor}10`
                      }}
                    >
                      {organization.planType} Plan
                    </Badge>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      Up to {organization.maxClasses} classes
                    </div>
                  </div>
                </div>
              </div>
              
              {organization.description && (
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${organization.secondaryColor}08` }}>
                  <p className="text-gray-700 leading-relaxed">
                    {organization.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Benefits Section */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 
                  className="text-2xl font-bold mb-6"
                  style={{ color: organization.primaryColor }}
                >
                  What You'll Get
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      className="w-6 h-6" 
                      style={{ color: organization.accentColor }} 
                    />
                    <span className="text-gray-700">Access to all available classes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      className="w-6 h-6" 
                      style={{ color: organization.accentColor }} 
                    />
                    <span className="text-gray-700">Book sessions instantly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      className="w-6 h-6" 
                      style={{ color: organization.accentColor }} 
                    />
                    <span className="text-gray-700">Track your progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      className="w-6 h-6" 
                      style={{ color: organization.accentColor }} 
                    />
                    <span className="text-gray-700">Connect with coaches</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      className="w-6 h-6" 
                      style={{ color: organization.accentColor }} 
                    />
                    <span className="text-gray-700">Secure payment processing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Section */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                {user ? (
                  // User is logged in - show join button
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                         style={{ backgroundColor: `${organization.primaryColor}15` }}>
                      <Users className="w-8 h-8" style={{ color: organization.primaryColor }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: organization.primaryColor }}>
                      Ready to Join?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Welcome back, {user.firstName || user.username}! Click below to join {organization.name}.
                    </p>
                    <Button
                      onClick={handleJoinOrganization}
                      disabled={joinMutation.isPending}
                      className="w-full text-white text-lg py-3"
                      style={{ backgroundColor: organization.primaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = organization.accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = organization.primaryColor;
                      }}
                    >
                      {joinMutation.isPending ? "Joining..." : "Join Organization"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                ) : (
                  // User not logged in - show login/register forms
                  <div>
                    <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: organization.primaryColor }}>
                      {isRegistering ? "Create Account" : "Sign In"}
                    </h3>
                    
                    {!isRegistering ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={loginData.username}
                            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                            placeholder="Enter your username"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={loginMutation.isPending}
                          className="w-full text-white"
                          style={{ backgroundColor: organization.primaryColor }}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={registerData.firstName}
                              onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                              placeholder="First name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={registerData.lastName}
                              onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                              placeholder="Last name"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                            placeholder="Choose a username"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                            placeholder="Create a password"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={registerMutation.isPending}
                          className="w-full text-white"
                          style={{ backgroundColor: organization.primaryColor }}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create Account & Join"}
                        </Button>
                      </form>
                    )}

                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm hover:underline"
                        style={{ color: organization.secondaryColor }}
                      >
                        {isRegistering 
                          ? "Already have an account? Sign in" 
                          : "Don't have an account? Create one"
                        }
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Powered by ItsHappening.Africa • Secure • Trusted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}