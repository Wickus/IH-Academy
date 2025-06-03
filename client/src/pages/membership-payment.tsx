import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Shield, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function MembershipPayment() {
  const [, params] = useRoute("/membership-payment/:organizationId");
  const [, setLocation] = useLocation();
  const organizationId = params?.organizationId ? parseInt(params.organizationId) : null;

  const { data: organization, isLoading } = useQuery({
    queryKey: ["/api/organizations", organizationId],
    queryFn: () => api.getOrganization(organizationId!),
    enabled: !!organizationId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => api.getCurrentUser(),
  });

  const handlePayFastPayment = () => {
    if (!organization || !currentUser) return;

    // Generate PayFast payment data
    const paymentData = {
      merchant_id: organization.payfastMerchantId || "10000100",
      merchant_key: organization.payfastMerchantKey || "46f0cd694581a",
      amount: organization.membershipPrice,
      item_name: `${organization.name} Membership - ${organization.membershipBillingCycle}`,
      item_description: `Monthly membership for ${organization.name}`,
      email_address: currentUser.email,
      name_first: currentUser.firstName || currentUser.username,
      name_last: currentUser.lastName || "",
      return_url: `${window.location.origin}/membership-success`,
      cancel_url: `${window.location.origin}/organizations/${organizationId}`,
      notify_url: `${window.location.origin}/api/payfast-notify`,
      custom_str1: organizationId.toString(),
      custom_str2: currentUser.id.toString(),
      custom_str3: "membership"
    };

    // Create form and submit to PayFast
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = organization.payfastSandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organization || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p>Organization not found</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/organizations/${organizationId}`)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Complete Your Membership</h1>
            <p className="text-white/80">Join {organization.name} today</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Membership Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#24D367]" />
                Membership Summary
              </CardTitle>
              <CardDescription>Review your membership details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{organization.name} Membership</span>
                <Badge variant="secondary" className="bg-[#24D367]/10 text-[#24D367] border-[#24D367]/20">
                  {organization.membershipBillingCycle}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Billing Cycle</span>
                  <span className="capitalize">{organization.membershipBillingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price</span>
                  <span>R{organization.membershipPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Auto-renewal</span>
                  <span>Yes</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>R{organization.membershipPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Membership Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#24D367]" />
                Membership Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#24D367]" />
                  <span>Access to all daily scheduled classes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#24D367]" />
                  <span>Unlimited bookings during membership period</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#24D367]" />
                  <span>Priority access to special events</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[#24D367]" />
                  <span>Member-only content and resources</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#278DD4]" />
                Payment
              </CardTitle>
              <CardDescription>Secure payment powered by PayFast</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your payment is secured by PayFast's SSL encryption</span>
              </div>
              
              <Button
                onClick={handlePayFastPayment}
                className="w-full bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#24D367]/90 hover:to-[#24D3BF]/90 text-white font-semibold py-3"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with PayFast - R{organization.membershipPrice}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                By proceeding, you agree to the terms and conditions. 
                Your membership will be activated upon successful payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}