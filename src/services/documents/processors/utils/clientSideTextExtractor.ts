
import { fileConverter } from '../../utils/fileConverter';

/**
 * Utility for extracting text from documents on the client side
 * (Used as fallback when API is unavailable)
 */
export const clientSideTextExtractor = {
  /**
   * Client-side document text extraction (basic fallback when API is unavailable)
   */
  extractText: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          // For .txt files
          if (file.name.endsWith('.txt')) {
            resolve(e.target.result as string);
            return;
          }
          
          // For Word documents (.docx, .doc), extract what we can
          if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            // Basic extraction that works in browser
            const text = await fileConverter.getPlainTextFromDocx(e.target.result);
            if (text) {
              resolve(text);
            } else {
              reject(new Error("Could not extract text from Word document"));
            }
            return;
          }
          
          reject(new Error("Unsupported file type for client-side extraction"));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("FileReader error"));
      };
      
      if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }
};
