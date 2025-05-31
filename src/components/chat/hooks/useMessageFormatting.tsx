
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
      // Check if content already contains clickable links (anchor tags with href)
      const hasClickableLinks = /<a\s+[^>]*href[^>]*>.*?<\/a>/i.test(displayContent);
      
      if (hasClickableLinks) {
        // Content already has clickable links - preserve as-is to avoid double formatting
        console.log('Content already contains clickable links, preserving formatting');
        setFormattedContent(displayContent);
      } else {
        // No existing links detected - safe to apply table formatting
        console.log('No existing links detected, applying table formatting');
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
