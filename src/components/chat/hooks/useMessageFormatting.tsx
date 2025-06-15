
import { useState, useEffect } from 'react';
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
    
    // Bot message content is now fully pre-formatted by the responseFormatter service,
    // which handles markdown-to-HTML conversion for headings, lists, tables, etc.
    // The previous call to `detectAndFormatTables` was redundant and caused formatting issues
    // by re-processing already formatted HTML.
    if (isBot) {
      console.log('Using pre-formatted bot content, skipping redundant client-side formatting.');
      setFormattedContent(displayContent);
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
