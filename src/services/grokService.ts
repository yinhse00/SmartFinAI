
// This is the service for the Grok AI integration
import { databaseService } from './databaseService';
import { getGrokApiKey, hasGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';

interface GrokRequestParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: string;
  documentContext?: string;
  regulatoryContext?: string;
}

interface GrokResponse {
  text: string;
  // Add other response fields as needed based on the actual API
}

interface TranslationParams {
  content: string;
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'en' | 'zh';
  format?: string;
}

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
  getRegulatoryContext: async (query: string): Promise<string> => {
    try {
      // Search the database for relevant entries
      const relevantEntries = await databaseService.search(query);
      
      if (relevantEntries.length === 0) {
        return "No specific regulatory information found in database.";
      }
      
      // Format the entries as context
      return formatRegulatoryEntriesAsContext(relevantEntries);
    } catch (error) {
      console.error("Error fetching regulatory context:", error);
      return "Error fetching regulatory context.";
    }
  },
  
  /**
   * Generate a response from Grok AI with regulatory context
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // If no regulatory context was provided, try to find relevant context
      let regulatoryContext = params.regulatoryContext;
      if (!regulatoryContext) {
        regulatoryContext = await grokService.getRegulatoryContext(params.prompt);
      }
      
      // Create an enhanced prompt that includes the regulatory context
      const enhancedPrompt = createEnhancedPrompt(params.prompt, params.documentContext, regulatoryContext);
      
      console.log("Generating response with enhanced prompt:", enhancedPrompt);
      
      const apiKey = getGrokApiKey();
      
      // Check if API key is available
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse(params.prompt, "No API key provided");
      }
      
      // Validate API key format (basic validation)
      if (!apiKey.startsWith('xai-')) {
        console.error("Invalid API key format");
        return generateFallbackResponse(params.prompt, "Invalid API key format");
      }
      
      try {
        console.log("Connecting to Grok API");
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
                       'Use the provided regulatory context to generate accurate responses.' 
            },
            { 
              role: 'user', 
              content: enhancedPrompt
            }
          ],
          model: "grok-3-mini-beta",  // Updated from grok-2 to grok-3-mini-beta
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 500
        };
        
        console.log("Request body:", JSON.stringify(requestBody));
        
        // Use a proxy endpoint to avoid CORS issues
        const response = await fetch('/api/grok/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`API error ${response.status}:`, errorData);
          
          // Specific error handling for common errors
          if (response.status === 401) {
            throw new Error("Authentication failed. Please check your API key.");
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else if (response.status >= 500) {
            throw new Error("Grok service is currently unavailable. Please try again later.");
          } else if (response.status === 404) {
            // Check for specific model-related errors in the response
            if (errorData.includes("model") && errorData.includes("does not exist")) {
              throw new Error("The specified model is not available. Please use a different model or check API documentation.");
            } else {
              throw new Error("API endpoint not found. Please check the API documentation.");
            }
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        return {
          text: data.choices?.[0]?.message?.content || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        // Fallback to demo responses when API fails
        console.log("Using fallback response due to API error");
        return generateFallbackResponse(params.prompt, apiError instanceof Error ? apiError.message : "API error");
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return generateFallbackResponse(params.prompt, "Error generating response");
    }
  },

  /**
   * Translate content using Grok AI
   */
  translateContent: async (params: TranslationParams): Promise<GrokResponse> => {
    try {
      const apiKey = getGrokApiKey();
      
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse("translation request", "No API key provided");
      }
      
      const sourceLang = params.sourceLanguage === 'en' ? 'English' : 'Chinese';
      const targetLang = params.targetLanguage === 'en' ? 'English' : 'Chinese';
      
      try {
        console.log("Connecting to Grok API for translation");
        
        // Ensure we're sending just the raw content without any prefixes or metadata
        const contentToTranslate = params.content.trim();
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: `You are a professional translator. Translate the following content from ${sourceLang} to ${targetLang}. Translate only the text provided and do not add any explanations, context, or metadata. Do not include phrases like "Content extracted from" in your translation.` 
            },
            { 
              role: 'user', 
              content: contentToTranslate
            }
          ],
          model: "grok-3-mini-beta",  // Updated from grok-2 to grok-3-mini-beta
          temperature: 0.3, // Lower temperature for more accurate translations
          max_tokens: 4000  // Allow for longer translations
        };
        
        const response = await fetch('/api/grok/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          text: data.choices?.[0]?.message?.content || 
                "Translation failed."
        };
      } catch (apiError) {
        console.error("Error calling Grok API for translation:", apiError);
        return generateFallbackResponse("translation", apiError instanceof Error ? apiError.message : "API error");
      }
    } catch (error) {
      console.error("Error during translation:", error);
      return generateFallbackResponse("translation", "Error during translation");
    }
  },
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating Word document with content:", content);
      
      // Create a simple Word XML document with the content
      const wordXml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            ${content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
          </div>
        </body>
        </html>
      `;
      
      // Return as a proper Word document
      return new Blob([wordXml], {type: 'application/vnd.ms-word'});
    } catch (error) {
      console.error("Error generating Word document:", error);
      throw new Error("Failed to generate Word document.");
    }
  },

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating PDF document with content:", content);
      
      // Create a PDF-like HTML document that will render well when downloaded
      const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              margin: 40px;
            }
            .content {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              color: #2c5282;
            }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Generated Document</h1>
            ${content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
          </div>
        </body>
        </html>
      `;
      
      // Return as HTML that will be displayed properly when downloaded
      return new Blob([pdfHtml], {type: 'text/html'});
    } catch (error) {
      console.error("Error generating PDF document:", error);
      throw new Error("Failed to generate PDF document.");
    }
  },
  
  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating Excel document with content:", content);
      
      // Create a basic CSV format from the content
      let csvContent = "Content\n";
      
      // Add each line as a separate row
      content.split('\n').forEach(line => {
        // Escape any commas in the content
        csvContent += `"${line.replace(/"/g, '""')}"\n`;
      });
      
      // Return as a CSV document that Excel can open
      return new Blob([csvContent], {type: 'text/csv'});
    } catch (error) {
      console.error("Error generating Excel document:", error);
      throw new Error("Failed to generate Excel document.");
    }
  }
};
