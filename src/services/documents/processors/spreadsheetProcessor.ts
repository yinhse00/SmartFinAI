
import { fileConverter } from '../utils/fileConverter';
import { getGrokApiKey } from '../../../services/apiKeyService';
import { apiClient } from '../../api/grok/apiClient';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';

/**
 * Processor for extracting text from spreadsheet files with improved client-side processing
 */
export const spreadsheetProcessor = {
  /**
   * Extract text from Excel files using browser-compatible approach as primary method
   */
  extractExcelText: async (file: File, xlsxAvailable: boolean = false): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Excel file: ${file.name}, XLSX available: ${xlsxAvailable}`);
      
      // First check if SheetJS is available for client-side extraction
      if (xlsxAvailable) {
        try {
          console.log("Attempting client-side Excel extraction with SheetJS");
          
          const extractedText = await fileConverter.getExcelText(file);
          
          if (extractedText && extractedText.trim() !== '' && !extractedText.includes('[Excel')) {
            // Format the extracted content
            const formattedText = spreadsheetProcessor.formatExcelContent(extractedText, file.name);
            
            console.log(`Successfully extracted text from Excel file ${file.name} using SheetJS`);
            
            return {
              content: formattedText,
              source: file.name
            };
          } else {
            console.log("SheetJS extraction returned empty or error content, trying API fallback");
          }
        } catch (clientError) {
          console.warn("SheetJS Excel extraction failed:", clientError);
          // Continue to API fallback
        }
      } else {
        console.log("SheetJS is not available for client-side Excel extraction");
      }
      
      // API fallback - if client-side extraction failed or is unavailable
      const apiKey = getGrokApiKey();
      const isApiAvailable = apiKey ? await checkApiAvailability(apiKey) : false;
      
      if (isApiAvailable) {
        // Use text-based API approach for Excel
        return await spreadsheetProcessor.processExcelWithTextPrompt(file);
      } else {
        if (!xlsxAvailable) {
          return {
            content: `[Excel Processing Limited: The Excel file ${file.name} could not be processed in offline mode because SheetJS is not available. Please try again when online or provide the data in another format.]`,
            source: file.name
          };
        }
        
        return {
          content: `No text content could be extracted from the Excel file ${file.name}. The file may be empty, contain only formatting, or requires online processing which is currently unavailable.`,
          source: file.name
        };
      }
    } catch (error) {
      console.error(`Error extracting Excel text from ${file.name}:`, error);
      return {
        content: `Error extracting text from Excel file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  },
  
  /**
   * Format Excel content for better readability
   */
  formatExcelContent: (content: string, filename: string): string => {
    // Add a header with the filename
    const header = `# Content extracted from Excel file: ${filename}\n\n`;
    
    // Clean up the extracted content
    let cleanedContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
    
    // If the content has sheets, format them better
    if (content.includes('--- Sheet:')) {
      // Content already has sheet formatting
      return header + cleanedContent;
    } else {
      // Try to detect table structure
      const lines = cleanedContent.split('\n');
      if (lines.length > 1 && lines[0].includes('\t')) {
        // Convert tab-separated content to a more readable format
        const formattedLines = lines.map(line => {
          return line.split('\t').join(' | ');
        });
        
        return header + formattedLines.join('\n');
      }
    }
    
    return header + cleanedContent;
  },
  
  /**
   * Process Excel files using text-based API approach (no image inputs)
   */
  processExcelWithTextPrompt: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Excel with text-based prompt: ${file.name}`);
      
      // Try to extract some basic text first for the prompt
      let basicExtraction = "";
      try {
        basicExtraction = await fileConverter.getExcelText(file);
      } catch (extractionError) {
        console.warn("Could not pre-extract Excel data:", extractionError);
        basicExtraction = "[Could not pre-extract data from Excel file]";
      }
      
      // Prepare request for Grok API using text prompt only
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        throw new Error('Grok API key not found');
      }
      
      const requestBody = {
        model: "grok-3-beta",
        messages: [
          {
            role: "system", 
            content: "You are a spreadsheet data formatting assistant. Your task is to format tabular data in a clean, readable way that preserves the structure of the original spreadsheet."
          },
          {
            role: "user", 
            content: `This is raw text data extracted from an Excel file. Please format it into a readable table structure:\n\n${basicExtraction}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      };
      
      // Call Grok API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // Call Grok API
        const response = await apiClient.callChatCompletions(requestBody, apiKey);
        clearTimeout(timeoutId);
        
        // Extract the formatted content from the response
        const formattedContent = response.choices[0]?.message?.content || basicExtraction;
        
        // Format the result with a header
        const header = `# Content extracted from Excel file: ${file.name}\n\n`;
        
        return {
          content: header + formattedContent,
          source: file.name
        };
      } catch (apiError) {
        clearTimeout(timeoutId);
        
        // Fall back to basic extraction
        console.warn("API processing failed, using basic extraction:", apiError);
        return {
          content: spreadsheetProcessor.formatExcelContent(basicExtraction, file.name),
          source: file.name
        };
      }
    } catch (error) {
      console.error(`Error in Excel processing for ${file.name}:`, error);
      
      return {
        content: `Error processing Excel file ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
        source: file.name
      };
    }
  }
};
