
/**
 * Utility functions for converting between file formats
 * with enhanced support for document types
 */
export const fileConverter = {
  /**
   * Convert File object to base64 string with improved reliability
   */
  fileToBase64: async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Ensure proper formatting of base64 string for Grok API
          let base64String = reader.result;
          
          // Make sure the base64 string has the correct prefix
          if (!base64String.startsWith('data:')) {
            // Determine the mime type
            const mime = file.type || 'application/octet-stream';
            base64String = `data:${mime};base64,${base64String.split(',')[1] || base64String}`;
          }
          
          resolve(base64String);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Basic plain text extraction from DOCX files
   * This is a client-side fallback when the API is unavailable
   */
  getPlainTextFromDocx: async (buffer: string | ArrayBuffer): Promise<string> => {
    // Check if mammoth is available in the window
    try {
      // Verify mammoth is properly loaded
      if (typeof window !== 'undefined' && window.mammoth) {
        console.log("Mammoth.js is available, using it for document extraction");
        
        // Convert string to ArrayBuffer if needed
        let arrayBuffer: ArrayBuffer;
        if (typeof buffer === 'string') {
          // Convert base64 to ArrayBuffer if needed
          const base64 = buffer.split(',')[1];
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          arrayBuffer = buffer;
        }
        
        // Process the document with mammoth
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        console.log("Mammoth extraction result:", result);
        
        if (result.value && result.value.trim() !== '') {
          return result.value;
        } else {
          console.warn("Mammoth extraction returned empty content");
          return '[Document appears to be empty or contains no extractable text]';
        }
      } else {
        console.warn("Mammoth.js is not available in the window object");
        throw new Error("Mammoth.js library not loaded");
      }
    } catch (e) {
      console.error('Mammoth.js extraction failed:', e);
      return '[Document text extraction failed. Please ensure the document is not corrupted and Mammoth.js is properly loaded.]';
    }
  },
  
  /**
   * Extract text from Excel files using client-side processing
   */
  getExcelText: async (file: File): Promise<string> => {
    try {
      // Try to use SheetJS if available
      if (typeof window !== 'undefined' && 'XLSX' in window) {
        const XLSX = (window as any).XLSX;
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              if (!e.target?.result) {
                reject(new Error('Failed to read Excel file'));
                return;
              }
              
              // Parse the Excel file
              const data = new Uint8Array(e.target.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              
              let result = '';
              
              // Process each worksheet
              workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                result += `\n\n--- Sheet: ${sheetName} ---\n\n`;
                
                // Convert to JSON and then to text
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                jsonData.forEach((row: any) => {
                  if (Array.isArray(row)) {
                    result += row.join('\t') + '\n';
                  }
                });
              });
              
              resolve(result.trim());
            } catch (error) {
              reject(error);
            }
          };
          
          reader.onerror = () => {
            reject(new Error('FileReader error'));
          };
          
          reader.readAsArrayBuffer(file);
        });
      } else {
        return '[Excel processing requires the SheetJS library which is not available. Using basic extraction instead.]';
      }
    } catch (e) {
      console.warn('Excel extraction failed:', e);
      return '[Excel text extraction failed. Please ensure the file is not corrupted.]';
    }
  },
  
  /**
   * Normalize file content for consistent processing
   */
  normalizeDocumentContent: (content: string): string => {
    // Remove excessive whitespace while preserving paragraph structure
    return content
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .replace(/\t+/g, '\t') // Normalize tabs
      .trim();
  }
};

// Augment the Window interface to include mammoth
declare global {
  interface Window {
    mammoth: any;
    XLSX: any;
  }
}
