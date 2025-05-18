
import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  messages: string[];
  progress: number;
  isVisible: boolean;
  stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
}

const TypingEffect: React.FC<TypingEffectProps> = ({ messages, progress, isVisible, stage }) => {
  const [typedOutput, setTypedOutput] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);

  // Select message based on progress
  const messageIndex = Math.min(
    Math.floor((progress / 100) * messages.length),
    messages.length - 1
  );
  
  const targetMessage = messages[messageIndex];

  // Real typing effect with variable speed based on stage
  useEffect(() => {
    if (!isVisible) return;
    
    // Don't start over if we're showing the same message
    if (typedOutput === targetMessage) return;
    
    // Real typing effect
    const typingSpeed = stage === 'processing' ? 35 : 45; // ms per character
    
    if (typingIndex < targetMessage.length) {
      const timer = setTimeout(() => {
        setTypedOutput(targetMessage.substring(0, typingIndex + 1));
        setTypingIndex(prev => prev + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else if (typedOutput !== targetMessage) {
      // When switching to a new message
      setTypedOutput('');
      setTypingIndex(0);
    }
  }, [isVisible, stage, progress, typedOutput, typingIndex, targetMessage]);

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 min-h-[2rem]">
      {typedOutput}<span className="animate-pulse inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500"></span>
    </div>
  );
};

export default TypingEffect;
