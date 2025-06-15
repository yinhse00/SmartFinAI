
import { grokService } from '@/services/grokService';
import { Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { queryIntelligenceService } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 2: Intelligent Listing Rules Search using Grok 3 + Database
 * - Uses Grok 3 for query analysis and categorization
 * - Leverages search_index table for parallel database searches
 * - Combines AI knowledge with structured regulatory data
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Analyzing query with Grok 3 intelligence...');
  
  try {
    // Phase 1: Grok 3 Query Analysis
    const queryAnalysis = await queryIntelligenceService.analyzeQuery(params.query);
    console.log('Step 2 - Query analysis:', queryAnalysis);
    
    setStepProgress('Executing parallel database searches...');
    
    // Phase 2: Parallel Database Searches
    const searchResults = await searchIndexRoutingService.executeParallelSearches(
      params.query, 
      queryAnalysis
    );
    
    setStepProgress('Combining AI knowledge with database results...');
    
    // Phase 3: Get Grok's regulatory context
    const grokResponse = await grokService.getRegulatoryContext(
      `HKEX Listing Rules regarding: ${params.query}`,
      { metadata: { fastResponse: true, searchStrategy: 'enhanced_hybrid' } }
    );
    
    const grokContext = safelyExtractText(grokResponse);
    
    // Phase 4: Combine results intelligently
    let enhancedContext = '';
    let searchStrategy = 'grok_only';
    
    if (searchResults.totalResults > 0) {
      // Format database results
      const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
      
      // Combine Grok knowledge with database results
      if (grokContext && grokContext.trim() !== '') {
        enhancedContext = grokContext + '\n\n' + databaseContext;
        searchStrategy = 'hybrid_grok_database';
      } else {
        enhancedContext = databaseContext;
        searchStrategy = 'database_primary';
      }
      
      setStepProgress(`Found comprehensive results from ${searchResults.searchResults.length} data sources`);
    } else if (grokContext && grokContext.trim() !== '') {
      enhancedContext = grokContext;
      searchStrategy = 'grok_primary';
      setStepProgress('Found relevant Listing Rules from AI knowledge');
    } else {
      setStepProgress('No specific Listing Rules found');
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy,
          queryAnalysis,
          databaseResultsCount: 0,
          searchTime: searchResults.executionTime
        }
      };
    }
    
    // Check for execution guidance needs
    const executionRequired = 
      params.query.toLowerCase().includes('process') ||
      params.query.toLowerCase().includes('how to') ||
      params.query.toLowerCase().includes('steps') ||
      params.query.toLowerCase().includes('procedure') ||
      params.query.toLowerCase().includes('timeline') ||
      queryAnalysis.intent === 'process' ||
      queryAnalysis.intent === 'timetable';
      
    if (executionRequired) {
      return {
        shouldContinue: true,
        nextStep: 'execution',
        query: params.query,
        listingRulesContext: enhancedContext,
        executionRequired: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy,
          queryAnalysis,
          databaseResultsCount: searchResults.totalResults,
          searchTime: searchResults.executionTime
        }
      };
    }
    
    // Check for takeover relevance
    const takeoverRelated = 
      enhancedContext.toLowerCase().includes('takeover') ||
      enhancedContext.toLowerCase().includes('general offer') ||
      queryAnalysis.categories.includes('takeovers');
    
    if (takeoverRelated) {
      return {
        shouldContinue: true,
        nextStep: 'takeoversCode',
        query: params.query,
        listingRulesContext: enhancedContext,
        takeoversCodeRelated: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy,
          queryAnalysis,
          databaseResultsCount: searchResults.totalResults,
          searchTime: searchResults.executionTime
        }
      };
    }
    
    // Standard response path with enhanced context
    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      listingRulesContext: enhancedContext,
      regulatoryContext: enhancedContext,
      executionRequired: false,
      skipSequentialSearches: Boolean(params.skipSequentialSearches),
      isRegulatoryRelated: true,
      searchMetadata: {
        searchStrategy,
        queryAnalysis,
        databaseResultsCount: searchResults.totalResults,
        searchTime: searchResults.executionTime
      }
    };
    
  } catch (error) {
    console.error('Error in enhanced step 2:', error);
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
