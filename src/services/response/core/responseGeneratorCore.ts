
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with optimized parameters");
      
      // Extract user message to check for retry attempts
      const isRetryAttempt = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                            requestBody.messages.find(m => m.role === 'user').content.includes('[RETRY_ATTEMPT]');
      
      const userMessage = requestBody.messages?.find((m: any) => m.role === 'user')?.content || '';
      
      // Get token limit based on query context from centralized service
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage,
        retryCount: isRetryAttempt ? parseInt(userMessage.match(/\[RETRY_ATTEMPT (\d+)\]/)?.[1] || '0') : 0
      });
      
      // Apply token limit changes if needed - prioritize the higher limit
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
      } else if (!requestBody.max_tokens || requestBody.max_tokens < effectiveTokenLimit) {
        console.log(`Setting token limit to configured value: ${effectiveTokenLimit}`);
        requestBody.max_tokens = effectiveTokenLimit;
      }
      
      // Get temperature based on query context from centralized service
      const temperature = tokenManagementService.getTemperature({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage
      });
      
      // Apply temperature setting
      requestBody.temperature = temperature;
      
      // Execute API call with enhanced parameters
      console.log(`API call parameters: max_tokens=${requestBody.max_tokens}, temperature=${temperature}`);
      return await grokApiService.callChatCompletions(requestBody, apiKey);
    } catch (error) {
      console.error('Primary API call failed:', error);
      
      // Enhanced error logging with structured details
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestModel: requestBody?.model || 'unknown',
        tokenLimit: requestBody?.max_tokens || 'not specified'
      };
      
      console.error('Error details:', JSON.stringify(errorDetails));
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   * Enhanced with more resilient configuration and progressive fallbacks
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      
      // Determine optimal system prompt based on query type
      const isDefinitionQuery = prompt.toLowerCase().includes('what is') || 
                               prompt.toLowerCase().includes('definition');
      
      const systemPrompt = isDefinitionQuery 
        ? 'You are a financial regulatory expert specializing in Hong Kong listing rules. Provide comprehensive definitions with all relevant details from Chapter 14A for connected persons/transactions queries.'
        : 'You are a helpful assistant with knowledge of Hong Kong financial regulations.';
      
      // Get token limit from centralized service for backup call
      const backupTokenLimit = tokenManagementService.getTokenLimit({
        queryType: queryType || 'general',
        prompt,
        isSimpleQuery: true
      });
      
      // Build backup request with optimized parameters
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.2,
        max_tokens: Math.min(backupTokenLimit, 4000) // Cap at 4000 for reliability
      };
      
      // Add small delay before retry to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);      
        
        // Add longer delay before final attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create minimal request for ultra-simplified final attempt
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 100)}...` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 500
        };
        
        return await grokApiService.callChatCompletions(ultraSimplifiedRequest, apiKey);
      }
    } catch (backupError) {
      console.error('All backup API calls failed:', backupError);
      throw backupError;
    }
  },
  
  /**
   * Check if response needs to be truncated due to token limits
   * Returns a message to be appended to the response if truncation occurred
   */
  checkAndHandleTokenLimit: (responseText: string, tokenCount: number): {
    truncated: boolean,
    text: string,
    diagnostics?: {
      tokenCount: number,
      tokenLimit: number,
      percentageUsed: number
    }
  } => {
    // Define token limit from centralized service
    const DEFAULT_TOKEN_LIMIT = tokenManagementService.getTokenLimit({
      queryType: 'general',
      prompt: '',
      isRetryAttempt: false
    });
    
    // Calculate percentage of token limit used
    const percentageUsed = (tokenCount / DEFAULT_TOKEN_LIMIT) * 100;
    
    // If token count is near limit, mark as truncated
    if (percentageUsed > 92) {
      console.log(`Response near token limit (${tokenCount}/${DEFAULT_TOKEN_LIMIT}, ${percentageUsed.toFixed(1)}%), marking as truncated`);
      
      // Create customized truncation message with percentage info
      const truncationMessage = `\n\n[NOTE: Response has been truncated due to token limit (${Math.round(percentageUsed)}% of available tokens used). This represents the analysis completed so far.]`;
      
      return {
        truncated: true,
        text: responseText + truncationMessage,
        diagnostics: {
          tokenCount,
          tokenLimit: DEFAULT_TOKEN_LIMIT,
          percentageUsed
        }
      };
    }
    
    // No truncation needed
    return {
      truncated: false,
      text: responseText,
      diagnostics: {
        tokenCount,
        tokenLimit: DEFAULT_TOKEN_LIMIT,
        percentageUsed
      }
    };
  }
};
