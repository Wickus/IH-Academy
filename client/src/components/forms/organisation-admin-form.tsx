import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, User, Crown } from "lucide-react";
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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [open, setOpen] = useState(false);

  // Fetch all users for admin assignment
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch current organisation admins
  const { data: organisationAdmins = [] } = useQuery({
    queryKey: ['/api/organizations', organizationId, 'admins'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/organizations/${organizationId}/admins`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!organizationId,
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest('POST', `/api/organizations/${organizationId}/admins`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'admins'] });
      setOpen(false);
      setSelectedUserId(null);
      setSearchEmail("");
      toast({
        title: "Admin Added",
        description: "User has been successfully added as an organisation admin.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Addition Failed",
        description: error.message || "Failed to add user as admin.",
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

  const handleAddAdmin = () => {
    if (!selectedUserId) return;
    addAdminMutation.mutate(selectedUserId);
  };

  // Get available users (not already admins and filtered by search)
  const currentAdminIds = new Set(organisationAdmins.map((admin: any) => admin.id));
  const filteredUsers = allUsers.filter((user: any) => {
    const isNotCurrentAdmin = !currentAdminIds.has(user.id);
    const matchesSearch = searchEmail === "" || user.email.toLowerCase().includes(searchEmail.toLowerCase());
    return isNotCurrentAdmin && matchesSearch;
  });

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
              <DialogTitle>Add Organisation Administrator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search by Email</label>
                <Input
                  placeholder="Type email to search users..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              {searchEmail && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select User</label>
                  <Select value={selectedUserId?.toString()} onValueChange={(value) => setSelectedUserId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.slice(0, 10).map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span>{user.name || user.username}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {filteredUsers.length === 0 && (
                        <SelectItem value="none" disabled>
                          No users found matching "{searchEmail}"
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddAdmin}
                  disabled={!selectedUserId || addAdminMutation.isPending}
                  style={{ backgroundColor: organization?.primaryColor || "#20366B" }}
                  className="flex-1"
                >
                  {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
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