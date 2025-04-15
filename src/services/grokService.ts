
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { databaseService } from './databaseService';
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';
import { contextService } from './regulatory/contextService';
import { grokApiService } from './api/grokApiService';
import { documentGenerationService } from './documents/documentGenerationService';
import { translationService } from './translation/translationService';
import { isTradingArrangementComplete } from '@/utils/truncationUtils';
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { FINANCIAL_EXPERTISES } from './constants/financialConstants';
import { RIGHTS_ISSUE_TIMETABLE_FALLBACK } from './constants/fallbackConstants';

// Import refactored modules
import { detectFinancialExpertiseArea, isTradingArrangementQuery, determineTradingArrangementType } from './financial/expertiseDetection';
import { createFinancialExpertSystemPrompt } from './financial/systemPrompts';
import { getFallbackTradingArrangement, isWellFormattedTimetable } from './financial/tradingArrangements';
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from './financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';

export const grokService = {
  /**
   * Check if a Grok API key is set
   */
  hasApiKey: (): boolean => {
    return hasGrokApiKey();
  },

  /**
   * Fetch relevant regulatory information for context
   */
  getRegulatoryContext: contextService.getRegulatoryContext,
  
  /**
   * Enhanced professional financial response generation with advanced context handling
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // Enhanced logging for professional financial expertise
      console.group('Hong Kong Financial Expert Response Generation');
      console.log('Input Query:', params.prompt);

      // Detect specific query types for specialized financial handling
      const queryType = detectFinancialExpertiseArea(params.prompt);
      console.log('Detected Financial Expertise Area:', queryType);

      // Retrieve context with enhanced financial reasoning
      const { context, reasoning } = await contextService.getRegulatoryContextWithReasoning(params.prompt);
      console.log('Financial Context Reasoning:', reasoning);

      // Check for Trading Arrangement documents
      const hasTradeArrangementInfo = context && 
        (context.toLowerCase().includes('trading arrangement') || 
         context.includes('Trading Arrangements.pdf'));
      
      // Special handling for trading arrangement related queries
      const isTradingArrangement = isTradingArrangementQuery(params.prompt);
      if (isTradingArrangement) {
        console.log('Query involves trading arrangements, applying specialized handling');
        console.log('Context contains Trading Arrangement information:', hasTradeArrangementInfo ? 'Yes' : 'No');
        
        // If this is a trading arrangement query but we don't have the Trading Arrangement document,
        // attempt to find it specifically
        if (!hasTradeArrangementInfo) {
          console.log('Attempting to find Trading Arrangement document specifically');
          const tradingDocs = await databaseService.searchByTitle("Trading Arrangements");
          
          if (tradingDocs.length > 0) {
            console.log('Found Trading Arrangement document, adding to context');
            // Add the trading arrangement document to the context
            const additionalContext = tradingDocs
              .map(doc => `[${doc.title} | ${doc.source}]:\n${doc.content}`)
              .join('\n\n---\n\n');
            
            if (context) {
              params.regulatoryContext = additionalContext + '\n\n---\n\n' + context;
            } else {
              params.regulatoryContext = additionalContext;
            }
          }
        }
      }

      // Create a professional financial system message based on expertise area
      const systemMessage = createFinancialExpertSystemPrompt(queryType, context);
      console.log('Using specialized financial expert prompt');

      // Dynamic temperature and token settings based on query complexity and our enhanced parameterUtils
      const useFineGrainedSettings = needsEnhancedTokenSettings(queryType, params.prompt);
      const temperature = useFineGrainedSettings ? 
        getOptimalTemperature(queryType, params.prompt) :
        determineOptimalTemperature(queryType, params.prompt);
      
      const maxTokens = useFineGrainedSettings ?
        getOptimalTokens(queryType, params.prompt) :
        determineOptimalTokens(queryType, params.prompt);
      
      console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Using Enhanced Settings: ${useFineGrainedSettings}`);

      // Prepare request body with enhanced instructions for trading arrangements
      const requestBody = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: temperature,
        max_tokens: maxTokens,
      };

      // Make API call with professional financial expertise configuration
      const response = await grokApiService.callChatCompletions(requestBody);
      
      // Process the response
      const responseText = response.choices[0].message.content;
      
      // Handle special cases for financial arrangements if response quality is insufficient
      let finalResponse = responseText;
      
      // Check for trading arrangement queries that need specialized handling
      if (isTradingArrangementQuery(params.prompt)) {
        const tradingArrangementType = determineTradingArrangementType(params.prompt);
        
        if (tradingArrangementType && 
            !isTradingArrangementComplete(responseText, tradingArrangementType)) {
          console.log(`Using fallback trading arrangement for ${tradingArrangementType}`);
          finalResponse = getFallbackTradingArrangement(tradingArrangementType, params.prompt);
        }
      }
      // Rights issue timetable special case
      else if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && 
          params.prompt.toLowerCase().includes('timetable') &&
          !isWellFormattedTimetable(responseText)) {
        console.log('Using fallback professional timetable format for rights issue');
        finalResponse = RIGHTS_ISSUE_TIMETABLE_FALLBACK;
      }

      console.groupEnd();

      return {
        text: finalResponse,
        queryType: queryType,
        metadata: {
          contextUsed: !!context,
          relevanceScore: evaluateResponseRelevance(finalResponse, params.prompt, queryType),
          tradingArrangementInfoUsed: hasTradeArrangementInfo
        }
      };

    } catch (error) {
      console.error('Hong Kong Financial Expert Response Error:', error);
      console.groupEnd();

      return generateFallbackResponse(params.prompt, error);
    }
  },

  /**
   * Translate content using Grok AI
   */
  translateContent: translationService.translateContent,
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: documentGenerationService.generateWordDocument,

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: documentGenerationService.generatePdfDocument,

  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: documentGenerationService.generateExcelDocument
};
