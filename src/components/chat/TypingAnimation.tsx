
import React, { useState, useEffect, useRef } from 'react';
import { createSafeMarkup } from '@/utils/sanitize';

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
      if (renderAsHTML) {
        // For HTML content, find a safe breaking point that doesn't break tags
        const safeBreakpoint = findSafeHtmlBreakpoint(text, initialVisibleChars);
        setDisplayedText(text.substring(0, safeBreakpoint));
        setCharacterIndex(safeBreakpoint);
      } else {
        setDisplayedText(text.substring(0, Math.min(initialVisibleChars, text.length)));
        setCharacterIndex(Math.min(initialVisibleChars, text.length));
      }
    }
  }, [text, initialVisibleChars, renderAsHTML]);

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
    const initialChars = initialVisibleChars > 0 ? Math.min(initialVisibleChars, text.length) : 0;
    
    if (renderAsHTML && initialChars > 0) {
      const safeBreakpoint = findSafeHtmlBreakpoint(text, initialChars);
      setCharacterIndex(safeBreakpoint);
      setDisplayedText(text.substring(0, safeBreakpoint));
    } else {
      setCharacterIndex(initialChars);
      setDisplayedText(initialChars > 0 ? text.substring(0, initialChars) : '');
    }
    setIsPaused(false);
  }, [text, initialVisibleChars, renderAsHTML]);

  // Helper function to find safe HTML breaking points
  const findSafeHtmlBreakpoint = (htmlText: string, targetIndex: number): number => {
    if (targetIndex >= htmlText.length) return htmlText.length;
    
    // Find the nearest safe breaking point that doesn't break HTML tags
    let safeIndex = targetIndex;
    
    // Look backwards for a safe spot (outside of any HTML tag)
    while (safeIndex > 0) {
      const beforeChar = htmlText[safeIndex - 1];
      const afterChar = htmlText[safeIndex];
      
      // Safe if we're not inside a tag
      if (beforeChar !== '<' && afterChar !== '>' && !isInsideHtmlTag(htmlText, safeIndex)) {
        break;
      }
      safeIndex--;
    }
    
    return safeIndex;
  };

  // Helper function to check if a position is inside an HTML tag
  const isInsideHtmlTag = (htmlText: string, position: number): boolean => {
    const beforeText = htmlText.substring(0, position);
    const lastOpenTag = beforeText.lastIndexOf('<');
    const lastCloseTag = beforeText.lastIndexOf('>');
    
    return lastOpenTag > lastCloseTag;
  };

  // Helper function to get the next safe position for HTML content
  const getNextSafePosition = (currentIndex: number): number => {
    if (currentIndex >= text.length) return text.length;
    
    const currentChar = text[currentIndex];
    
    // If we hit an opening tag, jump to after the complete tag
    if (currentChar === '<') {
      const tagEnd = text.indexOf('>', currentIndex);
      if (tagEnd !== -1) {
        return tagEnd + 1;
      }
    }
    
    return currentIndex + 1;
  };

  // Enhanced typing effect with HTML awareness
  useEffect(() => {
    if (characterIndex >= text.length) {
      onComplete && onComplete();
      return;
    }

    if (isPaused) return;

    // Base typing speed
    let baseDelay = 1000 / typingSpeed;
    
    // For HTML content, use safe positioning
    let nextIndex = characterIndex + 1;
    if (renderAsHTML) {
      nextIndex = getNextSafePosition(characterIndex);
      
      // If we're jumping over a tag, reduce delay
      if (nextIndex - characterIndex > 1) {
        baseDelay *= 0.3; // Faster for tag processing
      }
    }
    
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

    // Normal character typing with HTML awareness
    timerId.current = setTimeout(() => {
      if (renderAsHTML) {
        // For HTML, ensure we get a safe substring
        const safeEndIndex = findSafeHtmlBreakpoint(text, nextIndex);
        setDisplayedText(text.slice(0, safeEndIndex));
        setCharacterIndex(safeEndIndex);
      } else {
        setDisplayedText(text.slice(0, nextIndex));
        setCharacterIndex(nextIndex);
      }
      
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
        <div dangerouslySetInnerHTML={createSafeMarkup(displayedText)} />
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
