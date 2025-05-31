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
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organization");
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["/api/organizations", 1],
    queryFn: () => api.getOrganization(1),
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

  const updateOrganizationMutation = useMutation({
    mutationFn: (data: any) => api.updateOrganization(1, data),
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

  const onOrganizationSubmit = (data: any) => {
    updateOrganizationMutation.mutate(data);
  };

  const onNotificationSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Notification preferences updated successfully",
    });
  };

  if (orgLoading) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#20366B]">Settings</h1>
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
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#20366B]">Settings</h1>
          <p className="text-slate-600">Manage your organization and preferences with ItsHappening.Africa</p>
        </div>
      </div>

      <Card className="border-0 shadow-md bg-white">
        <CardHeader className="bg-gradient-to-r from-[#20366B] to-[#278DD4] text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100">
              <TabsTrigger value="organization" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
                <Building className="mr-2 h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-[#278DD4] data-[state=active]:text-white">
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
                          <FormLabel className="text-[#20366B] font-medium">Organization Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your organization name" 
                              {...field} 
                              className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                          <FormLabel className="text-[#20366B] font-medium">Email Address *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="contact@organization.com" 
                                {...field} 
                                className="pl-10 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                          <FormLabel className="text-[#20366B] font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="+27 12 345 6789" 
                                {...field} 
                                className="pl-10 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                          <FormLabel className="text-[#20366B] font-medium">Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="https://your-website.com" 
                                {...field} 
                                className="pl-10 border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                        <FormLabel className="text-[#20366B] font-medium">Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main Street, City, Province, Postal Code" 
                            {...field} 
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4]"
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
                        <FormLabel className="text-[#20366B] font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your organization, mission, and what makes you unique..." 
                            {...field} 
                            className="border-slate-300 focus:border-[#278DD4] focus:ring-[#278DD4] min-h-[100px]"
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
                  <h3 className="text-lg font-semibold text-[#20366B] mb-4">Branding & Appearance</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-[#20366B] mb-2">Organization Logo</h4>
                          <p className="text-sm text-slate-600 mb-4">Upload your organization's logo</p>
                          <Button variant="outline" className="border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white">
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <div>
                        <h4 className="font-medium text-[#20366B] mb-2">Theme Colors</h4>
                        <p className="text-sm text-slate-600 mb-4">Customize your organization's brand colors</p>
                        <div className="flex space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-[#20366B] rounded-lg border-2 border-slate-300"></div>
                            <span className="text-xs text-slate-600 mt-1">Primary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-[#278DD4] rounded-lg border-2 border-slate-300"></div>
                            <span className="text-xs text-slate-600 mt-1">Secondary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-[#24D367] rounded-lg border-2 border-slate-300"></div>
                            <span className="text-xs text-slate-600 mt-1">Accent</span>
                          </div>
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