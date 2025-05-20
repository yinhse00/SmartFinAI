
import React, { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  messages: string[];
  progress: number;
  isVisible: boolean;
  stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
}

const TypingEffect: React.FC<TypingEffectProps> = ({ messages, progress, isVisible, stage }) => {
  const [typedOutput, setTypedOutput] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const previousStage = useRef(stage);
  const typingSpeedRef = useRef({ preparing: 20, processing: 15, finalizing: 18, reviewing: 25 }); // Faster speeds
  const pauseBeforeNewMessageRef = useRef(200); // Reduced pause
  
  // Select message based on progress
  const messageIndex = Math.min(
    Math.floor((progress / 100) * messages.length),
    messages.length - 1
  );
  
  // When stage changes, choose a new message
  useEffect(() => {
    if (previousStage.current !== stage) {
      previousStage.current = stage;
      setTypingIndex(0);
      setTypedOutput('');
      setCurrentMessageIndex(messageIndex);
    }
  }, [stage, messageIndex]);
  
  const targetMessage = messages[currentMessageIndex];

  // Enhanced typing effect with variable speed and natural pauses
  useEffect(() => {
    if (!isVisible || !targetMessage) return;
    
    // If we're showing a complete message and progress indicates we should move to the next one
    if (typedOutput === targetMessage && currentMessageIndex !== messageIndex) {
      const timer = setTimeout(() => {
        setCurrentMessageIndex(messageIndex);
        setTypingIndex(0);
        setTypedOutput('');
      }, pauseBeforeNewMessageRef.current);
      
      return () => clearTimeout(timer);
    }
    
    // Real typing effect with natural rhythm
    if (typingIndex < targetMessage.length) {
      // Vary typing speed slightly for realism
      const randomVariation = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 multiplier
      const currentChar = targetMessage[typingIndex];
      
      // Pause longer after punctuation
      const isPunctuation = ['.', ',', '!', '?', ':'].includes(currentChar);
      const typingDelay = isPunctuation 
        ? typingSpeedRef.current[stage] * 2 * randomVariation 
        : typingSpeedRef.current[stage] * randomVariation;
      
      const timer = setTimeout(() => {
        setTypedOutput(targetMessage.substring(0, typingIndex + 1));
        setTypingIndex(prev => prev + 1);
      }, typingDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, stage, progress, typedOutput, typingIndex, targetMessage, currentMessageIndex, messageIndex]);

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 min-h-[2rem]">
      {typedOutput}<span className="animate-pulse inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500"></span>
    </div>
  );
};

export default TypingEffect;
