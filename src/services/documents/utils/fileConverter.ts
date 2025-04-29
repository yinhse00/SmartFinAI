
/**
 * Utility functions for converting between file formats
 */
export const fileConverter = {
  /**
   * Convert File object to base64 string
   */
  fileToBase64: async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
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
   * This is a simple client-side fallback when the API is unavailable
   */
  getPlainTextFromDocx: async (buffer: string | ArrayBuffer): Promise<string> => {
    // If mammoth.js is available, use it
    try {
      if (typeof window !== 'undefined' && 'mammoth' in window) {
        // @ts-ignore - mammoth might be loaded as a global
        const mammoth = window.mammoth;
        if (typeof buffer === 'string') {
          // Convert base64 to ArrayBuffer if needed
          const base64 = buffer.split(',')[1];
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          buffer = bytes.buffer;
        }
        
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value || '';
      }
    } catch (e) {
      console.warn('Mammoth.js extraction failed:', e);
    }
    
    // Fallback if mammoth isn't available or fails
    return '[Document text extraction is limited in offline mode. Please ensure the Grok API is accessible for full functionality.]';
  }
};
