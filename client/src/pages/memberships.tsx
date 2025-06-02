import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, UserPlus, Calendar, TrendingUp } from "lucide-react";
import type { Membership, Organization, User } from "@shared/schema";

interface MembershipWithUser extends Membership {
  user: User;
}

export default function Memberships() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current organization
  const { data: organizations } = useQuery({
    queryKey: ["/api/organizations/my"],
  });

  const organization = organizations?.[0] as Organization;

  // Fetch memberships for the organization
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["/api/memberships", organization?.id],
    queryFn: () => apiRequest("GET", `/api/memberships?organizationId=${organization?.id}`),
    enabled: !!organization?.id,
  });

  // Fetch available users (members without active memberships)
  const { data: availableUsers = [] } = useQuery({
    queryKey: ["/api/users/available-for-membership", organization?.id],
    queryFn: () => apiRequest("GET", `/api/users/available-for-membership?organizationId=${organization?.id}`),
    enabled: !!organization?.id,
  });

  // Create membership mutation
  const createMembershipMutation = useMutation({
    mutationFn: async (data: { userId: number; organizationId: number }) => {
      return apiRequest("POST", "/api/memberships", data);
    },
    onSuccess: () => {
      toast({
        title: "Membership Created",
        description: "New membership has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/available-for-membership"] });
      setIsDialogOpen(false);
      setSelectedUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership",
        variant: "destructive",
      });
    },
  });

  // Update membership status mutation
  const updateMembershipMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/memberships/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Membership Updated",
        description: "Membership status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update membership",
        variant: "destructive",
      });
    },
  });

  const handleCreateMembership = () => {
    if (!selectedUserId || !organization?.id) return;
    
    createMembershipMutation.mutate({
      userId: parseInt(selectedUserId),
      organizationId: organization.id,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "expired":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount: string) => {
    return `R${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Show message if organization is not membership-based
  if (organization && organization.businessModel !== "membership") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Membership Management Not Available
              </h3>
              <p className="text-gray-600 mb-4">
                Your organisation uses a pay-per-class business model. 
                Membership management is only available for membership-based organisations.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/settings"}>
                Update Business Model
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const activeMemberships = memberships.filter((m: MembershipWithUser) => m.status === "active");
  const totalRevenue = activeMemberships.reduce((sum: number, m: MembershipWithUser) => sum + parseFloat(m.price), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membership Management</h1>
          <p className="text-gray-600">Manage member subscriptions and payments</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Membership</DialogTitle>
              <DialogDescription>
                Add a new member to your organisation with a monthly subscription.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to add as member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Membership Details</span>
                </div>
                <p className="text-sm text-blue-700">
                  Price: {formatCurrency(organization?.membershipPrice || "0")} per {organization?.membershipBillingCycle}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateMembership}
                  disabled={!selectedUserId || createMembershipMutation.isPending}
                >
                  {createMembershipMutation.isPending ? "Creating..." : "Create Membership"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMemberships.length}</div>
            <p className="text-xs text-muted-foreground">
              +{memberships.filter((m: MembershipWithUser) => m.status === "pending").length} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-xs text-muted-foreground">
              From {activeMemberships.length} active memberships
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Cycle</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{organization?.membershipBillingCycle}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(organization?.membershipPrice || "0")} per cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Memberships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Memberships</CardTitle>
          <CardDescription>
            Manage and track all member subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No memberships yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your membership base by adding members.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Add First Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership: MembershipWithUser) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{membership.user?.name}</div>
                        <div className="text-sm text-gray-500">{membership.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(membership.status)}>
                        {membership.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(membership.startDate)}</TableCell>
                    <TableCell>{formatDate(membership.endDate)}</TableCell>
                    <TableCell>{formatCurrency(membership.price)}</TableCell>
                    <TableCell>
                      {membership.nextBillingDate ? formatDate(membership.nextBillingDate) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {membership.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateMembershipMutation.mutate({ 
                              id: membership.id, 
                              status: "active" 
                            })}
                          >
                            Activate
                          </Button>
                        )}
                        {membership.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMembershipMutation.mutate({ 
                              id: membership.id, 
                              status: "cancelled" 
                            })}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}