
import { contextSearchOrchestrator } from './contextSearchOrchestrator';
import { mappingSpreadsheetService } from '../mappingSpreadsheetService';
import { summaryIndexService } from '../../database/summaryIndexService';

interface ContextResult {
  context: string;
  reasoning: string;
}

interface GuidanceResult {
  guidanceContext: string;
  sourceMaterials: any[];
}

interface SummaryResult {
  found: boolean;
  content: string;
  sourceIds: string[];
}

/**
 * Service for parallel context retrieval to improve performance
 */
export const parallelContextService = {
  /**
   * Retrieve all context types in parallel for faster processing
   */
  getContextInParallel: async (query: string, options: any = {}) => {
    const startTime = Date.now();
    
    try {
      // Start all context retrievals in parallel
      const contextPromises = [
        // Main regulatory context search
        contextSearchOrchestrator.executeComprehensiveSearch(query).catch(err => {
          console.warn('Main context search failed:', err);
          return { context: '', reasoning: 'Main search failed' } as ContextResult;
        }),
        
        // Guidance materials lookup
        mappingSpreadsheetService.findRelevantGuidance(query, []).catch(err => {
          console.warn('Guidance lookup failed:', err);
          return { guidanceContext: '', sourceMaterials: [] } as GuidanceResult;
        }),
        
        // Summary index search for quick hits
        summaryIndexService.findRelevantSummary(query).catch(err => {
          console.warn('Summary search failed:', err);
          return { found: false, content: '', sourceIds: [] } as SummaryResult;
        })
      ];
      
      // Wait for all parallel operations to complete
      const [mainContext, guidanceResult, summaryResult] = await Promise.all(contextPromises);
      
      // Type-safe property access
      const mainContextTyped = mainContext as ContextResult;
      const guidanceResultTyped = guidanceResult as GuidanceResult;
      const summaryResultTyped = summaryResult as SummaryResult;
      
      // Combine results
      let combinedContext = mainContextTyped.context || '';
      
      if (guidanceResultTyped.guidanceContext && guidanceResultTyped.guidanceContext !== "No specific guidance materials found.") {
        combinedContext += "\n\n--- Guidance Materials ---\n\n" + guidanceResultTyped.guidanceContext;
      }
      
      if (summaryResultTyped.found && summaryResultTyped.content) {
        combinedContext += "\n\n--- Quick Reference ---\n\n" + summaryResultTyped.content;
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`Parallel context retrieval completed in ${processingTime}ms`);
      
      return {
        context: combinedContext,
        reasoning: mainContextTyped.reasoning || 'Parallel context retrieval',
        guidanceContext: guidanceResultTyped.guidanceContext,
        sourceMaterials: guidanceResultTyped.sourceMaterials || [],
        processingTime,
        usedParallelProcessing: true
      };
      
    } catch (error) {
      console.error('Error in parallel context retrieval:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        context: '',
        reasoning: 'Parallel context retrieval failed',
        guidanceContext: '',
        sourceMaterials: [],
        processingTime,
        usedParallelProcessing: false
      };
    }
  }
};
