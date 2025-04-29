import { apiClient } from '../api/grok/apiClient';
import { getGrokApiKey } from '../apiKeyService';
import * as XLSX from 'xlsx';

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
 * Extract text content from PDF files using browser-compatible approach
 */
async function extractPdfText(file: File): Promise<{ content: string; source: string }> {
  try {
    console.log(`Processing PDF: ${file.name}`);
    
    // Since pdf-parse uses Node.js fs, we'll use Grok Vision as a fallback for PDFs in the browser
    return await extractDocumentWithGrok(file, 'PDF');
  } catch (error) {
    console.error(`Error extracting PDF text from ${file.name}:`, error);
    return {
      content: `Error extracting text from PDF ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: file.name
    };
  }
}

/**
 * Extract text content from Word documents
 */
async function extractWordText(file: File): Promise<{ content: string; source: string }> {
  try {
    console.log(`Processing Word document: ${file.name}`);
    
    // Since mammoth uses Node.js dependencies, we'll use Grok Vision as a fallback
    return await extractDocumentWithGrok(file, 'Word');
  } catch (error) {
    console.error(`Error extracting Word text from ${file.name}:`, error);
    return {
      content: `Error extracting text from Word document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: file.name
    };
  }
}

/**
 * Extract text content from Excel files
 * XLSX.js is browser compatible, so we can keep this implementation
 */
async function extractExcelText(file: File): Promise<{ content: string; source: string }> {
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

/**
 * Use Grok Vision to extract text from documents as a fallback method
 */
async function extractDocumentWithGrok(file: File, documentType: string): Promise<{ content: string; source: string }> {
  try {
    console.log(`Processing ${documentType} with Grok Vision: ${file.name}`);
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    if (!base64Data) {
      throw new Error(`Failed to convert ${documentType} to base64`);
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
              text: `Extract all the text from this ${documentType} file. Format it in a clear, readable way maintaining paragraphs, headings, and bullet points if present.` 
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
    const extractedText = response.choices[0]?.message?.content || `No text was extracted from the ${documentType} file`;
    
    console.log(`Successfully extracted text from ${documentType} ${file.name}`);
    
    return {
      content: extractedText,
      source: file.name
    };
  } catch (error) {
    console.error(`Error in ${documentType} processing for ${file.name}:`, error);
    return {
      content: `Error extracting text from ${documentType} ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: file.name
    };
  }
}
