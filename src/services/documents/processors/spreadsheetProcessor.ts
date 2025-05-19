
import { fileConverter } from '../utils/fileConverter';

/**
 * Processor for extracting text from spreadsheet files
 */
export const spreadsheetProcessor = {
  /**
   * Extract text from Excel files using browser-compatible approach
   */
  extractExcelText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Excel file: ${file.name}`);
      
      const extractedText = await fileConverter.getExcelText(file);
      
      if (!extractedText || extractedText.trim() === '') {
        return {
          content: `No text content could be extracted from the Excel file ${file.name}. The file may be empty or contain only formatting.`,
          source: file.name
        };
      }
      
      // Format the extracted content
      const formattedText = spreadsheetProcessor.formatExcelContent(extractedText, file.name);
      
      console.log(`Successfully extracted text from Excel file ${file.name}`);
      
      return {
        content: formattedText,
        source: file.name
      };
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
  }
};
