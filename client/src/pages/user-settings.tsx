import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Trash2,
  AlertTriangle,
  Save,
  Loader2,
  Mail,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  classReminders: z.boolean(),
  paymentReminders: z.boolean(),
  bookingConfirmations: z.boolean(),
});

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email("Valid email is required"),
  confirmText: z.string().min(1, "Please type 'DELETE' to confirm"),
});

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: api.getCurrentUser,
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    },
  });

  const notificationForm = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      classReminders: true,
      paymentReminders: true,
      bookingConfirmations: true,
    },
  });

  const deleteAccountForm = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmEmail: "",
      confirmText: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => {
      if (!currentUser?.id) throw new Error("No user found");
      return api.updateUser(currentUser.id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (confirmEmail: string) => api.deleteOwnAccount(confirmEmail),
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      // Redirect to home page after deletion
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const onNotificationSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Notification preferences updated successfully",
    });
  };

  const onDeleteAccountSubmit = (data: any) => {
    if (data.confirmText !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type 'DELETE' exactly to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    if (data.confirmEmail !== currentUser?.email) {
      toast({
        title: "Error",
        description: "Email confirmation does not match your account email",
        variant: "destructive",
      });
      return;
    }

    deleteAccountMutation.mutate(data.confirmEmail);
    setShowDeleteDialog(false);
  };

  // Update form when user data loads
  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser, profileForm]);

  if (userLoading) {
    return (
      <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <p>Please log in to access your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              Account Settings
            </h1>
            <p className="text-slate-600 mt-2">Manage your account preferences and security settings</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <p className="text-slate-600">Update your personal details and contact information</p>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" className="bg-white" placeholder="Optional" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notification Preferences
                </CardTitle>
                <p className="text-slate-600">Choose how you want to receive notifications</p>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg bg-white">
                          <div className="space-y-1">
                            <FormLabel className="text-slate-700 font-medium">Email Notifications</FormLabel>
                            <FormDescription className="text-slate-600">
                              Receive updates and information via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg bg-white">
                          <div className="space-y-1">
                            <FormLabel className="text-slate-700 font-medium">Push Notifications</FormLabel>
                            <FormDescription className="text-slate-600">
                              Receive push notifications on your devices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="classReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg bg-white">
                          <div className="space-y-1">
                            <FormLabel className="text-slate-700 font-medium">Class Reminders</FormLabel>
                            <FormDescription className="text-slate-600">
                              Get notified before your scheduled classes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="paymentReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg bg-white">
                          <div className="space-y-1">
                            <FormLabel className="text-slate-700 font-medium">Payment Reminders</FormLabel>
                            <FormDescription className="text-slate-600">
                              Receive reminders for upcoming payments
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="bookingConfirmations"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg bg-white">
                          <div className="space-y-1">
                            <FormLabel className="text-slate-700 font-medium">Booking Confirmations</FormLabel>
                            <FormDescription className="text-slate-600">
                              Get confirmation when you book or cancel classes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Account Security
                </CardTitle>
                <p className="text-slate-600">Manage your account security and privacy settings</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="text-green-800 font-medium">Account Secure</h4>
                      <p className="text-green-700 text-sm">Your account is protected and secure</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Danger Zone
                  </h4>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-red-800 font-medium">Delete Account</h4>
                          <p className="text-red-700 text-sm mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <ul className="text-red-700 text-sm mt-2 space-y-1">
                            <li>• All your bookings and class history will be removed</li>
                            <li>• Your profile and personal information will be deleted</li>
                            <li>• Any active memberships will be cancelled</li>
                            <li>• You will be removed from all organizations</li>
                          </ul>
                        </div>
                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. Please confirm by entering your email address and typing "DELETE".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            <Form {...deleteAccountForm}>
                              <form onSubmit={deleteAccountForm.handleSubmit(onDeleteAccountSubmit)} className="space-y-4">
                                <FormField
                                  control={deleteAccountForm.control}
                                  name="confirmEmail"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Confirm your email address</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="email"
                                          placeholder={currentUser.email}
                                          className="bg-white"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={deleteAccountForm.control}
                                  name="confirmText"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Type "DELETE" to confirm</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="DELETE"
                                          className="bg-white font-mono"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={deleteAccountMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleteAccountMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                      </>
                                    )}
                                  </Button>
                                </AlertDialogFooter>
                              </form>
                            </Form>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}