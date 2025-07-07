import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Building, 
  Bell, 
  Shield, 
  Palette,
  Mail,
  Phone,
  Globe,
  Save,
  User,
  Plus,
  Dumbbell,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Upload,
  Banknote,
  Clock,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import SportForm from "@/components/forms/sport-form";
import PayfastCredentials, { type PayfastCredentialsData } from "@/components/forms/payfast-credentials";
import OrganisationAdminForm from "@/components/forms/organisation-admin-form";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  website: z.string().optional(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  classReminders: z.boolean(),
  paymentReminders: z.boolean(),
  bookingConfirmations: z.boolean(),
});

const colorSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

const membershipSchema = z.object({
  membershipPrice: z.string().min(1, "Membership price is required"),
  planType: z.enum(["free", "basic", "premium"]),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organization");
  const [showSportForm, setShowSportForm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrganizations, isLoading: orgDataLoading } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!currentUser && currentUser.role !== 'global_admin',
  });

  // For global admins, get all organizations to allow them to configure settings
  const { data: allOrganizations, isLoading: allOrgLoading } = useQuery({
    queryKey: ["/api/organizations"],
    queryFn: api.getOrganizations,
    enabled: !!currentUser && currentUser.role === 'global_admin',
  });

  const organizations = currentUser?.role === 'global_admin' ? allOrganizations : userOrganizations;
  
  // Auto-select first organization if none selected and organizations are available
  const effectiveSelectedOrgId = selectedOrgId || organizations?.[0]?.id;
  const organization = organizations?.find(org => org.id === effectiveSelectedOrgId) || organizations?.[0];
  
  const orgLoading = (currentUser?.role === 'global_admin' ? allOrgLoading : orgDataLoading) || !organizations;

  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
    queryFn: api.getSports,
  });

  const organizationForm = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
      address: organization?.address || "",
      phone: organization?.phone || "",
      email: organization?.email || "",
      website: organization?.website || "",
    },
  });

  const notificationForm = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      classReminders: true,
      paymentReminders: true,
      bookingConfirmations: true,
    },
  });

  const colorForm = useForm({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      primaryColor: organization?.primaryColor || '#20366B',
      secondaryColor: organization?.secondaryColor || '#278DD4',
      accentColor: organization?.accentColor || '#24D367',
    },
  });

  const membershipForm = useForm({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      membershipPrice: organization?.membershipPrice || '299.00',
      planType: organization?.planType || 'free',
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: (data: any) => {
      if (!organization?.id) throw new Error("No organization found");
      return api.updateOrganization(organization.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization settings",
        variant: "destructive",
      });
    },
  });

  const updatePayfastCredentialsMutation = useMutation({
    mutationFn: async (data: PayfastCredentialsData) => {
      if (!organization?.id) throw new Error("No organization found");
      
      // First test the connection
      const connectionTest = await api.testPayfastConnection({
        merchantId: data.payfastMerchantId,
        merchantKey: data.payfastMerchantKey,
        passphrase: data.payfastPassphrase,
        sandbox: data.payfastSandbox,
      });
      
      if (!connectionTest.connected) {
        throw new Error(`PayFast connection failed: ${connectionTest.message}`);
      }
      
      // If connection test passes, save the credentials
      return api.updateOrganization(organization.id, {
        payfastMerchantId: data.payfastMerchantId,
        payfastMerchantKey: data.payfastMerchantKey,
        payfastPassphrase: data.payfastPassphrase,
        payfastSandbox: data.payfastSandbox,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-payfast-connection", organization?.id] });
      toast({
        title: "Success",
        description: "PayFast credentials saved and connection verified",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment credentials",
        variant: "destructive",
      });
    },
  });

  const deleteSportMutation = useMutation({
    mutationFn: (sportId: number) => {
      return fetch(`/api/sports/${sportId}`, {
        method: 'DELETE',
        credentials: 'include'
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete sport');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sports"] });
      toast({
        title: "Success",
        description: "Sport deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sport",
        variant: "destructive",
      });
    },
  });

  const onOrganizationSubmit = (data: any) => {
    updateOrganizationMutation.mutate(data);
  };

  const onNotificationSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Notification preferences updated successfully",
    });
  };

  const onColorSubmit = (data: any) => {
    updateOrganizationMutation.mutate(data);
    setShowColorPicker(false);
  };

  const updateMembershipMutation = useMutation({
    mutationFn: (data: any) => {
      if (!organization?.id) throw new Error("No organization found");
      return api.updateOrganization(organization.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: "Membership settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update membership settings",
        variant: "destructive",
      });
    },
  });

  const onMembershipSubmit = (data: any) => {
    updateMembershipMutation.mutate(data);
  };

  // PayFast connection status check
  const { data: connectionStatus, isLoading: isCheckingConnection, refetch: checkConnection } = useQuery({
    queryKey: ["/api/test-payfast-connection", organization?.id],
    queryFn: async () => {
      if (!organization?.payfastMerchantId || !organization?.payfastMerchantKey) {
        return { connected: false, message: "Credentials not configured" };
      }
      
      return api.testPayfastConnection({
        merchantId: organization.payfastMerchantId,
        merchantKey: organization.payfastMerchantKey,
        passphrase: organization.payfastPassphrase,
        sandbox: organization.payfastSandbox ?? true,
      });
    },
    enabled: !!(organization?.payfastMerchantId && organization?.payfastMerchantKey),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const onPayfastCredentialsSubmit = (data: PayfastCredentialsData) => {
    console.log("PayFast credentials submitted:", data);
    console.log("Organization:", organization);
    console.log("Organization ID:", organization?.id);
    
    if (!organization?.id) {
      toast({
        title: "Error",
        description: "No organization found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    updatePayfastCredentialsMutation.mutate(data);
  };

  const handleDeleteSport = (sportId: number) => {
    const sport = sports?.find(s => s.id === sportId);
    if (!sport) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${sport.name}"? This action cannot be undone.`);
    if (confirmed) {
      deleteSportMutation.mutate(sportId);
    }
  };

  const validateLogoFile = (file: File): { isValid: boolean; error?: string } => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    // File size constraints
    const maxSize = 5 * 1024 * 1024; // 5MB
    const minSize = 1024; // 1KB minimum
    
    // Validate file type
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, GIF, WebP, SVG`
      };
    }
    
    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `File size too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed: ${maxSizeMB}MB`
      };
    }
    
    if (file.size < minSize) {
      return {
        isValid: false,
        error: `File size too small: ${file.size} bytes. Minimum required: 1KB`
      };
    }
    
    // Validate file name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      return {
        isValid: false,
        error: 'File name contains invalid characters'
      };
    }
    
    // Check for potential security issues
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    const hasDoubleExtension = suspiciousExtensions.some(ext => 
      file.name.toLowerCase().includes(ext)
    );
    
    if (hasDoubleExtension) {
      return {
        isValid: false,
        error: 'File appears to have suspicious content'
      };
    }
    
    return { isValid: true };
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Comprehensive file validation
    const validation = validateLogoFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      // Clear the input
      event.target.value = '';
      return;
    }

    console.log('File validation passed, reading file...');
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('File read successfully, preview length:', result?.length);
      
      // Additional validation on the actual file content
      if (result.length > 10 * 1024 * 1024) { // 10MB base64 limit
        toast({
          title: "Error",
          description: "Processed file is too large for storage",
          variant: "destructive",
        });
        setLogoFile(null);
        return;
      }
      
      setLogoPreview(result);
      
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "File Loaded Successfully",
        description: `${file.name} (${fileSizeMB}MB) ready for upload. Click 'Update Logo' to save.`,
      });
    };
    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      toast({
        title: "File Processing Error",
        description: "Failed to process the selected file. Please try a different image.",
        variant: "destructive",
      });
      setLogoFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpdate = () => {
    console.log('Update logo clicked, logoFile:', logoFile, 'organization:', organization?.id);
    
    if (!logoFile || !organization?.id) {
      toast({
        title: "Error",
        description: "Please select a logo file first",
        variant: "destructive",
      });
      return;
    }

    // Re-validate file before upload
    const validation = validateLogoFile(logoFile);
    if (!validation.isValid) {
      toast({
        title: "Upload Failed",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const logoData = e.target?.result as string;
      
      // Final size check on processed data
      if (logoData.length > 10 * 1024 * 1024) {
        toast({
          title: "Upload Failed",
          description: "Processed file exceeds storage limits. Please use a smaller image.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Updating organization with logo data');
      updateOrganizationMutation.mutate({ logo: logoData });
      setLogoFile(null);
      setLogoPreview(null);
    };
    reader.onerror = (e) => {
      console.error('Error reading file for update:', e);
      toast({
        title: "Upload Failed",
        description: "Failed to process the logo file. Please try again or use a different image.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(logoFile);
  };

  // Debug user authentication and organization data
  console.log("Current user:", currentUser);
  console.log("User organizations:", userOrganizations);
  console.log("Organization:", organization);
  console.log("Org loading:", orgLoading);

  if (!currentUser) {
    return (
      <div className="p-4 lg:p-8 min-h-screen">
        <div className="text-center">
          <p>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div 
        className="p-4 lg:p-8 min-h-screen"
        style={{
          background: `linear-gradient(to bottom right, #f8fafc, ${organization?.secondaryColor || '#278DD4'}10)`
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: organization?.primaryColor || '#20366B' }}
            >
              Settings
            </h1>
            <p className="text-slate-600">Manage your organization and preferences</p>
          </div>
        </div>
        <div className="animate-pulse">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 lg:p-8 min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, #f8fafc, ${organization?.secondaryColor || '#278DD4'}10)`
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 
            className="text-3xl font-bold"
            style={{ color: organization?.primaryColor || '#20366B' }}
          >
            Settings
          </h1>
          <p className="text-slate-600">Manage your organization and preferences with ItsHappening.Africa</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" key={organization?.id}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 bg-slate-100">
          <TabsTrigger 
            value="organization"
            className={`${activeTab === 'organization' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'organization' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'organization' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <Building className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Organization</span>
            <span className="sm:hidden">Org</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sports"
            className={`${activeTab === 'sports' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'sports' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'sports' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <Dumbbell className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Sports
          </TabsTrigger>
          <TabsTrigger 
            value="membership"
            className={`${activeTab === 'membership' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'membership' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'membership' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <Banknote className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Membership</span>
            <span className="sm:hidden">Member</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className={`${activeTab === 'payments' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'payments' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'payments' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <CreditCard className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Payments</span>
            <span className="sm:hidden">Pay</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className={`${activeTab === 'notifications' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'notifications' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'notifications' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <Bell className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notify</span>
          </TabsTrigger>
          <TabsTrigger 
            value="admins"
            className={`${activeTab === 'admins' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'admins' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'admins' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <User className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger 
            value="appearance"
            className={`${activeTab === 'appearance' ? 'text-white' : ''} text-xs md:text-sm`}
            style={{
              backgroundColor: activeTab === 'appearance' ? organization?.secondaryColor || '#278DD4' : 'transparent',
              borderColor: activeTab === 'appearance' ? organization?.secondaryColor || '#278DD4' : 'transparent'
            }}
          >
            <Palette className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Style</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          {currentUser?.role === 'global_admin' && organizations && organizations.length > 1 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-slate-600" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Select Organization to Configure
                  </label>
                  <Select
                    value={effectiveSelectedOrgId?.toString()}
                    onValueChange={(value) => setSelectedOrgId(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <Form {...organizationForm}>
            <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={organizationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-medium"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Organization Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your organization name" 
                              {...field} 
                              className="border-slate-300"
                              style={{
                                '--focus-border': organization?.secondaryColor || '#278DD4',
                                '--focus-ring': organization?.secondaryColor || '#278DD4'
                              } as React.CSSProperties}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-medium"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="contact@organization.com" 
                                {...field} 
                                className="pl-10 border-slate-300"
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                                  e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-medium"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="+27 12 345 6789" 
                                {...field} 
                                className="pl-10 border-slate-300"
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                                  e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel 
                            className="font-medium"
                            style={{ color: organization?.primaryColor || '#20366B' }}
                          >
                            Website
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="https://your-website.com" 
                                {...field} 
                                className="pl-10 border-slate-300"
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                                  e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={organizationForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel 
                          className="font-medium"
                          style={{ color: organization?.primaryColor || '#20366B' }}
                        >
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main Street, City, Province, Postal Code" 
                            {...field} 
                            className="border-slate-300"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={organizationForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel 
                          className="font-medium"
                          style={{ color: organization?.primaryColor || '#20366B' }}
                        >
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your organization, mission, and what makes you unique..." 
                            {...field} 
                            className="border-slate-300 min-h-[100px]"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateOrganizationMutation.isPending}
                      className="text-white border-0"
                      style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="sports" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: organization?.primaryColor || '#20366B' }}
                    >
                      Sports Management
                    </h3>
                    <p className="text-slate-600">Add and manage the sports available at your organisation</p>
                  </div>
                  <Dialog open={showSportForm} onOpenChange={setShowSportForm}>
                    <DialogTrigger asChild>
                      <Button 
                        className="text-white border-0"
                        style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sport
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle style={{ color: organization?.primaryColor || '#20366B' }}>Add New Sport</DialogTitle>
                      </DialogHeader>
                      <SportForm onSuccess={() => setShowSportForm(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sports?.map((sport) => (
                    <Card key={sport.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{sport.icon}</div>
                            <div>
                              <h4 
                                className="font-semibold"
                                style={{ color: organization?.primaryColor || '#20366B' }}
                              >
                                {sport.name}
                              </h4>
                              <Badge 
                                variant="outline" 
                                style={{ backgroundColor: sport.color + '20', color: sport.color, borderColor: sport.color }}
                              >
                                {sport.color}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteSport(sport.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {(!sports || sports.length === 0) && (
                  <div className="text-center py-8">
                    <Dumbbell className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No Sports Added Yet</h3>
                    <p className="text-slate-500 mb-4">Add your first sport to get started with class management</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: organization?.primaryColor || '#20366B' }}
                    >
                      PayFast Integration
                    </h3>
                    <div className="flex items-center gap-2">
                      {isCheckingConnection ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Checking connection...</span>
                        </div>
                      ) : connectionStatus?.connected ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Connected</span>
                          <Badge variant="outline" className="text-xs">
                            {connectionStatus.environment}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Not Connected</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkConnection()}
                        disabled={isCheckingConnection || !organization?.payfastMerchantId}
                      >
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log("Direct test button clicked");
                          onPayfastCredentialsSubmit({
                            payfastMerchantId: "15720320",
                            payfastMerchantKey: "s3opz0f8hkx4x",
                            payfastPassphrase: "",
                            payfastSandbox: true
                          });
                        }}
                      >
                        Test Save Function
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">Configure your PayFast credentials to enable payments for class bookings</p>
                  {connectionStatus?.message && !connectionStatus.connected && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{connectionStatus.message}</p>
                    </div>
                  )}
                </div>
                
                {(() => {
                  console.log("About to render PayfastCredentials component");
                  console.log("Organization for PayFast:", organization);
                  console.log("onPayfastCredentialsSubmit function:", onPayfastCredentialsSubmit);
                  return (
                    <PayfastCredentials
                      initialData={{
                        payfastMerchantId: organization?.payfastMerchantId || "",
                        payfastMerchantKey: organization?.payfastMerchantKey || "",
                        payfastPassphrase: organization?.payfastPassphrase || "",
                        payfastSandbox: organization?.payfastSandbox ?? true,
                      }}
                      onSubmit={onPayfastCredentialsSubmit}
                      isLoading={updatePayfastCredentialsMutation.isPending}
                      showTitle={false}
                      showButtons={true}
                      showSandboxToggle={true}
                    />
                  );
                })()}
                
                <Separator />
                
                {/* Debit Order Management Section */}
                <div className="space-y-4">
                  <div>
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: organization?.primaryColor || '#20366B' }}
                    >
                      <Banknote className="inline-block mr-2 h-5 w-5" />
                      Debit Order Management
                    </h3>
                    <p className="text-slate-600 mb-4">Manage automated debit order payments for your organization members</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${organization?.primaryColor || '#20366B'}20` }}
                          >
                            <Building2 className="h-5 w-5" style={{ color: organization?.primaryColor || '#20366B' }} />
                          </div>
                          <div>
                            <h4 
                              className="font-semibold text-sm"
                              style={{ color: organization?.primaryColor || '#20366B' }}
                            >
                              Active Mandates
                            </h4>
                            <p className="text-xs text-slate-600">Current debit orders</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          style={{ 
                            borderColor: organization?.secondaryColor || '#278DD4',
                            color: organization?.primaryColor || '#20366B'
                          }}
                          onClick={() => window.open('/debit-order-setup', '_blank')}
                        >
                          View Mandates
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${organization?.secondaryColor || '#278DD4'}20` }}
                          >
                            <Clock className="h-5 w-5" style={{ color: organization?.secondaryColor || '#278DD4' }} />
                          </div>
                          <div>
                            <h4 
                              className="font-semibold text-sm"
                              style={{ color: organization?.primaryColor || '#20366B' }}
                            >
                              Transaction History
                            </h4>
                            <p className="text-xs text-slate-600">Payment records</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          style={{ 
                            borderColor: organization?.secondaryColor || '#278DD4',
                            color: organization?.primaryColor || '#20366B'
                          }}
                          onClick={() => {
                            // This could link to a transactions page or show a modal
                            toast({
                              title: "Transaction History",
                              description: "Debit order transaction history feature coming soon",
                            });
                          }}
                        >
                          View Transactions
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${organization?.accentColor || '#24D367'}20` }}
                          >
                            <Plus className="h-5 w-5" style={{ color: organization?.accentColor || '#24D367' }} />
                          </div>
                          <div>
                            <h4 
                              className="font-semibold text-sm"
                              style={{ color: organization?.primaryColor || '#20366B' }}
                            >
                              Setup Guide
                            </h4>
                            <p className="text-xs text-slate-600">Configure debit orders</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full text-xs text-white"
                          style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                          onClick={() => window.open('/debit-order-setup', '_blank')}
                        >
                          Setup Debit Orders
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Secure Debit Order Processing</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          Debit orders provide automated payment collection for your organization with full compliance to South African banking regulations.
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Automated monthly/weekly payment collection</li>
                          <li>• Secure mandate management with member consent</li>
                          <li>• Transaction tracking and audit trails</li>
                          <li>• Support for all major South African banks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 
                        className="text-lg font-semibold mb-4"
                        style={{ color: organization?.primaryColor || '#20366B' }}
                      >
                        Communication Preferences
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Email Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive notifications via email about bookings and updates
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="smsNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  SMS Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive text messages for urgent updates and reminders
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Push Notifications
                                </FormLabel>
                                <FormDescription>
                                  Get instant notifications on your device
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 
                        className="text-lg font-semibold mb-4"
                        style={{ color: organization?.primaryColor || '#20366B' }}
                      >
                        Specific Notifications
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="classReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Class Reminders
                                </FormLabel>
                                <FormDescription>
                                  Remind participants about upcoming classes
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="paymentReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Payment Reminders
                                </FormLabel>
                                <FormDescription>
                                  Send reminders for pending payments
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="bookingConfirmations"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel 
                                  className="text-base font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Booking Confirmations
                                </FormLabel>
                                <FormDescription>
                                  Confirm successful bookings to participants
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="text-white border-0"
                      style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>



            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: organization?.primaryColor || '#20366B' }}>
                    Branding & Appearance
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2" style={{ color: organization?.primaryColor || '#20366B' }}>
                            Organization Logo
                          </h4>
                          <p className="text-sm text-slate-600 mb-4">
                            Upload your organization's logo. Supported formats: JPEG, PNG, GIF, WebP, SVG. 
                            <br />
                            <span className="text-xs text-slate-500">Recommended: Square format, minimum 100x100px, maximum 5MB</span>
                          </p>
                          
                          {/* Current Logo Display */}
                          {(organization?.logo || logoPreview) && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-4">
                                <img 
                                  src={logoPreview || organization.logo} 
                                  alt={`${organization.name} logo`}
                                  className="w-16 h-16 rounded-lg border-2 border-slate-300 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {logoPreview ? 'New Logo Preview' : 'Current Logo'}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {logoPreview ? 'Click Update to save changes' : 'Select a new logo to replace'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* File Upload Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400">
                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    {logoFile ? `Selected: ${logoFile.name}` : 'Click to select logo'}
                                  </p>
                                  <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP, SVG up to 5MB</p>
                                </div>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" 
                                  onChange={handleLogoUpload}
                                  value=""
                                />
                              </label>
                            </div>
                            
                            {logoFile && (
                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleLogoUpdate}
                                  disabled={updateOrganizationMutation.isPending}
                                  className="text-white border-0"
                                  style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                                >
                                  {updateOrganizationMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Update Logo
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <div>
                        <h4 className="font-medium mb-2" style={{ color: organization?.primaryColor || '#20366B' }}>
                          Theme Colors
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">Your organization's current brand colors</p>
                        <div className="flex space-x-6">
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-16 h-16 rounded-lg border-2 border-slate-300 shadow-sm"
                              style={{ backgroundColor: organization?.primaryColor || '#20366B' }}
                            />
                            <div className="text-center mt-2">
                              <span className="text-sm font-medium text-slate-800">Primary</span>
                              <p className="text-xs text-slate-600 font-mono">
                                {organization?.primaryColor || '#20366B'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-16 h-16 rounded-lg border-2 border-slate-300 shadow-sm"
                              style={{ backgroundColor: organization?.secondaryColor || '#278DD4' }}
                            />
                            <div className="text-center mt-2">
                              <span className="text-sm font-medium text-slate-800">Secondary</span>
                              <p className="text-xs text-slate-600 font-mono">
                                {organization?.secondaryColor || '#278DD4'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-16 h-16 rounded-lg border-2 border-slate-300 shadow-sm"
                              style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                            />
                            <div className="text-center mt-2">
                              <span className="text-sm font-medium text-slate-800">Accent</span>
                              <p className="text-xs text-slate-600 font-mono">
                                {organization?.accentColor || '#24D367'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="hover:text-white"
                                style={{
                                  borderColor: organization?.accentColor || '#24D367',
                                  color: organization?.accentColor || '#24D367'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = organization?.accentColor || '#24D367';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = organization?.accentColor || '#24D367';
                                }}
                              >
                                <Palette className="mr-2 h-4 w-4" />
                                Customize Colors
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[525px]">
                              <DialogHeader>
                                <DialogTitle style={{ color: organization?.primaryColor || '#20366B' }}>
                                  Customize Brand Colors
                                </DialogTitle>
                              </DialogHeader>
                              <Form {...colorForm}>
                                <form onSubmit={colorForm.handleSubmit(onColorSubmit)} className="space-y-6">
                                  <div className="space-y-4">
                                    <FormField
                                      control={colorForm.control}
                                      name="primaryColor"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel style={{ color: organization?.primaryColor || '#20366B' }}>
                                            Primary Color
                                          </FormLabel>
                                          <FormDescription>
                                            Main brand color used for headers and primary elements
                                          </FormDescription>
                                          <FormControl>
                                            <div className="flex items-center space-x-3">
                                              <Input 
                                                type="color" 
                                                {...field}
                                                className="w-16 h-10 rounded-md border border-slate-300 cursor-pointer"
                                              />
                                              <Input 
                                                type="text" 
                                                {...field}
                                                placeholder="#20366B"
                                                className="flex-1 font-mono text-sm"
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={colorForm.control}
                                      name="secondaryColor"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel style={{ color: organization?.primaryColor || '#20366B' }}>
                                            Secondary Color
                                          </FormLabel>
                                          <FormDescription>
                                            Complementary color used for buttons and accents
                                          </FormDescription>
                                          <FormControl>
                                            <div className="flex items-center space-x-3">
                                              <Input 
                                                type="color" 
                                                {...field}
                                                className="w-16 h-10 rounded-md border border-slate-300 cursor-pointer"
                                              />
                                              <Input 
                                                type="text" 
                                                {...field}
                                                placeholder="#278DD4"
                                                className="flex-1 font-mono text-sm"
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={colorForm.control}
                                      name="accentColor"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel style={{ color: organization?.primaryColor || '#20366B' }}>
                                            Accent Color
                                          </FormLabel>
                                          <FormDescription>
                                            Highlight color used for actions and notifications
                                          </FormDescription>
                                          <FormControl>
                                            <div className="flex items-center space-x-3">
                                              <Input 
                                                type="color" 
                                                {...field}
                                                className="w-16 h-10 rounded-md border border-slate-300 cursor-pointer"
                                              />
                                              <Input 
                                                type="text" 
                                                {...field}
                                                placeholder="#24D367"
                                                className="flex-1 font-mono text-sm"
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="flex justify-end space-x-3">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setShowColorPicker(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      type="submit" 
                                      disabled={updateOrganizationMutation.isPending}
                                      className="text-white"
                                      style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                                    >
                                      <Save className="mr-2 h-4 w-4" />
                                      Save Colors
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="membership" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: organization?.primaryColor || '#20366B' }}
                  >
                    Membership Configuration
                  </h3>
                  <p className="text-slate-600">Configure your membership pricing and plan type settings</p>
                </div>

                {/* Current Plan Information */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle 
                      className="text-base font-semibold flex items-center gap-2"
                      style={{ color: organization?.primaryColor || '#20366B' }}
                    >
                      <CreditCard className="h-5 w-5" />
                      Current Plan Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Plan Type</label>
                        <div className="mt-1 text-sm font-medium">
                          {organization?.trialEndDate && new Date(organization.trialEndDate) > new Date() ? 'TRIAL' : organization?.planType?.toUpperCase() || 'FREE'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Business Model</label>
                        <div className="mt-1 text-sm font-medium">{organization?.businessModel || 'pay-per-class'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Membership Price</label>
                        <div className="mt-1 text-sm font-medium">R{organization?.membershipPrice || '299.00'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Status</label>
                        <div className="mt-1">
                          {organization?.trialEndDate && new Date(organization.trialEndDate) > new Date() ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Trial Active
                            </Badge>
                          ) : organization?.isActive ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable Membership Settings */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle 
                      className="text-base font-semibold flex items-center gap-2"
                      style={{ color: organization?.primaryColor || '#20366B' }}
                    >
                      <Settings className="h-5 w-5" />
                      Edit Membership Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...membershipForm}>
                      <form onSubmit={membershipForm.handleSubmit(onMembershipSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={membershipForm.control}
                            name="membershipPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel 
                                  className="font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Monthly Membership Fee (R)
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="299.00"
                                    {...field}
                                    className="border-slate-300"
                                    style={{
                                      '--focus-border': organization?.secondaryColor || '#278DD4',
                                      '--focus-ring': organization?.secondaryColor || '#278DD4'
                                    } as React.CSSProperties}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = organization?.secondaryColor || '#278DD4';
                                      e.currentTarget.style.boxShadow = `0 0 0 2px ${organization?.secondaryColor || '#278DD4'}20`;
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Set the monthly subscription fee for your members
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={membershipForm.control}
                            name="planType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel 
                                  className="font-medium"
                                  style={{ color: organization?.primaryColor || '#20366B' }}
                                >
                                  Plan Type
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="border-slate-300">
                                      <SelectValue placeholder="Select plan type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the subscription tier for your organization
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateMembershipMutation.isPending}
                            className="text-white"
                            style={{ backgroundColor: organization?.accentColor || '#24D367' }}
                          >
                            {updateMembershipMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Settings
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: organization?.primaryColor || '#20366B' }}
                  >
                    Organisation Administrators
                  </h3>
                  <p className="text-slate-600">Manage administrators who can access and modify organisation settings</p>
                </div>
                
                {organization && (
                  <OrganisationAdminForm 
                    organization={organization} 
                    organizationId={organization.id} 
                  />
                )}
              </div>
            </TabsContent>
      </Tabs>
    </div>
  );
}