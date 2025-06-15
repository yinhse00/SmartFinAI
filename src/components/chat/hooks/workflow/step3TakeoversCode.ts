
import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { queryIntelligenceService } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 3: Intelligent Takeovers Code Search
 * - Leverages Step 2's analysis when available
 * - Uses targeted database searches for takeovers-specific content
 * - Combines with Grok's specialized takeovers knowledge
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Takeovers Code information with enhanced intelligence...');
  
  try {
    let enhancedContext = '';
    let searchStrategy = 'grok_only';
    let databaseResultsCount = 0;
    let searchTime = 0;
    
    // Phase 1: Check if we can leverage existing search metadata from Step 2
    const hasStep2Analysis = params.searchMetadata?.queryAnalysis;
    let queryAnalysis = hasStep2Analysis ? params.searchMetadata.queryAnalysis : null;
    
    // Phase 2: If no existing analysis, perform new Grok 3 analysis for takeovers
    if (!queryAnalysis) {
      setStepProgress('Analyzing query for takeovers relevance...');
      queryAnalysis = await queryIntelligenceService.analyzeQuery(
        `Hong Kong Takeovers Code: ${params.query}`
      );
    }
    
    // Phase 3: Execute targeted takeovers database search if relevant
    if (queryAnalysis.categories.includes('takeovers') || 
        params.query.toLowerCase().includes('takeover') ||
        params.query.toLowerCase().includes('general offer')) {
      
      setStepProgress('Searching takeovers database...');
      
      // Focus on takeovers-specific tables
      const takeoversAnalysis = {
        ...queryAnalysis,
        relevantTables: ['takeovers_documents', 'takeovers_code_provisions', 'takeovers_timetable']
      };
      
      const searchResults = await searchIndexRoutingService.executeParallelSearches(
        `Takeovers Code: ${params.query}`,
        takeoversAnalysis
      );
      
      databaseResultsCount = searchResults.totalResults;
      searchTime = searchResults.executionTime;
      
      if (searchResults.totalResults > 0) {
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        enhancedContext = databaseContext;
        searchStrategy = 'database_primary';
      }
    }
    
    // Phase 4: Get Grok's specialized takeovers knowledge
    setStepProgress('Retrieving Takeovers Code expertise...');
    
    const grokResponse = await grokService.getRegulatoryContext(
      `Hong Kong Takeovers Code regarding: ${params.query}`,
      { metadata: { specializedQuery: 'takeovers', fastResponse: true } }
    );
    
    const takeoversCodeContext = safelyExtractText(grokResponse);
    
    // Phase 5: Combine database and Grok results intelligently
    if (enhancedContext && takeoversCodeContext) {
      enhancedContext = takeoversCodeContext + '\n\n' + enhancedContext;
      searchStrategy = 'hybrid_grok_database';
    } else if (takeoversCodeContext) {
      enhancedContext = takeoversCodeContext;
      searchStrategy = searchStrategy === 'database_primary' ? 'grok_primary' : 'grok_only';
    }
    
    const searchPositive = enhancedContext && enhancedContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found comprehensive Takeovers Code information');
      
      // Add previous context from Step 2 if available
      if (params.listingRulesContext) {
        enhancedContext = params.listingRulesContext + "\n\n--- Takeovers Code Context ---\n\n" + enhancedContext;
      }
      
      // Check for execution guidance needs
      const executionRequired = 
        params.query.toLowerCase().includes('process') ||
        params.query.toLowerCase().includes('how to') ||
        params.query.toLowerCase().includes('steps') ||
        params.query.toLowerCase().includes('procedure') ||
        queryAnalysis?.intent === 'process' ||
        queryAnalysis?.intent === 'timetable';
        
      if (executionRequired) {
        return {
          shouldContinue: true,
          nextStep: 'execution',
          query: params.query,
          takeoversCodeContext: enhancedContext,
          regulatoryContext: enhancedContext,
          executionRequired: true,
          skipSequentialSearches: Boolean(params.skipSequentialSearches),
          isRegulatoryRelated: true,
          searchMetadata: {
            searchStrategy,
            queryAnalysis,
            databaseResultsCount,
            searchTime
          }
        };
      }
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeContext: enhancedContext,
        regulatoryContext: enhancedContext,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy,
          queryAnalysis,
          databaseResultsCount,
          searchTime
        }
      };
    } else {
      // Move to response if no takeovers code content found
      setStepProgress('No specific Takeovers Code found');
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        takeoversCodeSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy: 'no_results',
          queryAnalysis,
          databaseResultsCount: 0,
          searchTime
        }
      };
    }
  } catch (error) {
    console.error('Error in enhanced step 3:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query: params.query,
      error,
      skipSequentialSearches: Boolean(params.skipSequentialSearches),
      isRegulatoryRelated: true,
      searchMetadata: {
        searchStrategy: 'error_fallback',
        searchTime: 0
      }
    };
  }
};
