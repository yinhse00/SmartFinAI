
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
    
    // Format tables and process content properly while preserving links
    if (isBot) {
      // Check if content is already formatted (contains HTML tags or clickable links)
      const isAlreadyFormatted = displayContent.includes('<a href=') || 
                               displayContent.includes('<h1') || 
                               displayContent.includes('<h2') || 
                               displayContent.includes('<p class=') ||
                               displayContent.includes('<strong class=');
      
      if (isAlreadyFormatted) {
        console.log('Content already formatted with HTML, preserving as-is');
        setFormattedContent(displayContent);
      } else {
        // Only apply table formatting to raw text content
        console.log('Applying table formatting to raw content');
        const formatted = detectAndFormatTables(displayContent);
        setFormattedContent(formatted);
      }
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
