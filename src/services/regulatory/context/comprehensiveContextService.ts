
import { enhancedContextService } from './enhancedContextService';

/**
 * Service for comprehensive regulatory context with enhanced vetting and guidance
 */
export const comprehensiveContextService = {
  /**
   * Get comprehensive regulatory context with enhanced checks
   */
  getComprehensiveContext: async (query: string, options?: { isPreliminaryAssessment?: boolean, metadata?: any }) => {
    // Use the enhanced context service for comprehensive context
    return await enhancedContextService.getEnhancedContext(query, options);
  },

  /**
   * Format context for use in response generation
   */
  formatComprehensiveContext: (context: any): string => {
    return enhancedContextService.formatEnhancedContextForGrok(context);
  },

  /**
   * Validate response against comprehensive context
   */
  validateResponseAgainstComprehensiveContext: async (response: string, query: string, context: any) => {
    return await enhancedContextService.validateResponseAgainstEnhancedContext(response, query, context);
  }
};
