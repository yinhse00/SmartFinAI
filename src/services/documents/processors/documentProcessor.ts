
import { pdfProcessor } from './pdfProcessor';
import { wordProcessor } from './wordProcessor';
import { DocumentProcessorInterface } from './baseProcessor';

/**
 * Factory function to get the appropriate document processor based on file type
 */
export function getDocumentProcessor(file: File): DocumentProcessorInterface {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return pdfProcessor;
  }
  
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return wordProcessor;
  }
  
  throw new Error(`Unsupported document type: ${fileName}`);
}

/**
 * Process a document file and extract its text content
 */
export async function processDocument(file: File): Promise<{ content: string; source: string }> {
  try {
    console.log(`Processing document: ${file.name}`);
    
    const processor = getDocumentProcessor(file);
    return await processor.extractText(file);
  } catch (error) {
    console.error('Document processing error:', error);
    
    return {
      content: `Error processing document: ${error instanceof Error ? error.message : String(error)}`,
      source: file.name
    };
  }
}
