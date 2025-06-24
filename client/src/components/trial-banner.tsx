import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface TrialBannerProps {
  organizationId: number;
  organizationColors?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

export function TrialBanner({ organizationId, organizationColors }: TrialBannerProps) {
  const [, setLocation] = useLocation();
  
  const { data: trialStatus } = useQuery({
    queryKey: [`/api/organizations/${organizationId}/trial-status`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/trial-status`);
      return response.json();
    },
    refetchInterval: 3600000, // Check every hour
  });

  if (!trialStatus) return null;

  const { isExpired, daysRemaining, subscriptionStatus } = trialStatus;
  
  // Only show banner for trial organizations
  if (subscriptionStatus !== 'trial') return null;
  const colors = organizationColors || {
    primaryColor: "#20366B",
    secondaryColor: "#278DD4", 
    accentColor: "#24D367"
  };

  if (isExpired) {
    return (
      <Alert className="bg-red-50 border-red-200 mb-6">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className="text-red-800">
            <strong>Trial Expired:</strong> Your free trial has ended. Upgrade to continue using all features.
          </span>
          <Button
            size="sm"
            onClick={() => window.open('https://service.itshappening.africa/widget/booking/oZM1qWIoJJlfWxzibL30', '_blank')}
            style={{ backgroundColor: colors.primaryColor }}
            className="text-white hover:opacity-90"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Book Setup Call
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining <= 3) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200 mb-6">
        <Calendar className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className="text-yellow-800">
            <strong>Trial Ending Soon:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your free trial.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://service.itshappening.africa/widget/booking/oZM1qWIoJJlfWxzibL30', '_blank')}
            style={{ 
              borderColor: colors.secondaryColor,
              color: colors.secondaryColor
            }}
            className="hover:opacity-90"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Book Setup Call
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show active trial status for all trial organizations
  return (
    <Alert className="bg-blue-50 border-blue-200 mb-6">
      <Calendar className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-blue-800">
          <strong>Free Trial Active:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining. Enjoying full access to all features!
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open('https://service.itshappening.africa/widget/booking/oZM1qWIoJJlfWxzibL30', '_blank')}
          style={{ 
            borderColor: colors.accentColor,
            color: colors.primaryColor
          }}
          className="hover:opacity-90"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Book Setup Call
        </Button>
      </AlertDescription>
    </Alert>
  );
}