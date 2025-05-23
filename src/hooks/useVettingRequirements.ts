
import { useQuery } from '@tanstack/react-query';
import { announcementVettingService, VettingRequirement } from '@/services/vetting/announcementVettingService';

/**
 * Hook for accessing and managing vetting requirements
 */
export function useVettingRequirements() {
  const { data: requirements, isLoading, error, refetch } = useQuery({
    queryKey: ['vettingRequirements'],
    queryFn: async (): Promise<VettingRequirement[]> => {
      return await announcementVettingService.getVettingRequirements();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    requirements,
    isLoading,
    error,
    refetch,
    checkVettingRequired: async (headlineCategory: string) => {
      // First check cached requirements
      if (requirements) {
        const requirement = requirements.find(
          req => req.headlineCategory.toLowerCase() === headlineCategory.toLowerCase()
        );
        if (requirement) {
          return requirement.isVettingRequired;
        }
      }
      
      // If not found in cache, query directly
      return await announcementVettingService.checkVettingRequired(headlineCategory);
    },
    getVettingExemptions: async (headlineCategory: string) => {
      // First check cached requirements
      if (requirements) {
        const requirement = requirements.find(
          req => req.headlineCategory.toLowerCase() === headlineCategory.toLowerCase()
        );
        if (requirement) {
          return requirement.exemptions;
        }
      }
      
      // If not found in cache, query directly
      return await announcementVettingService.getVettingExemptions(headlineCategory);
    }
  };
}
