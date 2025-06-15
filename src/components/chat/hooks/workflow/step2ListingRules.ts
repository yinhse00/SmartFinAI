
import { grokService } from '@/services/grokService';
import { Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { queryIntelligenceService } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 2: Database-First Listing Rules Search using Grok 3 + Database
 * - Prioritizes Supabase database results over Grok's AI knowledge
 * - Uses database-exclusive strategy when high-confidence matches found
 * - Implements conflict detection and source attribution
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Analyzing query with Grok 3 intelligence...');
  
  try {
    // Phase 1: Grok 3 Query Analysis
    const queryAnalysis = await queryIntelligenceService.analyzeQuery(params.query);
    console.log('Step 2 - Query analysis:', queryAnalysis);
    
    setStepProgress('Executing parallel database searches...');
    
    // Phase 2: Parallel Database Searches (Priority Search)
    const searchResults = await searchIndexRoutingService.executeParallelSearches(
      params.query, 
      queryAnalysis
    );
    
    // Phase 3: Database-First Context Processing
    let enhancedContext = '';
    let searchStrategy = 'grok_only';
    let databaseHasHighConfidence = false;
    
    if (searchResults.totalResults > 0) {
      // Check for high-confidence database matches
      const hasSpecificMatches = searchResults.searchResults.some(result => 
        result.relevanceScore > 0.7 || 
        result.results.some(item => 
          item.reference_no || item.reference_nos || item.faqtopic || 
          item.title?.toLowerCase().includes('faq') ||
          item.particulars?.toLowerCase().includes(params.query.toLowerCase().slice(0, 20))
        )
      );
      
      if (hasSpecificMatches) {
        databaseHasHighConfidence = true;
        setStepProgress('Found authoritative database matches - using database-exclusive strategy');
      }
      
      // Format database results with clear source attribution
      const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
      enhancedContext = `--- HKEX DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
      searchStrategy = databaseHasHighConfidence ? 'database_exclusive' : 'database_primary';
      
      setStepProgress(`Found ${searchResults.totalResults} authoritative database results`);
    }
    
    // Phase 4: Conditional Grok Enhancement (only if not database-exclusive)
    if (!databaseHasHighConfidence) {
      setStepProgress('Enhancing with additional regulatory context...');
      
      const grokResponse = await grokService.getRegulatoryContext(
        `HKEX Listing Rules regarding: ${params.query}`,
        { metadata: { fastResponse: true, searchStrategy: 'database_supplementary' } }
      );
      
      const grokContext = safelyExtractText(grokResponse);
      
      if (grokContext && grokContext.trim() !== '') {
        if (enhancedContext) {
          // Database results first, then complementary Grok content
          enhancedContext += '\n\n--- ADDITIONAL REGULATORY CONTEXT ---\n\n' + grokContext;
          searchStrategy = 'database_primary';
        } else {
          enhancedContext = grokContext;
          searchStrategy = 'grok_primary';
        }
      }
    } else {
      // Database-exclusive strategy - skip Grok to prevent conflicts
      console.log('Using database-exclusive strategy - skipping Grok enhancement to prevent conflicts');
    }
    
    // Phase 5: Handle empty results
    if (!enhancedContext || enhancedContext.trim() === '') {
      setStepProgress('No specific Listing Rules found');
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy: 'no_results',
          queryAnalysis,
          databaseResultsCount: 0,
          searchTime: searchResults.executionTime
        }
      };
    }
    
    // Phase 6: Process execution requirements
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
    
    // Phase 7: Check for takeover relevance
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
    
    // Phase 8: Standard response with database-first context
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
    console.error('Error in database-first step 2:', error);
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
