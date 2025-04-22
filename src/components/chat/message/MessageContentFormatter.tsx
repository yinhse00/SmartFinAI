
import React from 'react';

interface MessageContentFormatterProps {
  content: string;
  isTypingComplete: boolean;
}

const MessageContentFormatter: React.FC<MessageContentFormatterProps> = ({ content, isTypingComplete }) => {
  // Function to format content with better paragraphs and code blocks
  const formatContent = (text: string): string => {
    // Process code blocks first 
    let formatted = text.replace(/```(.+?)```/gs, (match, codeContent) => {
      const parts = match.split('\n');
      if (parts.length > 2) {
        const language = parts[0].replace('```', '').trim();
        return `<div class="code-block"><div class="code-header">${language}</div><pre><code>${codeContent.replace(/```/g, '')}</code></pre></div>`;
      }
      return match;
    });
    
    // Process inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Process paragraphs with appropriate spacing
    formatted = formatted.split('\n\n').map(paragraph => 
      `<p class="paragraph">${paragraph.replace(/\n/g, '<br>')}</p>`
    ).join('');
    
    // Add Grok-like styling for bullets
    formatted = formatted.replace(/•/g, '<span class="bullet">•</span>');
    
    return formatted;
  };

  return (
    <div 
      className="grok-message text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
};

export default MessageContentFormatter;
