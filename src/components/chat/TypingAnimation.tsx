
import React, { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  typingSpeed?: number;  // Characters per second
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
  renderAsHTML?: boolean; // Prop to indicate if the content should be rendered as HTML
  initialVisibleChars?: number; // Show this many characters immediately
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  typingSpeed = 40,
  className = '',
  onComplete,
  onProgress,
  renderAsHTML = false,
  initialVisibleChars = 60 // Show first 60 chars immediately for better responsiveness
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const contentPriority = useRef<{ highPriority: string; normalPriority: string }>({ highPriority: '', normalPriority: '' });
  
  // Process content on initial render to identify high-priority segments
  useEffect(() => {
    // Identify high-priority content (first sentence, important elements)
    const firstSentenceMatch = text.match(/^(.*?[.!?])\s/);
    const firstSentence = firstSentenceMatch ? firstSentenceMatch[1] : text.substring(0, Math.min(100, text.length));
    
    contentPriority.current = {
      highPriority: firstSentence,
      normalPriority: text.substring(firstSentence.length)
    };
    
    // Show initial characters immediately for perceived responsiveness
    if (initialVisibleChars > 0 && text.length > 0) {
      setDisplayedText(text.substring(0, Math.min(initialVisibleChars, text.length)));
      setCharacterIndex(Math.min(initialVisibleChars, text.length));
    }
  }, [text, initialVisibleChars]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);

  // Reset when text changes
  useEffect(() => {
    setCharacterIndex(initialVisibleChars > 0 ? Math.min(initialVisibleChars, text.length) : 0);
    setDisplayedText(initialVisibleChars > 0 ? text.substring(0, Math.min(initialVisibleChars, text.length)) : '');
    setIsPaused(false);
  }, [text, initialVisibleChars]);

  // Enhanced typing effect with adaptive speed
  useEffect(() => {
    if (characterIndex >= text.length) {
      onComplete && onComplete();
      return;
    }

    if (isPaused) return;

    // Base typing speed
    let baseDelay = 1000 / typingSpeed;
    
    // Adaptive typing speed based on content
    const currentChar = text[characterIndex] || '';
    const nextChars = text.substring(characterIndex, characterIndex + 10);
    
    // Content-aware speed adjustments
    if (['.', '!', '?'].includes(currentChar)) {
      baseDelay *= 3; // Longer pause after sentences
    } else if ([',', ';', ':'].includes(currentChar)) {
      baseDelay *= 1.5; // Medium pause for punctuation
    } else if (currentChar === '\n' || (currentChar === ' ' && nextChars.includes('\n'))) {
      baseDelay *= 2; // Pause at paragraph breaks
    } else if (characterIndex < 100) {
      baseDelay *= 0.8; // Faster at the beginning for responsiveness
    } else if (text.length - characterIndex < 50) {
      baseDelay *= 1.2; // Slow down slightly at the end
    }
    
    // Special content-based speed (like code blocks, lists)
    if (nextChars.includes('```') || nextChars.includes('|')) {
      baseDelay *= 0.5; // Speed through code blocks and tables
    }
    
    // Handle HTML tags specially
    if (renderAsHTML) {
      if (currentChar === '<') {
        const tagEndIndex = text.indexOf('>', characterIndex);
        if (tagEndIndex > characterIndex) {
          const tagContent = text.substring(characterIndex, tagEndIndex + 1);
          
          if (tagContent.includes('<p') || tagContent.includes('<h')) {
            baseDelay *= 2; // Pause for paragraph tags
          } else if (tagContent.includes('bullet-point') || tagContent.includes('<li')) {
            baseDelay *= 1.5; // Pause for list items
          } else if (tagContent.includes('<strong') || tagContent.includes('<b')) {
            baseDelay *= 0.7; // Faster for emphasized text
          }
          
          // Speed up tag rendering (don't need to see tags typed out character by character)
          timerId.current = setTimeout(() => {
            setDisplayedText(text.slice(0, tagEndIndex + 1));
            setCharacterIndex(tagEndIndex + 1);
            
            // Notify progress
            if (onProgress && characterIndex % 20 === 0) {
              onProgress();
            }
          }, baseDelay);
          
          return;
        }
      }
    }

    // Normal character typing
    timerId.current = setTimeout(() => {
      setDisplayedText(text.slice(0, characterIndex + 1));
      setCharacterIndex(prev => prev + 1);
      
      // Notify parent component of progress
      if (onProgress && characterIndex % 20 === 0) {
        onProgress();
      }
    }, baseDelay);

    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, [characterIndex, text, typingSpeed, isPaused, onComplete, onProgress, renderAsHTML]);

  // Handle click to show full text immediately
  const handleClick = () => {
    if (characterIndex < text.length) {
      // If clicked before completion, show all text
      setDisplayedText(text);
      setCharacterIndex(text.length);
      onComplete && onComplete();
    }
  };

  return (
    <div className={`${className} cursor-pointer`} onClick={handleClick}>
      {renderAsHTML ? (
        <div dangerouslySetInnerHTML={{ __html: displayedText }} />
      ) : (
        <>
          {displayedText}
          <span className="typing-cursor"></span>
        </>
      )}
    </div>
  );
};

export default TypingAnimation;
