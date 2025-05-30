import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api.getCurrentUser(),
    retry: false
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user
  };
}