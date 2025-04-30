
/**
 * Helper service to detect file types
 */

export const fileTypeDetector = {
  /**
   * Detect file type based on extension and mime type
   */
  detectFileType: (file: File): 'pdf' | 'word' | 'excel' | 'image' | 'text' | 'unknown' => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    console.log(`Detecting file type for: ${fileName} (${fileType})`);
    
    // Check for PDF files
    if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
      return 'pdf';
    }
    
    // Check for Word documents (prioritize .docx files)
    if (
      fileName.endsWith('.docx') || 
      fileName.endsWith('.doc') || 
      fileType.includes('word') ||
      fileType.includes('officedocument.wordprocessingml') ||
      fileType.includes('msword')
    ) {
      // Special case to prioritize Chapter 14 DOCX files
      if (fileName.includes('chapter 14') || fileName.includes('mb_chapter 14')) {
        console.log('Detected important Word document for regulatory content');
      }
      return 'word';
    }
    
    // Check for Excel files
    if (
      fileName.endsWith('.xlsx') || 
      fileName.endsWith('.xls') || 
      fileType.includes('excel') ||
      fileType.includes('spreadsheetml')
    ) {
      return 'excel';
    }
    
    // Check for image files
    if (
      fileName.endsWith('.jpg') || 
      fileName.endsWith('.jpeg') || 
      fileName.endsWith('.png') || 
      fileName.endsWith('.gif') ||
      fileType.includes('image/')
    ) {
      return 'image';
    }
    
    // Check for text files
    if (
      fileName.endsWith('.txt') || 
      fileName.endsWith('.csv') || 
      fileName.endsWith('.json') || 
      fileName.endsWith('.md') ||
      fileType.includes('text/') ||
      fileType === 'application/json'
    ) {
      return 'text';
    }
    
    // Default to unknown
    console.warn(`Unknown file type for ${fileName} (${fileType})`);
    return 'unknown';
  }
};
