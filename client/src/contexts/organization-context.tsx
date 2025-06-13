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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const organization = userOrganizations?.[0] || null;
  const hasOrganization = !!organization;

  return (
    <OrganizationContext.Provider 
      value={{ 
        organization, 
        isLoading: isLoading && !!user, 
        hasOrganization 
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}