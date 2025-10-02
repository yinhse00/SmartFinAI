import React from 'react';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';
import { createSafeMarkup } from '@/utils/sanitize';

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export const MessageFormatter: React.FC<MessageFormatterProps> = ({
  content,
  className = ''
}) => {
  // Format text with proper paragraph breaks
  const formatText = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [''];
    
    // Split by natural paragraph breaks first
    const naturalParagraphs = text.split(/\n\s*\n/);
    
    const formattedParagraphs: string[] = [];
    
    naturalParagraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return;
      
      // For numbered/bulleted lists, keep as separate paragraphs
      if (/^\d+\.|^[•\-*]/.test(trimmed)) {
        formattedParagraphs.push(trimmed);
        return;
      }
      
      // For long paragraphs, try to break at sentence boundaries
      if (trimmed.length > 200) {
        // Split at sentence endings followed by capital letters or new concepts
        const sentences = trimmed.split(/([.!?]+\s+)(?=[A-Z]|Additionally|Furthermore|Moreover|However|Therefore|In conclusion)/);
        
        let currentParagraph = '';
        
        sentences.forEach((sentence, index) => {
          if (sentence.trim()) {
            currentParagraph += sentence;
            
            // If we've accumulated enough content or hit a natural break, start new paragraph
            if (currentParagraph.length > 150 && /[.!?]\s*$/.test(sentence)) {
              formattedParagraphs.push(currentParagraph.trim());
              currentParagraph = '';
            }
          }
        });
        
        if (currentParagraph.trim()) {
          formattedParagraphs.push(currentParagraph.trim());
        }
      } else {
        formattedParagraphs.push(trimmed);
      }
    });
    
    return formattedParagraphs.filter(p => p.trim().length > 0);
  };

  // Apply complete formatting pipeline: bold, italic, HTML, tables, links
  const fullyFormattedContent = ipoMessageFormatter.formatMessage(content);
  const paragraphs = formatText(fullyFormattedContent);

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        // Check if paragraph contains HTML table
        paragraph.includes('<table') ? (
          <div 
            key={index} 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={createSafeMarkup(paragraph)}
          />
        ) : (
          // Check if paragraph contains HTML formatting (bold, italic, etc.)
          paragraph.includes('<') ? (
            <div 
              key={index} 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={createSafeMarkup(paragraph)}
            />
          ) : (
            <p key={index} className="text-sm leading-relaxed">
              {paragraph}
            </p>
          )
        )
      ))}
    </div>
  );
};
