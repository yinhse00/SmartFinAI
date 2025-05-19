import { fileConverter } from '../utils/fileConverter';
import { getGrokApiKey } from '../../../services/apiKeyService';
import { apiClient } from '../../api/grok/apiClient';
import { checkApiAvailability } from '../../api/grok/modules/endpointManager';
import { ChatCompletionRequest } from '../../api/grok/types';

/**
 * Processor for extracting text from spreadsheet files with improved client-side processing
 */
export const spreadsheetProcessor = {
  /**
   * Extract text from Excel files using browser-compatible approach as primary method
   */
  extractExcelText: async (file: File, xlsxAvailable: boolean = false): Promise<{ content: string; source: string; metadata?: any }> => {
    try {
      console.log(`Processing Excel file: ${file.name}, XLSX available: ${xlsxAvailable}`);
      
      // Enhanced detection for specific mapping files
      const isListingGuidance = file.name.toLowerCase().includes('guide for new listing applicants');
      const isListedIssuerGuidance = file.name.toLowerCase().includes('guidance materials for listed issuers');
      const isRegulatoryMapping = isListingGuidance || isListedIssuerGuidance;
      
      // First check if SheetJS is available for client-side extraction
      if (xlsxAvailable) {
        try {
          console.log("Attempting client-side Excel extraction with SheetJS");
          
          const extractedText = await fileConverter.getExcelText(file);
          
          if (extractedText && extractedText.trim() !== '' && !extractedText.includes('[Excel')) {
            // Format the extracted content with enhanced structure for regulatory mapping files
            const formattedText = isRegulatoryMapping ? 
              spreadsheetProcessor.formatRegulatoryMappingContent(extractedText, file.name) :
              spreadsheetProcessor.formatExcelContent(extractedText, file.name);
            
            console.log(`Successfully extracted text from Excel file ${file.name} using SheetJS`);
            
            // Add enhanced metadata for regulatory mapping files
            const metadata = isRegulatoryMapping ? {
              isListingGuidance,
              isListedIssuerGuidance,
              isRegulatoryMapping: true,
              purpose: isListingGuidance ? 'new_listing_guidance' : 'listed_issuer_guidance',
              timestamp: new Date().toISOString(),
              validationPriority: isListingGuidance ? 'high' : 'medium'
            } : undefined;
            
            return {
              content: formattedText,
              source: file.name,
              metadata
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
        // Use specialized processing for regulatory mapping files
        if (isRegulatoryMapping) {
          return await spreadsheetProcessor.processRegulatoryMappingFile(file, isListingGuidance);
        }
        
        // Use text-based API approach for regular Excel files
        const result = await spreadsheetProcessor.processExcelWithTextPrompt(file);
        
        // Add metadata for regulatory mapping files if needed
        if (isRegulatoryMapping) {
          result.metadata = {
            isListingGuidance,
            isListedIssuerGuidance,
            isRegulatoryMapping: true,
            purpose: isListingGuidance ? 'new_listing_guidance' : 'listed_issuer_guidance',
            timestamp: new Date().toISOString(),
            validationPriority: isListingGuidance ? 'high' : 'medium'
          };
        }
        
        return result;
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
   * Format regulatory mapping content with enhanced structure for better validation
   */
  formatRegulatoryMappingContent: (content: string, filename: string): string => {
    const isListingGuidance = filename.toLowerCase().includes('guide for new listing applicants');
    
    // Add specialized header for regulatory mapping file
    const header = isListingGuidance ? 
      `# NEW LISTING APPLICANT GUIDANCE MAPPING\n# Extracted from: ${filename}\n# VALIDATION PRIORITY: HIGH\n\n` :
      `# LISTED ISSUER GUIDANCE MAPPING\n# Extracted from: ${filename}\n# VALIDATION PRIORITY: MEDIUM\n\n`;
    
    // Clean up the extracted content
    let cleanedContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
    
    // Process content based on structure
    if (content.includes('--- Sheet:')) {
      // Enhanced sheet formatting for regulatory mappings
      const sheets = content.split('--- Sheet:');
      let formattedSheets = [];
      
      for (let i = 1; i < sheets.length; i++) {
        const sheetContent = sheets[i].trim();
        const sheetName = sheetContent.split('\n')[0].trim();
        const sheetData = sheetContent.substring(sheetName.length).trim();
        
        formattedSheets.push(`## SHEET: ${sheetName} ##\n\n${sheetData}`);
      }
      
      return header + formattedSheets.join('\n\n');
    } else {
      // Try to detect and enhance table structure
      const lines = cleanedContent.split('\n');
      if (lines.length > 1) {
        // Check if content has tab-separated values
        if (lines[0].includes('\t')) {
          // Convert tab-separated content to a structured table format
          const formattedLines = lines.map(line => {
            return line.split('\t').join(' | ');
          });
          
          // Add table markers for better parsing
          let tableContent = `TABLE START\n`;
          tableContent += formattedLines.join('\n');
          tableContent += `\nTABLE END`;
          
          return header + tableContent;
        }
        
        // Try to identify sections and add markers
        let structuredContent = '';
        let currentSection = '';
        
        for (const line of lines) {
          if (line.trim() === '') {
            structuredContent += '\n';
            continue;
          }
          
          // Detect if this line might be a section header
          if (line.toUpperCase() === line && line.trim().length > 3) {
            currentSection = line.trim();
            structuredContent += `\n## SECTION: ${currentSection} ##\n\n`;
          } else {
            structuredContent += line + '\n';
          }
        }
        
        return header + structuredContent;
      }
    }
    
    return header + cleanedContent;
  },
  
  /**
   * Process Excel files using text-based API approach (no image inputs)
   */
  processExcelWithTextPrompt: async (file: File): Promise<{ content: string; source: string; metadata?: any }> => {
    try {
      console.log(`Processing Excel with text-based prompt: ${file.name}`);
      
      // Detect specific mapping files
      const isListingGuidance = file.name.toLowerCase().includes('guide for new listing applicants');
      const isListedIssuerGuidance = file.name.toLowerCase().includes('guidance materials for listed issuers');
      
      // Special system prompt based on file type
      let systemPrompt = "You are a spreadsheet data formatting assistant. Your task is to format tabular data in a clean, readable way that preserves the structure of the original spreadsheet.";
      
      if (isListingGuidance) {
        systemPrompt = "You are a financial regulatory expert specializing in new listing guidance. Extract and format the key information from this Excel mapping schedule for new listing applicants.";
      } else if (isListedIssuerGuidance) {
        systemPrompt = "You are a financial regulatory expert specializing in listed issuer requirements. Extract and format the key information from this Excel mapping schedule containing FAQs and guidance for listed issuers.";
      }
      
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
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-3-beta",
        messages: [
          {
            role: "system" as const, 
            content: systemPrompt
          },
          {
            role: "user" as const, 
            content: `This is raw text data extracted from an Excel file ${isListingGuidance ? 'containing mapping schedule guidance for new listing applicants' : isListedIssuerGuidance ? 'containing mapping schedule FAQs and guidance for listed issuers' : ''}. Please format it into a readable table structure, highlighting key regulatory information:\n\n${basicExtraction}`
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
        
        // Add metadata if this is a regulatory mapping file
        const metadata = (isListingGuidance || isListedIssuerGuidance) ? {
          isListingGuidance,
          isListedIssuerGuidance,
          isRegulatoryMapping: true,
          purpose: isListingGuidance ? 'new_listing_guidance' : 'listed_issuer_guidance'
        } : undefined;
        
        return {
          content: header + formattedContent,
          source: file.name,
          metadata
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
  },
  
  /**
   * Specialized processor for regulatory mapping files
   */
  processRegulatoryMappingFile: async (file: File, isNewListingGuide: boolean): Promise<{ content: string; source: string; metadata: any }> => {
    try {
      console.log(`Processing regulatory mapping file: ${file.name}, New Listing Guide: ${isNewListingGuide}`);
      
      // Try to extract some basic text first
      let basicExtraction = "";
      try {
        basicExtraction = await fileConverter.getExcelText(file);
      } catch (extractionError) {
        console.warn("Could not pre-extract regulatory mapping data:", extractionError);
        basicExtraction = "[Could not pre-extract data from regulatory mapping file]";
      }
      
      // Prepare specialized system prompt based on file type
      const systemPrompt = isNewListingGuide ? 
        "You are a financial regulatory expert specializing in new listing guidance. Extract and format structured information from this Excel mapping schedule for new listing applicants. Keep ALL regulatory information, rule references, and decision rationales. Format data in sections clearly labeled by topic." :
        "You are a financial regulatory expert specializing in listed issuer requirements. Extract and structure all information from this Excel mapping schedule containing FAQs and guidance for listed issuers. Maintain ALL regulatory content, organized by topic and rule reference.";
      
      // Prepare request for Grok API using text prompt only
      const apiKey = getGrokApiKey();
      if (!apiKey) {
        throw new Error('Grok API key not found');
      }
      
      const requestBody: ChatCompletionRequest = {
        model: "grok-3-beta",
        messages: [
          {
            role: "system" as const, 
            content: systemPrompt
          },
          {
            role: "user" as const, 
            content: `This Excel file contains critical regulatory mapping information ${isNewListingGuide ? 'for new listing applicants' : 'and FAQs for listed issuers'}. Extract and structure ALL content, preserving rule references, requirements, exceptions, and decision criteria. Format in a way that's easy to validate responses against:\n\n${basicExtraction}`
          }
        ],
        temperature: 0.1,
        max_tokens: 8000, // Increased token limit for comprehensive extraction
      };
      
      // Call Grok API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for thorough processing
      
      try {
        // Call Grok API
        const response = await apiClient.callChatCompletions(requestBody, apiKey);
        clearTimeout(timeoutId);
        
        // Extract the formatted content from the response
        const formattedContent = response.choices[0]?.message?.content || basicExtraction;
        
        // Format the result with enhanced structure
        let structuredContent = '';
        if (isNewListingGuide) {
          structuredContent = "# NEW LISTING APPLICANT GUIDANCE MAPPING\n\n";
          structuredContent += "## VALIDATION SOURCE: HIGH PRIORITY ##\n\n";
        } else {
          structuredContent = "# LISTED ISSUER GUIDANCE MAPPING\n\n";
          structuredContent += "## VALIDATION SOURCE: MEDIUM PRIORITY ##\n\n";
        }
        structuredContent += formattedContent;
        
        // Add comprehensive metadata
        const metadata = {
          isListingGuidance: isNewListingGuide,
          isListedIssuerGuidance: !isNewListingGuide,
          isRegulatoryMapping: true,
          purpose: isNewListingGuide ? 'new_listing_guidance' : 'listed_issuer_guidance',
          timestamp: new Date().toISOString(),
          validationPriority: isNewListingGuide ? 'high' : 'medium',
          contentType: 'structured_regulatory_mapping',
          processingLevel: 'enhanced'
        };
        
        return {
          content: structuredContent,
          source: file.name,
          metadata
        };
      } catch (apiError) {
        clearTimeout(timeoutId);
        
        // Fall back to basic extraction with enhanced formatting
        console.warn("API processing failed, using enhanced basic extraction:", apiError);
        return {
          content: spreadsheetProcessor.formatRegulatoryMappingContent(basicExtraction, file.name),
          source: file.name,
          metadata: {
            isListingGuidance: isNewListingGuide,
            isListedIssuerGuidance: !isNewListingGuide,
            isRegulatoryMapping: true,
            purpose: isNewListingGuide ? 'new_listing_guidance' : 'listed_issuer_guidance',
            timestamp: new Date().toISOString(),
            validationPriority: isNewListingGuide ? 'high' : 'medium',
            processingLevel: 'basic',
            processingError: String(apiError)
          }
        };
      }
    } catch (error) {
      console.error(`Error in regulatory mapping processing for ${file.name}:`, error);
      
      return {
        content: `Error processing regulatory mapping file ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
        source: file.name,
        metadata: {
          isRegulatoryMapping: true,
          processingError: true,
          errorDetails: String(error)
        }
      };
    }
  }
};
