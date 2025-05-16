
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';
import { tokenManagementService } from '../modules/tokenManagementService';

/**
 * Core response generation functionality with improved CORS handling
 */
export const responseGeneratorCore = {
  /**
   * Make API call with proper error handling and retry logic
   */
  makeApiCall: async (requestBody: any, apiKey: string) => {
    try {
      console.log("Making primary API call with optimized parameters");
      
      const isRetryAttempt = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                            requestBody.messages.find(m => m.role === 'user').content.includes('[RETRY_ATTEMPT]');
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user')?.content || '';
      
      // Check for batch request to apply specialized token handling
      const isBatchRequest = typeof userMessage === 'string' && userMessage.includes('[CONTINUATION_PART_');
      let batchNumber = 1;
      
      if (isBatchRequest) {
        const match = userMessage.match(/\[CONTINUATION_PART_(\d+)\]/);
        if (match && match[1]) {
          batchNumber = parseInt(match[1], 10);
        }
      }
      
      // Get effective token limit based on context
      const effectiveTokenLimit = tokenManagementService.getTokenLimit({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage,
        isBatchRequest,
        batchNumber
      });
      
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
      } else if (!requestBody.max_tokens || requestBody.max_tokens < effectiveTokenLimit) {
        // This is the key fix: ensure we're using the higher token limits if none specified or lower than configured
        console.log(`Setting token limit to configured value: ${effectiveTokenLimit}`);
        requestBody.max_tokens = effectiveTokenLimit;
      }
      
      // Get optimal temperature based on context
      const temperature = tokenManagementService.getTemperature({
        queryType: requestBody.queryType || 'general',
        isRetryAttempt,
        prompt: userMessage,
        isBatchRequest,
        batchNumber
      });
      
      requestBody.temperature = temperature;
      
      // Add batch-specific flags to help with CORS and API endpoint selection
      if (isBatchRequest) {
        if (!requestBody.metadata) {
          requestBody.metadata = {};
        }
        requestBody.metadata.isBatchRequest = true;
        requestBody.metadata.batchNumber = batchNumber;
        
        // For batch continuations, we need to be even more careful with token limits
        if (batchNumber > 1 && batchNumber <= 5) {
          // Progressively increase token limit for later batches to ensure completion
          const batchMultiplier = 1 + (batchNumber * 0.1); // 1.1x for batch 1, 1.2x for batch 2, etc.
          const enhancedLimit = Math.floor(effectiveTokenLimit * batchMultiplier);
          console.log(`Applying batch multiplier ${batchMultiplier}x for batch ${batchNumber}, new limit: ${enhancedLimit}`);
          requestBody.max_tokens = enhancedLimit;
        } else if (batchNumber > 5) {
          // For very high batch numbers, use maximum available tokens
          requestBody.max_tokens = 30000; // Use maximum available
          console.log(`Using maximum token limit for high batch number ${batchNumber}`);
        }
        
        // Use lower temperature for later batches to reduce variability
        if (batchNumber > 1) {
          requestBody.temperature = Math.max(0.1, temperature * 0.8);
          console.log(`Reducing temperature to ${requestBody.temperature} for batch ${batchNumber}`);
        }
      }
      
      return await grokApiService.callChatCompletions(requestBody, apiKey);
    } catch (error) {
      console.error('Primary API call failed:', error);
      throw error;
    }
  },
  
  /**
   * Make backup API call with simplified parameters
   * Enhanced with more resilient configuration
   */
  makeBackupApiCall: async (prompt: string, queryType: string | null, apiKey: string) => {
    try {
      console.log('Attempting backup API call with simplified parameters');
      const isDefinitionQuery = prompt.toLowerCase().includes('what is') || 
                               prompt.toLowerCase().includes('definition');
      const systemPrompt = isDefinitionQuery 
        ? 'You are a financial regulatory expert specializing in Hong Kong listing rules. Provide comprehensive definitions with all relevant details from Chapter 14A for connected persons/transactions queries.'
        : 'You are a helpful assistant with knowledge of Hong Kong financial regulations.';
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.2,
        max_tokens: isDefinitionQuery ? 3000 : 1500
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);      
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 50)}` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 300
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
    text: string
  } => {
    // Define a token limit constant based on the tokenManagementService
    const DEFAULT_TOKEN_LIMIT = tokenManagementService.getTokenLimit({
      queryType: 'general',
      prompt: '',
      isRetryAttempt: false
    });
    
    // If token count is near limit, mark as truncated
    if (tokenCount > DEFAULT_TOKEN_LIMIT * 0.95) {
      console.log(`Response near token limit (${tokenCount}), marking as truncated`);
      const truncationMessage = "\n\n[NOTE: Response has been truncated due to token limit. This represents the analysis completed so far.]";
      return {
        truncated: true,
        text: responseText + truncationMessage
      };
    }
    // No truncation needed
    return {
      truncated: false,
      text: responseText
    };
  }
};
