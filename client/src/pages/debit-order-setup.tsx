import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Calendar, DollarSign, Building } from "lucide-react";
import { useLocation } from "wouter";

interface DebitOrderMandate {
  id: number;
  userId: number;
  organizationId: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  maxAmount: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: string;
  mandateReference?: string;
  signedAt?: string;
  createdAt: string;
}

const SOUTH_AFRICAN_BANKS = [
  "Standard Bank", "First National Bank (FNB)", "ABSA Bank", "Nedbank",
  "Capitec Bank", "African Bank", "Bidvest Bank", "Discovery Bank",
  "Investec Bank", "Sasfin Bank", "TymeBank", "Bank Zero"
];

export default function DebitOrderSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    organizationId: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",
    accountType: "current",
    maxAmount: "",
    frequency: "monthly",
    startDate: "",
    endDate: ""
  });

  const [activeTab, setActiveTab] = useState<"setup" | "existing">("existing");

  // Fetch user's organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
  });

  // Fetch existing mandates
  const { data: mandates = [], refetch: refetchMandates } = useQuery({
    queryKey: ["/api/debit-order/mandates"],
    queryFn: () => fetch("/api/debit-order/mandates").then(res => res.json()),
  });

  // Create mandate mutation
  const createMandateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/debit-order/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Debit order mandate created successfully",
      });
      refetchMandates();
      setActiveTab("existing");
      // Reset form
      setFormData({
        organizationId: "",
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        branchCode: "",
        accountType: "current",
        maxAmount: "",
        frequency: "monthly",
        startDate: "",
        endDate: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Activate mandate mutation
  const activateMandateMutation = useMutation({
    mutationFn: async (mandateId: number) => {
      const response = await fetch(`/api/debit-order/mandates/${mandateId}/activate`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mandate activated successfully",
      });
      refetchMandates();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.organizationId || !formData.bankName || !formData.accountHolder || 
        !formData.accountNumber || !formData.branchCode || !formData.maxAmount || !formData.startDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.accountNumber.length < 9 || formData.accountNumber.length > 11) {
      toast({
        title: "Validation Error",
        description: "Account number must be between 9 and 11 digits",
        variant: "destructive",
      });
      return;
    }

    if (formData.branchCode.length !== 6) {
      toast({
        title: "Validation Error",
        description: "Branch code must be exactly 6 digits",
        variant: "destructive",
      });
      return;
    }

    createMandateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openMandateForm = (mandateId: number) => {
    window.open(`/api/debit-order/mandates/${mandateId}/form`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Debit Order Management</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "existing" ? "default" : "outline"}
            onClick={() => setActiveTab("existing")}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            My Mandates
          </Button>
          <Button
            variant={activeTab === "setup" ? "default" : "outline"}
            onClick={() => setActiveTab("setup")}
          >
            <Building className="h-4 w-4 mr-2" />
            Set Up New Mandate
          </Button>
        </div>

        {activeTab === "existing" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Active Debit Order Mandates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mandates.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You don't have any debit order mandates set up yet. Create one to enable automatic payments.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {mandates.map((mandate: DebitOrderMandate) => {
                      const organization = organizations.find(org => org.id === mandate.organizationId);
                      return (
                        <div key={mandate.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{organization?.name || "Unknown Organization"}</h3>
                              <p className="text-sm text-gray-600">
                                {mandate.bankName} • {mandate.accountType.toUpperCase()} • 
                                ****{mandate.accountNumber.slice(-4)}
                              </p>
                              {mandate.mandateReference && (
                                <p className="text-xs text-gray-500">Ref: {mandate.mandateReference}</p>
                              )}
                            </div>
                            {getStatusBadge(mandate.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-gray-500">Max Amount</Label>
                              <div className="font-medium">R {mandate.maxAmount}</div>
                            </div>
                            <div>
                              <Label className="text-gray-500">Frequency</Label>
                              <div className="font-medium">{mandate.frequency}</div>
                            </div>
                            <div>
                              <Label className="text-gray-500">Start Date</Label>
                              <div className="font-medium">{new Date(mandate.startDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <Label className="text-gray-500">Status</Label>
                              <div className="font-medium">{mandate.status}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            {mandate.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMandateForm(mandate.id)}
                                >
                                  View Form
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => activateMandateMutation.mutate(mandate.id)}
                                  disabled={activateMandateMutation.isPending}
                                >
                                  Activate Mandate
                                </Button>
                              </>
                            )}
                            {mandate.status === "active" && (
                              <Button size="sm" variant="outline">
                                <DollarSign className="h-3 w-3 mr-1" />
                                View Transactions
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle>Set Up New Debit Order Mandate</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By setting up a debit order mandate, you authorize automatic payments for sports academy fees and bookings. 
                  All mandates comply with South African banking regulations.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizationId">Organization *</Label>
                    <Select value={formData.organizationId} onValueChange={(value) => handleInputChange("organizationId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org: any) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleInputChange("bankName", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOUTH_AFRICAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accountHolder">Account Holder Name *</Label>
                    <Input
                      id="accountHolder"
                      value={formData.accountHolder}
                      onChange={(e) => handleInputChange("accountHolder", e.target.value)}
                      placeholder="Full name as per bank account"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                      placeholder="9-11 digit account number"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <Label htmlFor="branchCode">Branch Code *</Label>
                    <Input
                      id="branchCode"
                      value={formData.branchCode}
                      onChange={(e) => handleInputChange("branchCode", e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit branch code"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="transmission">Transmission Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount (R) *</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxAmount}
                      onChange={(e) => handleInputChange("maxAmount", e.target.value)}
                      placeholder="500.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency">Payment Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      min={formData.startDate}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createMandateMutation.isPending}
                    className="flex-1"
                  >
                    {createMandateMutation.isPending ? "Creating..." : "Create Mandate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("existing")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}