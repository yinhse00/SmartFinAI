
import * as XLSX from 'xlsx';

/**
 * Processor for extracting text from Excel spreadsheets
 */
export const spreadsheetProcessor = {
  /**
   * Extract text content from Excel files
   * XLSX.js is browser compatible, so we can use it directly
   */
  extractExcelText: async (file: File): Promise<{ content: string; source: string }> => {
    try {
      console.log(`Processing Excel file: ${file.name}`);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Extract text from all sheets
      const sheetNames = workbook.SheetNames;
      let textContent = '';
      
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        textContent += `Sheet: ${sheetName}\n`;
        
        // Convert rows and cells to formatted text
        for (const row of sheetData as any[][]) {
          if (row && row.length > 0) {
            textContent += row.join('\t') + '\n';
          }
        }
        
        textContent += '\n\n';
      }
      
      console.log(`Successfully extracted ${textContent.length} characters from Excel file ${file.name}`);
      
      return {
        content: textContent,
        source: file.name
      };
    } catch (error) {
      console.error(`Error extracting Excel data from ${file.name}:`, error);
      return {
        content: `Error extracting data from Excel file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: file.name
      };
    }
  }
};
