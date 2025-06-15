

import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { queryIntelligenceService } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 3: Pure Database-First Takeovers Code Search
 * - Prioritizes Supabase database results with complete precedence
 * - Uses database-exclusive strategy when any database content found
 * - Eliminates hardcoded content interference
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Takeovers Code with pure database-first approach...');
  
  try {
    let enhancedContext = '';
    let searchStrategy = 'no_results';
    let databaseResultsCount = 0;
    let searchTime = 0;
    let databaseHasContent = false;
    
    // Phase 1: Leverage existing analysis or create new one
    const hasStep2Analysis = params.searchMetadata?.queryAnalysis;
    let queryAnalysis = hasStep2Analysis ? params.searchMetadata.queryAnalysis : null;
    
    if (!queryAnalysis) {
      setStepProgress('Analyzing query for takeovers relevance...');
      queryAnalysis = await queryIntelligenceService.analyzeQuery(
        `Hong Kong Takeovers Code: ${params.query}`
      );
    }
    
    // Phase 2: Execute targeted takeovers database search
    if (queryAnalysis.categories.includes('takeovers') || 
        params.query.toLowerCase().includes('takeover') ||
        params.query.toLowerCase().includes('general offer')) {
      
      setStepProgress('Searching takeovers database with complete priority...');
      
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
        // ANY database results means database-exclusive approach
        databaseHasContent = true;
        setStepProgress('Found authoritative takeovers database content');
        
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        enhancedContext = `--- TAKEOVERS CODE DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
        searchStrategy = 'database_exclusive';
        
        console.log('Database-exclusive strategy activated for takeovers - bypassing all hardcoded content');
      }
    }
    
    // Phase 3: Conditional Grok Enhancement (ONLY if no database content exists)
    if (!databaseHasContent) {
      setStepProgress('No database content found - using supplementary takeovers context...');
      
      const grokResponse = await grokService.getRegulatoryContext(
        `Hong Kong Takeovers Code regarding: ${params.query}`,
        { metadata: { specializedQuery: 'takeovers', fastResponse: true, supplementaryOnly: true } }
      );
      
      const takeoversCodeContext = safelyExtractText(grokResponse);
      
      if (takeoversCodeContext && takeoversCodeContext.trim() !== '') {
        enhancedContext = takeoversCodeContext;
        searchStrategy = 'grok_supplementary';
      }
    } else {
      // Database content found - maintain database-exclusive approach
      console.log('Database content available - maintaining database-exclusive approach for takeovers');
    }
    
    const searchPositive = enhancedContext && enhancedContext.trim() !== '';
    
    if (searchPositive) {
      setStepProgress('Found comprehensive Takeovers Code information');
      
      // Add previous context from Step 2 if available (database context first)
      if (params.listingRulesContext) {
        enhancedContext = params.listingRulesContext + "\n\n--- TAKEOVERS CODE CONTEXT ---\n\n" + enhancedContext;
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
            searchTime,
            databaseExclusive: databaseHasContent
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
          searchTime,
          databaseExclusive: databaseHasContent
        }
      };
    } else {
      setStepProgress('No authoritative Takeovers Code content found');
      
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
    console.error('Error in database-first step 3:', error);
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

