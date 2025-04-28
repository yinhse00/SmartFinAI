
import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ 
  text, 
  speed = 0.15, // Faster typing speed for better UX
  className = "", 
  onComplete,
  onProgress
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // When text changes completely, reset the animation
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  // Optimize the typing animation with larger batch processing
  useEffect(() => {
    if (currentIndex >= text.length) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }
    
    // Process characters in larger batches for better performance
    // Adjust batch size based on language and display speed needs
    const containsChinese = /[\u4e00-\u9fa5]/.test(text);
    const batchSize = containsChinese 
      ? Math.min(30, text.length - currentIndex) 
      : Math.min(20, text.length - currentIndex);

    const timer = setTimeout(() => {
      const nextBatch = text.substring(currentIndex, currentIndex + batchSize);
      setDisplayedText(prev => prev + nextBatch);
      setCurrentIndex(prevIndex => prevIndex + batchSize);
      
      // Notify parent about typing progress
      if (onProgress) {
        onProgress();
      }
    }, speed * batchSize * (containsChinese ? 0.7 : 1.0)); // Adjust timing based on language

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, isComplete, onComplete, onProgress]);

  return (
    <div className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-finance-medium-blue dark:bg-finance-accent-blue animate-pulse" />
      )}
    </div>
  );
};

export default TypingAnimation;
