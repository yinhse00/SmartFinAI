
import { useState, useEffect } from 'react';
import detectAndFormatTables from '@/utils/tableFormatter';

interface UseMessageFormattingProps {
  content: string;
  originalContent?: string;
  isBot: boolean;
}

export const useMessageFormatting = ({ content, originalContent, isBot }: UseMessageFormattingProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  
  // Process content when message changes or when toggling between original/translated
  useEffect(() => {
    // Ensure displayContent always has a value
    const safeContent = content || "";
    const displayContent = showOriginal && originalContent ? originalContent : safeContent;
    
    // FIXED: Always apply table formatting for bot messages to ensure proper CSS classes
    if (isBot) {
      // Apply table formatting to ensure proper CSS classes are added
      // The responseFormatter already handles markdown → HTML conversion including bold text
      // We just need to ensure tables get proper styling classes
      console.log('Applying table formatting and ensuring proper CSS classes');
      const formatted = detectAndFormatTables(displayContent);
      setFormattedContent(formatted);
    } else {
      // For user messages, no formatting needed
      setFormattedContent(displayContent);
    }
  }, [content, originalContent, showOriginal, isBot]);

  return {
    showOriginal,
    setShowOriginal,
    formattedContent
  };
};
