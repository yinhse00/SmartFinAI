
import { grokService } from '@/services/grokService';
import { Step3Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { aiSearchOrchestratorService } from '@/services/intelligence/aiSearchOrchestratorService';
import { QueryAnalysis, AiSearchStrategy } from '@/services/intelligence/queryIntelligenceService';
import { aiSearchStrategyToQueryAnalysis } from '@/services/intelligence/aiSearchStrategyConverter';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 3: AI-Driven Takeovers Code Search
 * - Uses AI to discover and prioritize database tables for takeovers content.
 * - Prioritizes database results with complete precedence.
 */
export const executeStep3 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step3Result> => {
  setStepProgress('Searching Takeovers Code with AI-driven approach...');

  try {
    let enhancedContext = '';
    let searchStrategy = 'no_results';
    let databaseResultsCount = 0;
    let searchTime = 0;
    let databaseHasContent = false;
    let queryAnalysis: QueryAnalysis | null = params.searchMetadata?.queryAnalysis || null;

    // Phase 1: Determine if a targeted takeovers search is needed.
    const isTakeoverQuery = (Array.isArray(queryAnalysis?.categories)
      && queryAnalysis?.categories.includes('takeovers')) ||
      params.query.toLowerCase().includes('takeover') ||
      params.query.toLowerCase().includes('general offer');

    if (isTakeoverQuery) {
      setStepProgress('Executing AI-driven search for takeovers content...');

      const searchResults = await aiSearchOrchestratorService.executeAiDrivenSearch(
        `Takeovers Code: ${params.query}`,
        'takeovers'
      );

      // Convert aiStrategy to QueryAnalysis if present
      if (searchResults.aiStrategy) {
        queryAnalysis = aiSearchStrategyToQueryAnalysis(searchResults.aiStrategy);
      }
      databaseResultsCount = searchResults.totalResults;
      searchTime = searchResults.executionTime;

      if (searchResults.totalResults > 0) {
        databaseHasContent = true;
        setStepProgress('Found authoritative takeovers database content');

        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        enhancedContext = `--- TAKEOVERS CODE DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
        searchStrategy = 'database_exclusive';

        console.log('Database-exclusive strategy activated for takeovers');
      }
    } else {
      console.log("Skipping dedicated takeovers search based on initial analysis.");
    }

    // Phase 2: Conditional Grok Enhancement (ONLY if no database content exists)
    if (!databaseHasContent && isTakeoverQuery) {
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
        (queryAnalysis as QueryAnalysis)?.intent === 'process' ||
        (queryAnalysis as QueryAnalysis)?.intent === 'timetable';

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
      setStepProgress('No authoritative Takeovers Code content found, continuing with previous context.');

      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        regulatoryContext: params.listingRulesContext, // Pass on context from step 2
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
    console.error('Error in AI-driven step 3:', error);
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
