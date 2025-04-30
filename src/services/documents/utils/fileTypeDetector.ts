
/**
 * Utility for detecting file types based on extensions and MIME types
 */
export type FileType = 'pdf' | 'word' | 'excel' | 'image' | 'unknown';

export const fileTypeDetector = {
  /**
   * Determine the file type based on file extension or MIME type
   */
  detectFileType: (file: File): FileType => {
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
};
