
import { getGrokApiKey } from '../apiKeyService';

export interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export const streamingService = {
  /**
   * Stream a response from the Grok API
   */
  streamResponse: async (prompt: string, options: StreamOptions, apiKey?: string) => {
    try {
      // Use provided API key or get from local storage
      const effectiveApiKey = apiKey || getGrokApiKey();
      
      if (!effectiveApiKey || !effectiveApiKey.startsWith('xai-')) {
        throw new Error('Valid API key is required for streaming');
      }
      
      // Build the request body
      const requestBody = {
        messages: [
          { role: 'system', content: 'You are a Hong Kong financial regulatory expert.' },
          { role: 'user', content: prompt }
        ],
        model: "grok-3-beta", // Always use the full model for streaming responses
        temperature: 0.5,
        max_tokens: 8000,
        stream: true // Enable streaming
      };
      
      // Create the fetch request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Streaming API error: ${response.status} - ${errorText}`);
      }
      
      // Get the response body as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream reader could not be created');
      }
      
      const decoder = new TextDecoder('utf-8');
      let accumulatedResponse = '';
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          options.onComplete(accumulatedResponse);
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value);
        
        // Process each line in the chunk
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            
            if (data === '[DONE]') {
              options.onComplete(accumulatedResponse);
              return;
            }
            
            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || '';
              
              if (content) {
                accumulatedResponse += content;
                options.onChunk(content);
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      options.onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }
};
