
import { useState, useEffect } from 'react';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';
// We don't import detectAndFormatTables here anymore because all formatting
// is now handled by the responseFormatter service.

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
    
    // Apply HTML formatting to bot messages to ensure all markdown is converted
    // This catches any remaining ** or * symbols from API responses
    if (isBot) {
      const htmlFormattedContent = htmlFormatter.applyHtmlFormatting(displayContent);
      setFormattedContent(htmlFormattedContent);
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
