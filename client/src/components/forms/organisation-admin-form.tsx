import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, User, Crown, Mail, Settings, Key, Edit, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";

interface OrganisationAdminFormProps {
  organizationId: number;
  organization: any;
}

export default function OrganisationAdminForm({ organizationId, organization }: OrganisationAdminFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editEmail, setEditEmail] = useState("");
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<any>(null);

  // Fetch current organisation admins
  const { data: organisationAdmins = [], refetch: refetchAdmins, isLoading, error } = useQuery({
    queryKey: ['/api/organizations', organizationId, 'admins'],
    queryFn: async () => {
      try {
        console.log(`Fetching admins for organization ${organizationId}`);
        const response = await apiRequest('GET', `/api/organizations/${organizationId}/admins`);
        const json = await response.json();
        console.log("Admins API response:", json);
        console.log("Response type:", typeof json, "Is array:", Array.isArray(json));
        return Array.isArray(json) ? json : [];
      } catch (error) {
        console.error("Error fetching admins:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 0, // Always consider data stale to force fresh fetches
    retry: 1 // Reduce retries to see error faster
  });

  // Invite admin mutation
  const inviteAdminMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest('POST', `/api/organizations/${organizationId}/invite-admin`, { email }),
    onSuccess: (response: any) => {
      // Force complete cache refresh for admin data
      queryClient.removeQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId] });

      // Force immediate refetch to update UI
      setTimeout(() => {
        refetchAdmins();
        queryClient.refetchQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      }, 500);

      setOpen(false);
      setInviteEmail("");

      const emailStatus = response?.emailSent ? "They will receive an email with instructions." : "Email delivery may be delayed.";
      const userCreated = response?.userCreated ? "A new account was created for them." : "They can use their existing account.";

      toast({
        title: "Invitation Sent",
        description: `Admin invitation has been sent successfully. ${emailStatus} ${userCreated}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send admin invitation.",
        variant: "destructive",
      });
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('DELETE', `/api/organizations/${organizationId}/admins/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      toast({
        title: "Admin Removed",
        description: "Admin has been removed from this organisation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove admin from organisation.",
        variant: "destructive",
      });
    },
  });

  // Update admin role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ adminId, newRole }: { adminId: number; newRole: string }) => {
      const response = await fetch(`/api/users/${adminId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization?.id}/admins`] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Update admin email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ adminId, newEmail }: { adminId: number; newEmail: string }) => {
      const response = await fetch(`/api/users/${adminId}/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update email');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization?.id}/admins`] });
      setEditingAdmin(null);
      setEditEmail('');
      toast({
        title: "Success",
        description: "Email updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    },
  });

  // Reset admin password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/users/${adminId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  const handleInviteAdmin = () => {
    if (!inviteEmail.trim()) return;
    inviteAdminMutation.mutate(inviteEmail.trim());
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4" />;
      case "coach":
        return <Shield className="w-4 h-4" />;
      case "member":
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return organization?.primaryColor || "#20366B";
      case "coach":
        return organization?.secondaryColor || "#278DD4";
      case "member":
        return organization?.accentColor || "#24D367";
      default:
        return "#6B7280";
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="w-5 h-5" style={{ color: organization?.primaryColor || "#20366B" }} />
          Organisation Administrators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Admins */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-gray-500">Loading administrators...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Error loading administrators: {error.message}
              </div>
            </div>
          ) : organisationAdmins.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-gray-500 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No administrators found for this organisation.
              </div>
            </div>
          ) : (
            organisationAdmins.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getRoleIcon("admin")}
                    <div>
                      <span className="font-medium block">{admin.firstName && admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.name || admin.username}</span>
                      <span className="text-sm text-gray-500">{admin.email}</span>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(admin.createdAt).toLocaleDateString()}
                        {admin.lastLogin && (
                          <span className="ml-2">Last login: {new Date(admin.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getRoleColor("admin"),
                      color: getRoleColor("admin"),
                    }}
                  >
                    Admin
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {/* Admin Management Buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAdmin(admin);
                      setEditEmail(admin.email);
                    }}
                    title="Edit Email"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will send a password reset email to {admin.email}. They will need to click the link in the email to set a new password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetPasswordMutation.mutate(admin.id)}
                          disabled={resetPasswordMutation.isPending}
                          style={{ backgroundColor: organization?.primaryColor || "#20366B" }}
                        >
                          {resetPasswordMutation.isPending ? "Sending..." : "Send Reset Email"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Select
                    value="admin"
                    onValueChange={(newRole) =>
                      updateRoleMutation.mutate({ adminId: admin.id, newRole })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>

                  {organisationAdmins.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Administrator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {admin.firstName && admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.name || admin.username} as an administrator? They will lose access to organization management features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeAdminMutation.mutate(admin.id)}
                            disabled={removeAdminMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {removeAdminMutation.isPending ? "Removing..." : "Remove Admin"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Admin */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              style={{
                borderColor: organization?.secondaryColor || "#278DD4",
                color: organization?.secondaryColor || "#278DD4",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Administrator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Organisation Administrator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter email address to invite..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                {inviteEmail && !isValidEmail(inviteEmail) && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid email address</p>
                )}
              </div>
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded">
                <Mail className="w-4 h-4 inline mr-1" />
                An invitation email will be sent to this address. If they don't have an account, one will be created automatically.
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleInviteAdmin}
                  disabled={!inviteEmail.trim() || !isValidEmail(inviteEmail) || inviteAdminMutation.isPending}
                  style={{ backgroundColor: organization?.primaryColor || "#20366B" }}
                  className="flex-1"
                >
                  {inviteAdminMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
          <Shield className="w-4 h-4 inline mr-1" />
          Administrators have full access to manage this organisation, including classes, coaches, members, and settings.
        </div>

        {/* Edit Email Dialog */}
        <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Administrator Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Administrator</Label>
                <p className="text-sm text-gray-600">
                  {editingAdmin?.firstName && editingAdmin?.lastName 
                    ? `${editingAdmin.firstName} ${editingAdmin.lastName}` 
                    : editingAdmin?.name || editingAdmin?.username
                  }
                </p>
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter new email address..."
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
                {editEmail && !isValidEmail(editEmail) && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid email address</p>
                )}
              </div>
              <div className="text-sm text-gray-600 p-3 bg-amber-50 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Important:</p>
                  <p>The administrator will need to verify their new email address. They will receive a confirmation email at the new address.</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateEmailMutation.mutate({ adminId: editingAdmin.id, newEmail: editEmail })}
                  disabled={!editEmail.trim() || !isValidEmail(editEmail) || updateEmailMutation.isPending || editEmail === editingAdmin?.email}
                  style={{ backgroundColor: organization?.primaryColor || "#20366B" }}
                  className="flex-1"
                >
                  {updateEmailMutation.isPending ? "Updating..." : "Update Email"}
                </Button>
                <Button variant="outline" onClick={() => setEditingAdmin(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}