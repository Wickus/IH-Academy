import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, User, Crown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  // Fetch current organisation admins
  const { data: organisationAdmins = [] } = useQuery({
    queryKey: ['/api/organizations', organizationId, 'admins'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/organizations/${organizationId}/admins`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!organizationId,
  });

  // Invite admin mutation
  const inviteAdminMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest('POST', `/api/organizations/${organizationId}/invite-admin`, { email }),
    onSuccess: (response: any) => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId] });
      queryClient.refetchQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
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
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiRequest('PUT', `/api/organizations/${organizationId}/admins/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      toast({
        title: "Role Updated",
        description: "Admin role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update admin role.",
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
          {organisationAdmins.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No administrators found.</p>
          ) : (
            organisationAdmins.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon("admin")}
                    <div>
                      <span className="font-medium block">{admin.name || admin.username}</span>
                      <span className="text-sm text-gray-500">{admin.email}</span>
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
                  <Select
                    value="admin"
                    onValueChange={(newRole) =>
                      updateRoleMutation.mutate({ userId: admin.id, role: newRole })
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdminMutation.mutate(admin.id)}
                      disabled={removeAdminMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
      </CardContent>
    </Card>
  );
}