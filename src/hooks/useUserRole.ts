import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'manager' | 'analyst' | 'user';

interface UseUserRoleReturn {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to manage user roles and permissions
 * Uses secure server-side role checking via Supabase RLS
 */
export function useUserRole(): UseUserRoleReturn {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserRoles() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        const userRoles = data?.map(r => r.role as AppRole) || [];
        setRoles(userRoles);
        setError(null);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch roles'));
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRoles();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRoles();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = roles.includes('admin');

  return {
    roles,
    hasRole,
    isAdmin,
    isLoading,
    error,
  };
}
