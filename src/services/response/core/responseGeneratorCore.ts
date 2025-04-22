
import { grokApiService } from '../../api/grokApiService';
import { generateFallbackResponse } from '../../fallbackResponseService';
import { responseEnhancer } from '../modules/responseEnhancer';

// Set appropriate maximum token limit for Grok API for better coverage
const MAX_TOKEN_LIMIT = 4000; // Increased from 3500 for more comprehensive responses
const RETRY_TOKEN_LIMIT = 7000; // Even higher limit for retry attempts

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
      
      // Detect if this is a retry attempt based on prompt content
      const isRetryAttempt = typeof requestBody.messages?.find?.(m => m.role === 'user')?.content === 'string' &&
                            requestBody.messages.find(m => m.role === 'user').content.includes('[RETRY_ATTEMPT]');
      
      // Special handling for definition queries to ensure completeness
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user')?.content || '';
      const isDefinitionQuery = userMessage.toLowerCase().includes('what is') || 
                               userMessage.toLowerCase().includes('definition');
      
      // Check for rights issue timetable queries
      const isRightsIssueQuery = userMessage.toLowerCase().includes('rights issue') &&
                               (userMessage.toLowerCase().includes('timetable') ||
                                userMessage.toLowerCase().includes('schedule') ||
                                userMessage.toLowerCase().includes('dates'));
      
      // Allow higher token limits for specific query types
      let effectiveTokenLimit = MAX_TOKEN_LIMIT;
      
      // Use different token limits for different query types
      if (isRetryAttempt) {
        effectiveTokenLimit = RETRY_TOKEN_LIMIT;
        console.log("Retry attempt detected, using enhanced token limit:", effectiveTokenLimit);
      } else if (isDefinitionQuery) {
        effectiveTokenLimit = Math.max(MAX_TOKEN_LIMIT, 5000);
      } else if (isRightsIssueQuery) {
        effectiveTokenLimit = Math.max(MAX_TOKEN_LIMIT, 6000);
        console.log("Rights issue timetable query detected, using enhanced token limit:", effectiveTokenLimit);
      }
      
      // Enforce appropriate token limit based on query type
      if (requestBody.max_tokens && requestBody.max_tokens > effectiveTokenLimit) {
        console.log(`Requested ${requestBody.max_tokens} tokens exceeds safe limit of ${effectiveTokenLimit}, capping at limit`);
        requestBody.max_tokens = effectiveTokenLimit;
      }
      
      // For connected person queries, ensure we have sufficient tokens
      if (userMessage.toLowerCase().includes('connected person') || 
         userMessage.toLowerCase().includes('connected transaction')) {
        console.log("Connected person/transaction query detected, ensuring sufficient tokens");
        requestBody.max_tokens = Math.max(requestBody.max_tokens, 4500);
      }
      
      // For retry attempts, use lower temperature for more deterministic results
      if (isRetryAttempt && requestBody.temperature > 0.2) {
        console.log("Retry attempt detected, reducing temperature for consistency");
        requestBody.temperature = 0.1;
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
      
      // Check for definition queries
      const isDefinitionQuery = prompt.toLowerCase().includes('what is') || 
                               prompt.toLowerCase().includes('definition');
      
      // For definition queries, use more specialized system prompt
      const systemPrompt = isDefinitionQuery 
        ? 'You are a financial regulatory expert specializing in Hong Kong listing rules. Provide comprehensive definitions with all relevant details from Chapter 14A for connected persons/transactions queries.'
        : 'You are a helpful assistant with knowledge of Hong Kong financial regulations.';
      
      // Use a much simpler system prompt and model configuration for better reliability
      const backupRequestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: 0.2,  // Lower temperature for more predictable responses
        max_tokens: isDefinitionQuery ? 3000 : 1500  // Higher limit for definitions
      };
      
      // Add a short delay before the retry to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try a second backup with even more simplified parameters if the first backup fails
      try {
        return await grokApiService.callChatCompletions(backupRequestBody, apiKey);
      } catch (firstBackupError) {
        console.error('First backup API call failed, trying ultra-simplified backup:', firstBackupError);
        
        // Wait longer before the second attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ultra-simplified request with minimal parameters
        const ultraSimplifiedRequest = {
          messages: [
            { role: 'user', content: `Briefly summarize: ${prompt.substring(0, 50)}` }
          ],
          model: "grok-3-mini-beta",
          temperature: 0.1,
          max_tokens: 300
        };
        
        // Final attempt
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
    // If token count is near limit, mark as truncated
    if (tokenCount > MAX_TOKEN_LIMIT * 0.95) {
      console.log(`Response near token limit (${tokenCount}), marking as truncated`);
      
      // Truncate response if it's too long
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
