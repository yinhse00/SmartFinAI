
import React, { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  typingSpeed?: number;  // Characters per second
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
  renderAsHTML?: boolean; // New prop to indicate if the content should be rendered as HTML
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  typingSpeed = 40,
  className = '',
  onComplete,
  onProgress,
  renderAsHTML = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);

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
    setCharacterIndex(0);
    setDisplayedText('');
    setIsPaused(false);
  }, [text]);

  // Typing effect
  useEffect(() => {
    if (characterIndex >= text.length) {
      onComplete && onComplete();
      return;
    }

    if (isPaused) return;

    let delay = 1000 / typingSpeed;

    // Slow down for punctuation for more natural typing
    const currentChar = text[characterIndex] || '';
    if (['.', '!', '?', '\n'].includes(currentChar)) {
      delay *= 4;
    } else if ([',', ';', ':'].includes(currentChar)) {
      delay *= 2;
    }

    // Check for code blocks or tables to pause briefly
    if (
      (characterIndex > 2 && text.slice(characterIndex - 3, characterIndex) === '```') ||
      (characterIndex > 0 && text.slice(characterIndex - 1, characterIndex) === '|')
    ) {
      delay *= 2;
    }

    timerId.current = setTimeout(() => {
      setDisplayedText(text.slice(0, characterIndex + 1));
      setCharacterIndex(prev => prev + 1);
      
      // Notify parent component of progress
      if (onProgress && characterIndex % 30 === 0) {
        onProgress();
      }
    }, delay);

    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, [characterIndex, text, typingSpeed, isPaused, onComplete, onProgress]);

  const handleClick = () => {
    if (characterIndex < text.length) {
      // If clicked before completion, show all text
      setDisplayedText(text);
      setCharacterIndex(text.length);
      onComplete && onComplete();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
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
