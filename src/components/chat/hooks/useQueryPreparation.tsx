
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';
import { useQueryParameters } from './useQueryParameters';
import { useQueryBuilder } from './useQueryBuilder';

/**
 * Hook for preparing query parameters and prompts
 */
export const useQueryPreparation = () => {
  const { determineQueryParameters } = useQueryParameters();
  const { buildResponseParams } = useQueryBuilder();

  const prepareQuery = (queryText: string) => {
    // Check if this is a simple conversational query
    const isSimpleQuery = isSimpleConversationalQuery(queryText);
    console.log(`Query type: ${isSimpleQuery ? 'Conversational' : 'Financial/Regulatory'}`);
    
    // Enhanced detection for FAQ/continuing obligations queries
    const isFaqQuery = queryText.toLowerCase().includes('faq') || 
                      queryText.toLowerCase().includes('continuing obligation') ||
                      queryText.match(/\b10\.4\b/) ||
                      queryText.toLowerCase().includes('obligation') ||
                      queryText.toLowerCase().includes('requirements');
    
    // Get query parameters with optimized token settings
    const { financialQueryType, temperature, maxTokens } = determineQueryParameters(queryText);
    const enhancedMaxTokens = isSimpleQuery ? maxTokens * 1.5 : maxTokens * 2; // Reduced multiplier to avoid exceeding limits
    
    // Use much lower temperature for FAQ queries to ensure more literal information retrieval
    const actualTemperature = isFaqQuery ? 0.1 : temperature;
    
    // Build optimized response parameters
    const responseParams = buildResponseParams(
      queryText, 
      actualTemperature, 
      enhancedMaxTokens
    );
    
    // For FAQ queries, add explicit instructions to use exact wording
    if (isFaqQuery) {
      responseParams.prompt += " IMPORTANT: For questions related to FAQs or continuing obligations, you MUST use the EXACT wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract and quote the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document verbatim. If no exact match is found, explicitly state that.";
    }
    
    // IMPROVED INSTRUCTION: For all queries, emphasize database content priority
    responseParams.prompt += " CRITICAL: You MUST prioritize information from the regulatory database over your general knowledge. When regulatory guidance exists in the database, use it verbatim. If the database contains an answer to the question, quote it directly rather than generating your own response. Only use your general knowledge when the database has no relevant information.";
    
    return { 
      responseParams, 
      financialQueryType, 
      isSimpleQuery, 
      isFaqQuery,
      actualTemperature,
      enhancedMaxTokens
    };
  };
  
  return { prepareQuery };
};
