
/**
 * Format extracted file content for display in the chat interface
 * 
 * @param source The source file name
 * @param content The extracted content
 * @returns Formatted content string
 */
export const formatExtractedContent = (source: string, content: string): string => {
  const fileType = getFileTypeFromName(source);
  const icon = getFileIcon(fileType);
  
  return `${icon} **Content extracted from ${source}**\n\n${content}\n\n`;
};

/**
 * Get the file type based on file name
 */
export const getFileTypeFromName = (fileName: string): 'pdf' | 'word' | 'excel' | 'image' | 'unknown' => {
  const name = fileName.toLowerCase();
  
  if (name.endsWith('.pdf')) {
    return 'pdf';
  } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
    return 'word';
  } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    return 'excel';
  } else if (
    name.endsWith('.jpg') || 
    name.endsWith('.jpeg') || 
    name.endsWith('.png') || 
    name.endsWith('.gif')
  ) {
    return 'image';
  }
  
  return 'unknown';
};

/**
 * Get an appropriate icon for the file type
 */
export const getFileIcon = (
  fileType: 'pdf' | 'word' | 'excel' | 'image' | 'unknown'
): string => {
  switch (fileType) {
    case 'pdf':
      return '📕';
    case 'word':
      return '📝';
    case 'excel':
      return '📊';
    case 'image':
      return '🖼️';
    default:
      return '📄';
  }
};
