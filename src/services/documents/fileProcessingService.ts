
import { apiClient } from '../api/grok/apiClient';
import { getGrokApiKey } from '../apiKeyService';

/**
 * Service for processing different file types and extracting text content
 */
export const fileProcessingService = {
  /**
   * Process a file and extract text content based on file type
   */
  processFile: async (file: File): Promise<{ content: string; source: string }> => {
    const fileType = getFileType(file);
    
    try {
      switch (fileType) {
        case 'pdf':
          return await extractPdfText(file);
        case 'word':
          return await extractWordText(file);
        case 'excel':
          return await extractExcelText(file);
        case 'image':
          return await extractImageTextWithGrok(file);
        default:
          return { content: `Unable to extract text from ${file.name}`, source: file.name };
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      return { 
        content: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        source: file.name 
      };
    }
  }
};

/**
 * Determine the file type based on file extension or MIME type
 */
function getFileType(file: File): 'pdf' | 'word' | 'excel' | 'image' | 'unknown' {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') {
    return 'pdf';
  } else if (
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docx') || 
    mimeType === 'application/msword' || 
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'word';
  } else if (
    fileName.endsWith('.xls') || 
    fileName.endsWith('.xlsx') || 
    mimeType === 'application/vnd.ms-excel' || 
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'excel';
  } else if (
    fileName.endsWith('.jpg') || 
    fileName.endsWith('.jpeg') || 
    fileName.endsWith('.png') || 
    fileName.endsWith('.gif') || 
    mimeType.startsWith('image/')
  ) {
    return 'image';
  }
  
  return 'unknown';
}

/**
 * Extract text from images using Grok Vision model
 */
async function extractImageTextWithGrok(file: File): Promise<{ content: string; source: string }> {
  try {
    console.log(`Processing image with Grok Vision: ${file.name}`);
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    if (!base64Data) {
      throw new Error('Failed to convert image to base64');
    }
    
    // Prepare request for Grok Vision API
    const apiKey = getGrokApiKey();
    if (!apiKey) {
      throw new Error('Grok API key not found');
    }
    
    const requestBody = {
      model: "grok-2-vision-latest",
      messages: [
        {
          role: "user", 
          content: [
            { 
              type: "text", 
              text: "Extract all the text from this image. Format it in a clear, readable way maintaining paragraphs, headings, and bullet points if present." 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: base64Data 
              } 
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    };
    
    // Call Grok API
    const response = await apiClient.callChatCompletions(requestBody, apiKey);
    
    // Extract the text content from the response
    const extractedText = response.choices[0]?.message?.content || 'No text was extracted from the image';
    
    console.log(`Successfully extracted text from image ${file.name}`);
    
    return {
      content: extractedText,
      source: file.name
    };
  } catch (error) {
    console.error(`Error in OCR processing for ${file.name}:`, error);
    return {
      content: `Error extracting text from image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: file.name
    };
  }
}

/**
 * Convert File object to base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text content from PDF files
 * Note: This is a simplified implementation. In a real-world scenario, 
 * you would use a PDF parsing library.
 */
async function extractPdfText(file: File): Promise<{ content: string; source: string }> {
  // In a real implementation, you would use a library like pdf.js
  // For now, return a placeholder message
  return { 
    content: `PDF text extraction would process the content of ${file.name}. In a complete implementation, this would use a library like pdf.js to extract actual text content.`, 
    source: file.name 
  };
}

/**
 * Extract text content from Word documents
 */
async function extractWordText(file: File): Promise<{ content: string; source: string }> {
  // In a real implementation, you would use a library for DOCX parsing
  return { 
    content: `Word document text extraction would process the content of ${file.name}. In a complete implementation, this would use a specialized library to extract text from .doc/.docx files.`, 
    source: file.name 
  };
}

/**
 * Extract text content from Excel files
 */
async function extractExcelText(file: File): Promise<{ content: string; source: string }> {
  // In a real implementation, you would use a library for Excel parsing
  return { 
    content: `Excel spreadsheet text extraction would process the content of ${file.name}. In a complete implementation, this would use a specialized library to extract data from Excel files and format it as text.`, 
    source: file.name 
  };
}
