
import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { queryIntelligenceService } from '@/services/intelligence/queryIntelligenceService';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 3: Database-First Takeovers Code Search
 * - Prioritizes Supabase database results over Grok's AI knowledge
 * - Uses targeted database searches for takeovers-specific content
 * - Implements database-exclusive strategy for authoritative answers
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Takeovers Code information with database-first approach...');
  
  try {
    let enhancedContext = '';
    let searchStrategy = 'grok_only';
    let databaseResultsCount = 0;
    let searchTime = 0;
    let databaseHasHighConfidence = false;
    
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
      
      setStepProgress('Searching takeovers database with priority...');
      
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
        // Check for high-confidence database matches
        const hasSpecificMatches = searchResults.searchResults.some(result => 
          result.relevanceScore > 0.7 || 
          result.results.some(item => 
            item.reference_no || item.reference_nos ||
            item.title?.toLowerCase().includes('takeover') ||
            item.particulars?.toLowerCase().includes('general offer') ||
            item.particulars?.toLowerCase().includes(params.query.toLowerCase().slice(0, 20))
          )
        );
        
        if (hasSpecificMatches) {
          databaseHasHighConfidence = true;
          setStepProgress('Found authoritative takeovers database matches');
        }
        
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        enhancedContext = `--- TAKEOVERS CODE DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
        searchStrategy = databaseHasHighConfidence ? 'database_exclusive' : 'database_primary';
      }
    }
    
    // Phase 3: Conditional Grok Enhancement (only if not database-exclusive)
    if (!databaseHasHighConfidence) {
      setStepProgress('Enhancing with additional takeovers expertise...');
      
      const grokResponse = await grokService.getRegulatoryContext(
        `Hong Kong Takeovers Code regarding: ${params.query}`,
        { metadata: { specializedQuery: 'takeovers', fastResponse: true } }
      );
      
      const takeoversCodeContext = safelyExtractText(grokResponse);
      
      if (takeoversCodeContext && takeoversCodeContext.trim() !== '') {
        if (enhancedContext) {
          // Database results first, then complementary Grok content
          enhancedContext += '\n\n--- ADDITIONAL TAKEOVERS CONTEXT ---\n\n' + takeoversCodeContext;
          searchStrategy = 'database_primary';
        } else {
          enhancedContext = takeoversCodeContext;
          searchStrategy = 'grok_primary';
        }
      }
    } else {
      // Database-exclusive strategy - skip Grok to prevent conflicts
      console.log('Using database-exclusive strategy for takeovers - preventing potential conflicts');
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
