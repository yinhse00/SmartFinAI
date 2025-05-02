
import React from 'react';

/**
 * Utility functions for formatting message text content
 */

/**
 * Formats message text with proper line breaks and styling
 * This is a simple implementation that can be enhanced with more formatting options
 */
export const formatMessageText = (text: string): JSX.Element => {
  if (!text) return <></>;
  
  // Split by new lines and create paragraph elements
  const paragraphs = text.split('\n\n').filter(Boolean);
  
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index > 0 ? 'mt-2' : ''}>
          {paragraph.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
};
