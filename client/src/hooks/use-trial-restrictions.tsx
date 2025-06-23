import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TrialRestrictions {
  maxClasses: number;
  maxMembers: number;
  canAccessAnalytics: boolean;
  canUsePremiumFeatures: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
}

export function useTrialRestrictions(organizationId: number) {
  const { data: organization } = useQuery({
    queryKey: [`/api/organizations/${organizationId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}`);
      return response.json();
    },
  });

  const { data: trialStatus } = useQuery({
    queryKey: [`/api/organizations/${organizationId}/trial-status`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/trial-status`);
      return response.json();
    },
  });

  if (!organization || !trialStatus) {
    return {
      maxClasses: 0,
      maxMembers: 0,
      canAccessAnalytics: false,
      canUsePremiumFeatures: false,
      isTrialExpired: true,
      daysRemaining: 0,
    };
  }

  const { subscriptionStatus, planType } = organization;
  const { isExpired, daysRemaining } = trialStatus;

  // Define restrictions based on plan type and trial status
  let restrictions: TrialRestrictions = {
    maxClasses: 10,
    maxMembers: 100,
    canAccessAnalytics: false,
    canUsePremiumFeatures: false,
    isTrialExpired: isExpired,
    daysRemaining,
  };

  if (subscriptionStatus === 'active') {
    // Paid subscription - full access based on plan
    if (planType === 'premium') {
      restrictions = {
        ...restrictions,
        maxClasses: Infinity,
        maxMembers: Infinity,
        canAccessAnalytics: true,
        canUsePremiumFeatures: true,
      };
    } else if (planType === 'basic') {
      restrictions = {
        ...restrictions,
        maxClasses: 50,
        maxMembers: 500,
        canAccessAnalytics: true,
        canUsePremiumFeatures: false,
      };
    }
  } else if (subscriptionStatus === 'trial' && !isExpired) {
    // Active trial - basic features available
    restrictions = {
      ...restrictions,
      maxClasses: 25,
      maxMembers: 250,
      canAccessAnalytics: true,
      canUsePremiumFeatures: false,
    };
  } else if (isExpired) {
    // Expired trial - very limited access
    restrictions = {
      ...restrictions,
      maxClasses: 5,
      maxMembers: 20,
      canAccessAnalytics: false,
      canUsePremiumFeatures: false,
    };
  }

  return restrictions;
}

export function FeatureGate({ 
  organizationId, 
  feature, 
  children, 
  fallback 
}: {
  organizationId: number;
  feature: keyof TrialRestrictions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const restrictions = useTrialRestrictions(organizationId);
  
  const hasAccess = restrictions[feature] as boolean;
  
  if (!hasAccess) {
    return fallback || null;
  }
  
  return <>{children}</>;
}