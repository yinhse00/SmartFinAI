import { grokService } from '@/services/grokService';
import { Step2Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { aiSearchOrchestratorService } from '@/services/intelligence/aiSearchOrchestratorService';
import { QueryAnalysis, AiSearchStrategy } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 2: AI-Driven Listing Rules Search
 * - Uses AI to discover and prioritize database tables for searching.
 * - Prioritizes database results with complete precedence.
 */
export const executeStep2 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step2Result> => {
  setStepProgress('Executing AI-driven database search...');
  
  try {
    // Phase 1 & 2: AI-driven discovery and search
    const searchResults = await aiSearchOrchestratorService.executeAiDrivenSearch(params.query, 'listing_rules');
    const aiStrategy = searchResults.aiStrategy;

    if(aiStrategy) {
      console.log('Step 2 - AI-driven query analysis:', aiStrategy);
    } else {
      console.log('Step 2 - AI-driven analysis not available, using fallback.');
    }
    
    // Convert AiSearchStrategy to QueryAnalysis if available
    const effectiveAnalysis: QueryAnalysis = aiStrategy ? {
      categories: aiStrategy.categories,
      intent: aiStrategy.intent,
      keywords: aiStrategy.keywords,
      relevantTables: aiStrategy.prioritizedTables,
      targetParty: 'both', // Defaulting as AI strategy doesn't determine this yet
      confidence: 0.9, // High confidence for AI-driven strategy
    } : {
      categories: ['general'],
      targetParty: 'both',
      intent: 'general',
      relevantTables: [],
      keywords: [],
      confidence: 0.5
    };

    // Phase 3: Database-First Context Processing with Complete Priority
    let enhancedContext = '';
    let searchStrategy = 'no_results';
    let databaseHasContent = false;
    
    if (searchResults.totalResults > 0) {
      // ANY database results means we use database-exclusive approach
      databaseHasContent = true;
      setStepProgress('Found authoritative database content - using database-exclusive strategy');
      
      // Format database results with clear source attribution
      const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
      enhancedContext = `--- HKEX DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
      searchStrategy = 'database_exclusive';
      
      setStepProgress(`Using ${searchResults.totalResults} authoritative database results exclusively`);
      
      console.log('Database-exclusive strategy activated - bypassing all hardcoded content');
    }
    
    // Phase 4: Conditional Grok Enhancement (ONLY if no database content exists)
    if (!databaseHasContent) {
      setStepProgress('No database content found - using supplementary regulatory context...');
      
      const grokResponse = await grokService.getRegulatoryContext(
        `HKEX Listing Rules regarding: ${params.query}`,
        { metadata: { fastResponse: true, searchStrategy: 'supplementary_only' } }
      );
      
      const grokContext = safelyExtractText(grokResponse);
      
      if (grokContext && grokContext.trim() !== '') {
        enhancedContext = grokContext;
        searchStrategy = 'grok_supplementary';
      }
    } else {
      // Database content found - completely skip Grok to maintain data integrity
      console.log('Database content available - maintaining database-exclusive approach');
    }
    
    // Phase 5: Handle empty results
    if (!enhancedContext || enhancedContext.trim() === '') {
      setStepProgress('No authoritative content found');
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        listingRulesSearchNegative: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy: 'no_results',
          queryAnalysis: effectiveAnalysis,
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
      effectiveAnalysis.intent === 'process' ||
      effectiveAnalysis.intent === 'timetable';
      
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
          queryAnalysis: effectiveAnalysis,
          databaseResultsCount: searchResults.totalResults,
          searchTime: searchResults.executionTime,
          databaseExclusive: databaseHasContent
        }
      };
    }
    
    // Phase 7: Check for takeover relevance
    const takeoverRelated = 
      enhancedContext.toLowerCase().includes('takeover') ||
      enhancedContext.toLowerCase().includes('general offer') ||
      effectiveAnalysis.categories.includes('takeovers');
    
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
          queryAnalysis: effectiveAnalysis,
          databaseResultsCount: searchResults.totalResults,
          searchTime: searchResults.executionTime,
          databaseExclusive: databaseHasContent
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
        queryAnalysis: effectiveAnalysis,
        databaseResultsCount: searchResults.totalResults,
        searchTime: searchResults.executionTime,
        databaseExclusive: databaseHasContent
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
