
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
    
    // Format tables and process content properly
    if (isBot) {
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
