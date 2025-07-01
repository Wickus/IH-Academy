import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type User, type Organization } from '@/lib/api';

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  hasOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isLoading: true,
  hasOrganization: false,
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export function OrganizationProvider({ children, user }: OrganizationProviderProps) {
  const { data: userOrganizations, isLoading } = useQuery({
    queryKey: ["/api/organizations/my"],
    queryFn: api.getUserOrganizations,
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache for better UX
    gcTime: 60 * 60 * 1000, // 1 hour (gcTime is the new name for cacheTime in v5)
  });

  const organization = userOrganizations?.[0] || null;
  const hasOrganization = !!organization;

  // Show loading state only if we have a user but no cached data
  const shouldShowLoading = isLoading && !!user && !userOrganizations;

  return (
    <OrganizationContext.Provider 
      value={{ 
        organization, 
        isLoading: shouldShowLoading, 
        hasOrganization 
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}