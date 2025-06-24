import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, CheckCircle, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DebitOrderSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const urlParams = new URLSearchParams(window.location.search);
  const organizationId = urlParams.get('organizationId');

  const [formData, setFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    branchCode: '',
    bankName: '',
    accountType: 'current'
  });

  const { data: organization } = useQuery({
    queryKey: [`/api/organizations/${organizationId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}`);
      return response.json();
    },
    enabled: !!organizationId,
  });

  const handleSubmit = async () => {
    try {
      const response = await apiRequest("POST", "/api/debit-order/mandates", {
        organizationId: parseInt(organizationId!),
        ...formData
      });

      if (response.ok) {
        toast({
          title: "Debit Order Setup Complete",
          description: "Your monthly payments are now automated. You'll receive confirmation via email.",
        });
        setLocation("/");
      } else {
        throw new Error("Failed to setup debit order");
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mr-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-[#24D367]/20">
              <Building2 className="h-12 w-12 text-[#24D367]" />
            </div>
            <CardTitle className="text-2xl text-[#20366B]">
              Setup Debit Order
            </CardTitle>
            <CardDescription className="text-gray-600">
              Automate your monthly payments for {organization.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Bank-Level Security</h3>
                  <p className="text-sm text-blue-700">
                    Your banking details are encrypted and processed securely through our certified payment provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="Full name as it appears on your bank account"
                />
              </div>

              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, bankName: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absa">ABSA Bank</SelectItem>
                    <SelectItem value="fnb">First National Bank (FNB)</SelectItem>
                    <SelectItem value="standard">Standard Bank</SelectItem>
                    <SelectItem value="nedbank">Nedbank</SelectItem>
                    <SelectItem value="capitec">Capitec Bank</SelectItem>
                    <SelectItem value="investec">Investec</SelectItem>
                    <SelectItem value="african">African Bank</SelectItem>
                    <SelectItem value="bidvest">Bidvest Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    placeholder="6-digit code"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Account</SelectItem>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="transmission">Transmission Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Debit Order Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Never miss a payment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Automatic billing from month 2</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Cancel or modify anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Secure and compliant</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Setup Later
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-[#24D367] hover:bg-green-600 text-white"
                disabled={!formData.accountHolder || !formData.accountNumber || !formData.branchCode || !formData.bankName}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Setup Debit Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}