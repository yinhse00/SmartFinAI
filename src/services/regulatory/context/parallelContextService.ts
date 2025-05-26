
import { contextSearchOrchestrator } from './contextSearchOrchestrator';
import { mappingSpreadsheetService } from '../mappingSpreadsheetService';
import { summaryIndexService } from '../../database/summaryIndexService';

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
          return { context: '', reasoning: 'Main search failed' };
        }),
        
        // Guidance materials lookup
        mappingSpreadsheetService.findRelevantGuidance(query, []).catch(err => {
          console.warn('Guidance lookup failed:', err);
          return { guidanceContext: '', sourceMaterials: [] };
        }),
        
        // Summary index search for quick hits
        summaryIndexService.findRelevantSummary(query).catch(err => {
          console.warn('Summary search failed:', err);
          return { found: false, content: '', sourceIds: [] };
        })
      ];
      
      // Wait for all parallel operations to complete
      const [mainContext, guidanceResult, summaryResult] = await Promise.all(contextPromises);
      
      // Combine results
      let combinedContext = mainContext.context || '';
      
      if (guidanceResult.guidanceContext && guidanceResult.guidanceContext !== "No specific guidance materials found.") {
        combinedContext += "\n\n--- Guidance Materials ---\n\n" + guidanceResult.guidanceContext;
      }
      
      if (summaryResult.found && summaryResult.content) {
        combinedContext += "\n\n--- Quick Reference ---\n\n" + summaryResult.content;
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`Parallel context retrieval completed in ${processingTime}ms`);
      
      return {
        context: combinedContext,
        reasoning: mainContext.reasoning || 'Parallel context retrieval',
        guidanceContext: guidanceResult.guidanceContext,
        sourceMaterials: guidanceResult.sourceMaterials || [],
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
