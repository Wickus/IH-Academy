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
  CreditCard,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import SportForm from "@/components/forms/sport-form";
import PayfastCredentials, { type PayfastCredentialsData } from "@/components/forms/payfast-credentials";

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

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organization");
  const [showSportForm, setShowSportForm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: userOrganizations } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
  });

  const organization = userOrganizations?.[0];
  const orgLoading = !userOrganizations;

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
    mutationFn: (data: PayfastCredentialsData) => {
      if (!organization?.id) throw new Error("No organization found");
      return api.updateOrganization(organization.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: "Payfast credentials updated successfully",
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

  const onPayfastCredentialsSubmit = (data: PayfastCredentialsData) => {
    updatePayfastCredentialsMutation.mutate(data);
  };

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

      <Card className="border-0 shadow-md bg-white">
        <CardHeader 
          className="text-white rounded-t-lg"
          style={{
            background: `linear-gradient(to right, ${organization?.primaryColor || '#20366B'}, ${organization?.secondaryColor || '#278DD4'})`
          }}
        >
          <CardTitle className="text-xl font-bold flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-slate-100">
              <TabsTrigger 
                value="organization" 
                className="data-[state=active]:text-white"
                style={{
                  '--active-bg': organization?.secondaryColor || '#278DD4'
                } as React.CSSProperties}
                onFocus={(e) => {
                  if (activeTab === 'organization') {
                    e.currentTarget.style.backgroundColor = organization?.secondaryColor || '#278DD4';
                  }
                }}
              >
                <Building className="mr-2 h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger 
                value="sports" 
                className="data-[state=active]:text-white"
                style={{
                  backgroundColor: activeTab === 'sports' ? organization?.secondaryColor || '#278DD4' : 'transparent'
                }}
              >
                <Dumbbell className="mr-2 h-4 w-4" />
                Sports
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="data-[state=active]:text-white"
                style={{
                  backgroundColor: activeTab === 'payments' ? organization?.secondaryColor || '#278DD4' : 'transparent'
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:text-white"
                style={{
                  backgroundColor: activeTab === 'notifications' ? organization?.secondaryColor || '#278DD4' : 'transparent'
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:text-white"
                style={{
                  backgroundColor: activeTab === 'security' ? organization?.secondaryColor || '#278DD4' : 'transparent'
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="data-[state=active]:text-white"
                style={{
                  backgroundColor: activeTab === 'appearance' ? organization?.secondaryColor || '#278DD4' : 'transparent'
                }}
              >
                <Palette className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="space-y-6">
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
                      className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0"
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
                    <h3 className="text-lg font-semibold text-[#20366B]">Sports Management</h3>
                    <p className="text-slate-600">Add and manage the sports available at your organisation</p>
                  </div>
                  <Dialog open={showSportForm} onOpenChange={setShowSportForm}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sport
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle className="text-[#20366B]">Add New Sport</DialogTitle>
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
                              <h4 className="font-semibold text-[#20366B]">{sport.name}</h4>
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
                            onClick={() => {
                              toast({
                                title: "Feature Coming Soon",
                                description: "Sport deletion will be available in a future update",
                              });
                            }}
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
                  <h3 className="text-lg font-semibold text-[#20366B] mb-2">Payment Gateway Configuration</h3>
                  <p className="text-slate-600 mb-6">Configure your Payfast merchant account to accept payments for class bookings</p>
                </div>
                
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
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#20366B] mb-4">Communication Preferences</h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                      <h3 className="text-lg font-semibold text-[#20366B] mb-4">Specific Notifications</h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="classReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                                <FormLabel className="text-base font-medium text-[#20366B]">
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
                      className="bg-[#24D367] hover:bg-[#1fb557] text-white border-0"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#20366B] mb-4">Account Security</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#20366B]">Change Password</h4>
                          <p className="text-sm text-slate-600">Update your account password</p>
                        </div>
                        <Button variant="outline" className="border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white">
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#20366B]">Two-Factor Authentication</h4>
                          <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline" className="border-[#24D367] text-[#24D367] hover:bg-[#24D367] hover:text-white">
                          Enable 2FA
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#20366B]">Active Sessions</h4>
                          <p className="text-sm text-slate-600">Manage your active login sessions</p>
                        </div>
                        <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-50">
                          View Sessions
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                          <p className="text-sm text-slate-600 mb-4">Upload your organization's logo</p>
                          
                          {organization?.logo && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-4">
                                <img 
                                  src={organization.logo} 
                                  alt={`${organization.name} logo`}
                                  className="w-16 h-16 rounded-lg border-2 border-slate-300 object-cover"
                                />
                                <div>
                                  <p className="text-sm font-medium text-slate-800">Current Logo</p>
                                  <p className="text-xs text-slate-600">Click below to upload a new logo</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            className="hover:text-white"
                            style={{
                              borderColor: organization?.secondaryColor || '#278DD4',
                              color: organization?.secondaryColor || '#278DD4'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = organization?.secondaryColor || '#278DD4';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = organization?.secondaryColor || '#278DD4';
                            }}
                          >
                            {organization?.logo ? 'Update Logo' : 'Upload Logo'}
                          </Button>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}