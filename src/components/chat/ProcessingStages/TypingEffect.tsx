
import React, { useState, useEffect, useRef } from 'react';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';
import { createSafeMarkup } from '@/utils/sanitize';

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
  // Faster typing for reviewing and finalizing stages (professional appearance)
  const typingSpeedRef = useRef({ preparing: 40, processing: 30, finalizing: 25, reviewing: 35 });
  const pauseBeforeNewMessageRef = useRef(300);
  
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
      const randomVariation = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 multiplier
      const currentChar = targetMessage[typingIndex];
      
      // Pause longer after punctuation
      const isPunctuation = ['.', ',', '!', '?', ':'].includes(currentChar);
      const typingDelay = isPunctuation 
        ? typingSpeedRef.current[stage] * 3 * randomVariation 
        : typingSpeedRef.current[stage] * randomVariation;
      
      const timer = setTimeout(() => {
        setTypedOutput(targetMessage.substring(0, typingIndex + 1));
        setTypingIndex(prev => prev + 1);
      }, typingDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, stage, progress, typedOutput, typingIndex, targetMessage, currentMessageIndex, messageIndex]);

  // Professional styling for different stages
  const getBgColorClass = () => {
    switch(stage) {
      case 'reviewing':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'processing':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'finalizing':
        return 'bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const formattedOutput = htmlFormatter.applyHtmlFormatting(typedOutput);

  return (
    <div className={`text-sm text-gray-600 dark:text-gray-400 mt-3 p-2 ${getBgColorClass()} rounded border border-gray-200 dark:border-gray-700 min-h-[2rem]`}>
      <span dangerouslySetInnerHTML={createSafeMarkup(formattedOutput)} />
      <span className="animate-pulse inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500"></span>
    </div>
  );
};

export default TypingEffect;

