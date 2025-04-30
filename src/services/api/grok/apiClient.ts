
/**
 * Core API client functionality with improved error handling and timeouts
 */
import { getGrokApiKey } from '../../apiKeyService';
import { LOCAL_PROXY } from './modules/endpointManager';
import { toast } from '@/components/ui/use-toast';

interface ApiClientConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const defaultConfig: ApiClientConfig = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000 // 30 second default timeout
};

export const apiClient = {
  /**
   * Call the chat completions API with enhanced retry logic and timeout handling
   */
  callChatCompletions: async (requestBody: any, apiKey?: string, config?: Partial<ApiClientConfig>): Promise<any> => {
    const { maxRetries, retryDelay, timeout } = { ...defaultConfig, ...config };
    const key = apiKey || getGrokApiKey();
    
    if (!key) {
      console.error('No API key provided');
      throw new Error('No API key provided');
    }

    let lastError = null;
    const callStart = performance.now();
    
    // Handle request timeout from requestBody if specified
    const effectiveTimeout = requestBody.timeout || timeout;
    
    // Track attempts for telemetry
    const attemptTimings: number[] = [];
    
    // Try with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const attemptStart = performance.now();
      
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for API call (after ${Math.round(performance.now() - callStart)}ms)`);
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
        }

        // Add special handling for document processing
        if (requestBody.model?.includes('vision')) {
          console.log('Processing document with vision model');
          // Longer timeout for document processing
          requestBody.timeout = 120000; 
        }

        // Check if we're processing a file to better handle binary data
        const isFileProcessingRequest = requestBody.messages?.some?.(m => 
          m.content?.some?.(c => c.type === 'image_url' || c.type === 'file_url')
        );

        // Prepare headers based on request type
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'X-Request-ID': `req-${Date.now()}`,
        };

        // Add optional headers for file processing
        if (isFileProcessingRequest) {
          headers['X-Processing-Type'] = 'document';
          headers['X-Timeout-Override'] = '120';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, isFileProcessingRequest ? 120000 : effectiveTimeout); // Longer timeout for file processing

        console.log(`Making API request with ${effectiveTimeout}ms timeout`);
        
        const response = await fetch(LOCAL_PROXY, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 413) {
            throw new Error('The file is too large for processing');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later');
          } else if (response.status === 401 || response.status === 403) {
            throw new Error('API key authentication failed');
          }
          
          const errorText = await response.text();
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Track performance
        attemptTimings.push(performance.now() - attemptStart);
        console.log(`API call succeeded on attempt ${attempt + 1}/${maxRetries + 1} in ${Math.round(attemptTimings[attempt])}ms`);
        console.log(`Total API call time: ${Math.round(performance.now() - callStart)}ms`);
        
        return data;
      } catch (error) {
        // Track timing even for failed attempts
        attemptTimings.push(performance.now() - attemptStart);
        
        lastError = error;
        console.error(`API call attempt ${attempt + 1}/${maxRetries + 1} failed in ${Math.round(attemptTimings[attempt])}ms:`, error);
        
        // Don't retry certain errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('api key') || 
              errorMessage.includes('authentication') || 
              errorMessage.includes('too large') ||
              error.name === 'AbortError') {
            break;
          }
        }
      }
    }

    // All attempts failed - log detailed timing info for debugging
    console.error(`All API attempts failed. Total duration: ${Math.round(performance.now() - callStart)}ms`);
    console.error('Attempt timings:', attemptTimings.map(t => Math.round(t)));
    
    throw lastError || new Error('API call failed after multiple attempts');
  },

  /**
   * Process a document and extract text with optimized performance
   */
  processDocument: async (file: File, apiKey?: string): Promise<string> => {
    const processingStart = performance.now();
    
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract the base64 part after the comma
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Build the request body for document processing
      const requestBody = {
        model: "grok-vision",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this document, preserving formatting as much as possible."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        timeout: 120000 // 2 minute timeout for document processing
      };

      console.log(`Sending document processing request for ${file.name}`);
      const response = await apiClient.callChatCompletions(requestBody, apiKey, {
        maxRetries: 1,
        retryDelay: 2000,
        timeout: 120000
      });
      
      const processingTime = performance.now() - processingStart;
      console.log(`Document processed in ${processingTime}ms`);

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error(`Document processing error after ${performance.now() - processingStart}ms:`, error);
      throw error;
    }
  }
};
