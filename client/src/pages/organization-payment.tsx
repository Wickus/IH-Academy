import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, CheckCircle, Building2, Users, Calendar } from "lucide-react";
import type { Organization } from "@shared/schema";

export default function OrganizationPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get organization ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get('orgId');

  // Fetch organization data
  const { data: organization } = useQuery({
    queryKey: [`/api/organizations/${orgId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${orgId}`);
      return response.json();
    },
    enabled: !!orgId,
  }) as { data: Organization | undefined };

  const createPaymentMutation = useMutation({
    mutationFn: async (planType: string) => {
      const amount = planType === "professional" ? 299 : planType === "enterprise" ? 599 : 0;
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        organizationId: orgId,
        planType
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Welcome to ItsHappening.Africa! Your organisation is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const skipPayment = () => {
    toast({
      title: "Trial Period Started",
      description: "You have 14 days to complete payment.",
    });
    setLocation("/dashboard");
  };

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Dynamic pricing based on business model
  const getPlans = () => {
    if (organization?.businessModel === "membership") {
      return [
        {
          name: "Free",
          price: "R0",
          period: "/month",
          value: "free",
          features: [
            "Up to 25 members",
            "3 active classes",
            "Basic membership management",
            "Community support",
            "14-day trial of all features"
          ]
        },
        {
          name: "Professional",
          price: "R299",
          period: "/month",
          value: "professional",
          popular: true,
          features: [
            "Up to 200 members",
            "Unlimited classes",
            "Membership subscriptions",
            "Advanced analytics",
            "Payment processing",
            "WhatsApp notifications",
            "Priority support"
          ]
        },
        {
          name: "Enterprise",
          price: "R599",
          period: "/month",
          value: "enterprise",
          features: [
            "Unlimited members",
            "Unlimited classes",
            "Advanced membership tiers",
            "Multi-location support",
            "Custom branding",
            "API access",
            "Dedicated support"
          ]
        }
      ];
    } else {
      // Pay-per-class model
      return [
        {
          name: "Free",
          price: "R0",
          period: "/month",
          value: "free",
          features: [
            "Up to 25 bookings",
            "3 active classes",
            "Basic booking system",
            "Community support",
            "14-day trial of all features"
          ]
        },
        {
          name: "Professional",
          price: "R299",
          period: "/month",
          value: "professional",
          popular: true,
          features: [
            "Up to 500 bookings",
            "Unlimited classes",
            "Per-class payments",
            "Advanced analytics",
            "Payment processing",
            "WhatsApp notifications",
            "Priority support"
          ]
        },
        {
          name: "Enterprise",
          price: "R599",
          period: "/month",
          value: "enterprise",
          features: [
            "Unlimited bookings",
            "Unlimited classes",
            "Advanced pricing models",
            "Multi-location support",
            "Custom branding",
            "API access",
            "Dedicated support"
          ]
        }
      ];
    }
  };

  const plans = getPlans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#20366B] via-[#278DD4] to-[#24D367] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Building2 className="h-16 w-16 text-white mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Complete Your Setup
          </h1>
          <p className="text-xl text-white/90 mb-2">
            {organization.name} is almost ready!
          </p>
          <p className="text-white/80">
            Choose a plan to activate your sports management platform
          </p>
        </div>

        {/* Organization Summary */}
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#24D367]" />
              Organisation Configuration Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-[#20366B] mx-auto mb-2" />
                <p className="font-medium">{organization.name}</p>
                <p className="text-sm text-gray-600">Organisation Name</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-[#278DD4] mx-auto mb-2" />
                <p className="font-medium capitalize">
                  {organization.businessModel === 'membership' ? 'Membership-Based' : 
                   organization.businessModel === 'pay_per_class' ? 'Pay-Per-Class' : 
                   'Not Set'}
                </p>
                <p className="text-sm text-slate-600">Business Model</p>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 text-[#24D367] mx-auto mb-2" />
                <p className="font-medium">Ready to Launch</p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.value}
              className={`relative bg-white/95 backdrop-blur shadow-xl border-0 ${
                plan.popular ? 'ring-2 ring-[#24D367] scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#24D367] text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-[#20366B]">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#278DD4]">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#24D367]" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => createPaymentMutation.mutate(plan.value)}
                  disabled={createPaymentMutation.isPending}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#24D367] to-[#24D3BF] hover:from-[#20366B] hover:to-[#278DD4]'
                      : 'bg-gradient-to-r from-[#278DD4] to-[#20366B] hover:from-[#24D367] hover:to-[#24D3BF]'
                  } text-white font-semibold`}
                >
                  {createPaymentMutation.isPending ? "Processing..." : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trial Option */}
        <Card className="bg-white/95 backdrop-blur shadow-xl border-0 text-center">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-[#20366B] mb-2">
              Need more time to decide?
            </h3>
            <p className="text-gray-600 mb-4">
              Start with a 14-day free trial. You can upgrade anytime.
            </p>
            <Button
              onClick={skipPayment}
              variant="outline"
              className="border-[#278DD4] text-[#278DD4] hover:bg-[#278DD4] hover:text-white"
            >
              Start 14-Day Free Trial
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}