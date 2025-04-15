
import { GrokRequestParams, GrokResponse } from '@/types/grok';
import { contextService } from '../regulatory/contextService';
import { grokApiService } from '../api/grokApiService';
import { createFinancialExpertSystemPrompt } from '../financial/systemPrompts';
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';
import { detectFinancialExpertiseArea, isTradingArrangementQuery, determineTradingArrangementType } from '../financial/expertiseDetection';
import { getFallbackTradingArrangement, isWellFormattedTimetable } from '../financial/tradingArrangements';
import { generateFallbackResponse } from '../fallbackResponseService';
import { isTradingArrangementComplete } from '@/utils/truncationUtils';
import { FINANCIAL_EXPERTISES } from '../constants/financialConstants';
import { RIGHTS_ISSUE_TIMETABLE_FALLBACK } from '../constants/fallbackConstants';
import { databaseService } from '../databaseService';

/**
 * Service for generating responses using Grok AI with financial expertise
 */
export const grokResponseGenerator = {
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
      
      // Check for whitewash waiver specific queries
      const isWhitewashQuery = params.prompt.toLowerCase().includes('whitewash') ||
        (params.prompt.toLowerCase().includes('waiver') && params.prompt.toLowerCase().includes('general offer'));
      
      // Check for takeovers code document
      const hasTakeoversCode = context && 
        (context.toLowerCase().includes('codes on takeovers and mergers') ||
         context.toLowerCase().includes('takeovers code'));
      
      // If this is a whitewash query but we don't have the takeovers code or whitewash info in context
      if (isWhitewashQuery && !context?.toLowerCase().includes('whitewash')) {
        console.log('Query involves whitewash waiver, but context lacks specific information, searching for it');
        
        const whitewashDocs = await databaseService.search("whitewash waiver dealing requirements", "takeovers");
        
        if (whitewashDocs.length > 0) {
          console.log('Found whitewash waiver documents, adding to context');
          const additionalContext = whitewashDocs
            .map(doc => `[${doc.title} | ${doc.source}]:\n${doc.content}`)
            .join('\n\n---\n\n');
          
          if (context) {
            params.regulatoryContext = additionalContext + '\n\n---\n\n' + context;
          } else {
            params.regulatoryContext = additionalContext;
          }
        } else {
          // If no whitewash docs found, add fallback info
          const whitewashFallback = `[Whitewash Waiver Dealing Requirements | Takeovers Code Note 1 to Rule 32]:
When a waiver from a mandatory general offer obligation under Rule 26 is granted (whitewash waiver), neither the potential controlling shareholders nor any person acting in concert with them may deal in the securities of the company during the period between the announcement of the proposals and the completion of the subscription. The Executive will not normally waive an obligation under Rule 26 if the potential controlling shareholders or their concert parties have acquired voting rights in the company in the 6 months prior to the announcement of the proposals but subsequent to negotiations with the directors of the company.`;
          
          if (context) {
            params.regulatoryContext = whitewashFallback + '\n\n---\n\n' + context;
          } else {
            params.regulatoryContext = whitewashFallback;
          }
        }
      }
         
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
          tradingArrangementInfoUsed: hasTradeArrangementInfo,
          takeoversCodeUsed: hasTakeoversCode,
          whitewashInfoIncluded: isWhitewashQuery && 
            (finalResponse.toLowerCase().includes('whitewash') && 
             finalResponse.toLowerCase().includes('dealing'))
        }
      };

    } catch (error) {
      console.error('Hong Kong Financial Expert Response Error:', error);
      console.groupEnd();

      return generateFallbackResponse(params.prompt, error);
    }
  },
};
