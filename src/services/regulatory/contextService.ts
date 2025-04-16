
import { contextServiceCore } from './context/contextServiceCore';
import { comprehensiveContextService } from './context/comprehensiveContextService';
import { enhancedContextService } from './context/enhancedContextService';

/**
 * Financial regulatory context service - specialized for Hong Kong corporate finance
 */
export const contextService = {
  /**
   * Comprehensive database search that ensures all relevant sources are consulted
   * This is the primary method for ensuring thorough database verification before answering
   */
  getComprehensiveRegulatoryContext: comprehensiveContextService.getComprehensiveRegulatoryContext,

  /**
   * Enhanced regulatory context retrieval with specialized financial semantic search
   */
  getRegulatoryContextWithReasoning: enhancedContextService.getRegulatoryContextWithReasoning,

  /**
   * Get regulatory context for a given financial query (simplified version)
   */
  getRegulatoryContext: contextServiceCore.getRegulatoryContext
};
