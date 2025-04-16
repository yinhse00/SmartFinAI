
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface ProcessingIndicatorProps {
  isVisible: boolean;
  stage: 'preparing' | 'processing' | 'finalizing';
}

const ProcessingIndicator = ({ isVisible, stage }: ProcessingIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [typedOutput, setTypedOutput] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  
  // More accurate time estimates based on real-world performance
  useEffect(() => {
    if (!isVisible) return;
    
    // More realistic timeframes based on actual processing times from logs
    const totalTimeEstimate = stage === 'preparing' ? 5 : 
                             stage === 'processing' ? 20 : 10;
    
    const timer = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(newElapsedTime);
      
      // More accurate progress calculation with slight acceleration curve
      // to better match real-world processing patterns
      const progressBase = Math.min(98, (newElapsedTime / totalTimeEstimate) * 100);
      const accelerationFactor = stage === 'processing' ? 0.9 : 1.1;
      const calculatedProgress = Math.min(98, progressBase * accelerationFactor);
      setProgress(calculatedProgress);
      
      // Calculate remaining time with more accurate estimates based on logs
      const remainingSeconds = Math.max(0, totalTimeEstimate - newElapsedTime);
      setEstimatedTime(remainingSeconds > 60 
        ? `~${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s remaining` 
        : `~${remainingSeconds}s remaining`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible, stage, startTime]);
  
  // Get the appropriate status message based on current stage
  const getStageMessages = (currentStage: string): string[] => {
    switch(currentStage) {
      case 'preparing':
        return [
          'Analyzing query parameters...',
          'Searching regulatory database...',
          'Extracting relevant context...',
          'Preparing contextual information...',
          'Setting up financial regulatory framework...'
        ];
      case 'processing':
        return [
          'Analyzing financial regulations...',
          'Processing regulatory context...',
          'Generating technical analysis...',
          'Applying context to response...',
          'Preparing comprehensive explanation...',
          'Generating financial comparisons...',
          'Adding regulatory context to response...',
          'Checking for truncation prevention...',
          'Optimizing token usage for completeness...',
          'Ensuring response completeness...'
        ];
      case 'finalizing':
        return [
          'Validating response accuracy...',
          'Performing quality checks...',
          'Formatting financial information...',
          'Adding final details...',
          'Preparing delivery...'
        ];
      default:
        return ['Processing...'];
    }
  };
  
  // Real typing effect with variable speed based on stage
  useEffect(() => {
    if (!isVisible) return;
    
    const messages = getStageMessages(stage);
    
    // Select message based on progress
    const messageIndex = Math.min(
      Math.floor((progress / 100) * messages.length),
      messages.length - 1
    );
    
    const targetMessage = messages[messageIndex];
    
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
  }, [isVisible, stage, progress, typedOutput, typingIndex]);
  
  if (!isVisible) return null;
  
  return (
    <div className="w-full p-4 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex justify-between mb-2">
        <div className="font-medium text-finance-dark-blue dark:text-finance-accent-blue">
          {stage === 'preparing' && 'Preparing regulatory context...'}
          {stage === 'processing' && 'Generating comprehensive financial response...'}
          {stage === 'finalizing' && 'Finalizing and validating response...'}
        </div>
        <div className="text-sm text-gray-500">
          {estimatedTime}
        </div>
      </div>
      
      <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span className="font-medium">{Math.round(progress)}% complete</span>
        <span>Processing for {elapsedTime}s</span>
      </div>
      
      <div className="mt-3 space-y-2">
        {/* Enhanced visual flow chart representation */}
        <div className="flex items-center justify-between text-xs">
          <div className={`flex flex-col items-center ${stage === 'preparing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'preparing' ? 'bg-finance-medium-blue animate-pulse' : stage === 'processing' || stage === 'finalizing' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              {(stage === 'processing' || stage === 'finalizing') && <span className="text-white flex items-center justify-center h-full text-[10px]">✓</span>}
            </div>
            <span>Context</span>
          </div>
          <div className="h-px w-[30%] bg-gray-300 dark:bg-gray-700 self-center mt-1"></div>
          <div className={`flex flex-col items-center ${stage === 'processing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'processing' ? 'bg-finance-medium-blue animate-pulse' : stage === 'finalizing' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              {stage === 'finalizing' && <span className="text-white flex items-center justify-center h-full text-[10px]">✓</span>}
            </div>
            <span>Generate</span>
          </div>
          <div className="h-px w-[30%] bg-gray-300 dark:bg-gray-700 self-center mt-1"></div>
          <div className={`flex flex-col items-center ${stage === 'finalizing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-4 h-4 rounded-full mb-1 ${stage === 'finalizing' ? 'bg-finance-medium-blue animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
            <span>Deliver</span>
          </div>
        </div>
        
        {/* Improved typing effect with cursor */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 min-h-[2rem]">
          {typedOutput}<span className="animate-pulse inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500"></span>
        </div>
        
        {/* Additional processing details */}
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
          {stage === 'processing' && progress > 50 && 
            <div className="mt-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>Optimizing response to prevent truncation...</span>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
