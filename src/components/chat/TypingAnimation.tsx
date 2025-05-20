
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
  initialVisibleChars = 120 // Increased from 60 to 120 for faster initial display
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const contentPriority = useRef<{ highPriority: string; normalPriority: string }>({ highPriority: '', normalPriority: '' });
  const animationActive = useRef(true);
  
  // Process content on initial render to identify high-priority segments
  useEffect(() => {
    console.log(`Typing animation starting with ${text?.length || 0} chars of text`);
    animationActive.current = true;
    
    // Identify high-priority content (first sentence, important elements)
    const firstSentenceMatch = text?.match(/^(.*?[.!?])\s/);
    const firstSentence = firstSentenceMatch ? firstSentenceMatch[1] : text?.substring(0, Math.min(150, text?.length || 0)) || '';
    
    contentPriority.current = {
      highPriority: firstSentence,
      normalPriority: text?.substring(firstSentence.length) || ''
    };
    
    // Show initial characters immediately for perceived responsiveness
    if (initialVisibleChars > 0 && text && text.length > 0) {
      setDisplayedText(text.substring(0, Math.min(initialVisibleChars, text.length)));
      setCharacterIndex(Math.min(initialVisibleChars, text.length));
    }
  }, [text, initialVisibleChars]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      animationActive.current = false;
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);

  // Reset when text changes
  useEffect(() => {
    if (!text) {
      console.log('Text is empty or undefined in TypingAnimation');
      return;
    }
    
    setCharacterIndex(initialVisibleChars > 0 ? Math.min(initialVisibleChars, text.length) : 0);
    setDisplayedText(initialVisibleChars > 0 ? text.substring(0, Math.min(initialVisibleChars, text.length)) : '');
    setIsPaused(false);
    
    // Log if text changed
    console.log(`Text changed in TypingAnimation, new length: ${text.length}`);
  }, [text, initialVisibleChars]);

  // Enhanced typing effect with adaptive speed
  useEffect(() => {
    if (!text) return;
    
    if (characterIndex >= text.length) {
      if (onComplete && animationActive.current) {
        console.log('Typing animation complete');
        onComplete();
      }
      return;
    }

    if (isPaused) return;

    // Base typing speed - increased for more responsive typing
    let baseDelay = 1000 / (typingSpeed * 2); // Double the speed from previous implementation
    
    // Adaptive typing speed based on content
    const currentChar = text[characterIndex] || '';
    const nextChars = text.substring(characterIndex, characterIndex + 10);
    
    // Content-aware speed adjustments - optimized for better UX
    if (['.', '!', '?'].includes(currentChar)) {
      baseDelay *= 1.8; // Reduced pause after sentences for better flow
    } else if ([',', ';', ':'].includes(currentChar)) {
      baseDelay *= 1.2; // Shorter pause for punctuation
    } else if (currentChar === '\n' || (currentChar === ' ' && nextChars.includes('\n'))) {
      baseDelay *= 1.5; // Moderate pause at paragraph breaks
    } else if (characterIndex < 200) {
      baseDelay *= 0.5; // Even faster at the beginning for improved responsiveness
    } else if (text.length - characterIndex < 100) {
      baseDelay *= 1.1; // Slight slowdown at the end
    }
    
    // Special content-based speed adjustments
    if (nextChars.includes('```') || nextChars.includes('|')) {
      baseDelay *= 0.2; // Speed through code blocks and tables even more
    } else if (nextChars.includes('*') || nextChars.includes('1.')) {
      baseDelay *= 0.4; // Speed through list elements
    }
    
    // Handle HTML tags specially with improved detection
    if (renderAsHTML) {
      if (currentChar === '<') {
        const tagEndIndex = text.indexOf('>', characterIndex);
        if (tagEndIndex > characterIndex) {
          const tagContent = text.substring(characterIndex, tagEndIndex + 1);
          
          // Display tags immediately for smoother HTML rendering
          timerId.current = setTimeout(() => {
            if (animationActive.current) {
              setDisplayedText(prev => text.slice(0, tagEndIndex + 1));
              setCharacterIndex(tagEndIndex + 1);
              
              // Notify progress
              if (onProgress) onProgress();
            }
          }, 10); // Very fast rendering for HTML tags
          
          return;
        }
      }
    }

    // Chunk typing for better performance and smoother animation
    const remainingLength = text.length - characterIndex;
    let chunkSize = 1; // Default to one character at a time
    
    // For very long text, increase chunk size proportionally for better performance
    if (remainingLength > 2000) {
      chunkSize = Math.floor(remainingLength / 400); // Dynamic chunking
    } else if (remainingLength > 1000) {
      chunkSize = Math.floor(remainingLength / 500); // Dynamic chunking
    } else if (remainingLength > 500) {
      chunkSize = 2;
    }

    // Normal character typing with chunking
    timerId.current = setTimeout(() => {
      if (animationActive.current) {
        const nextIndex = Math.min(characterIndex + chunkSize, text.length);
        setDisplayedText(text.slice(0, nextIndex));
        setCharacterIndex(nextIndex);
        
        // Notify parent component of progress
        if (onProgress && characterIndex % 10 === 0) {
          onProgress();
        }
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
    if (text && characterIndex < text.length) {
      // If clicked before completion, show all text
      console.log('Typing animation skipped by click');
      setDisplayedText(text);
      setCharacterIndex(text.length);
      onComplete && onComplete();
    }
  };

  // If no text, return empty div
  if (!text) {
    return <div className={className}></div>;
  }

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
