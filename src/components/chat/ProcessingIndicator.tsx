
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
  
  // Calculate estimated times based on stage
  useEffect(() => {
    if (!isVisible) return;
    
    // Different total time estimates based on stage
    const totalTimeEstimate = stage === 'preparing' ? 5 : 
                             stage === 'processing' ? 20 : 10;
    
    const timer = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(newElapsedTime);
      
      // Calculate progress percentage based on elapsed time and estimated total time
      // Cap at 95% so we don't show 100% until actually complete
      const calculatedProgress = Math.min(95, (newElapsedTime / totalTimeEstimate) * 100);
      setProgress(calculatedProgress);
      
      // Calculate remaining time
      const remainingSeconds = Math.max(0, totalTimeEstimate - newElapsedTime);
      setEstimatedTime(remainingSeconds > 60 
        ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s remaining` 
        : `${remainingSeconds}s remaining`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible, stage, startTime]);
  
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
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {stage === 'preparing' && 'Searching relevant regulatory context and processing query...'}
        {stage === 'processing' && 'Generating comprehensive response with financial details and references...'}
        {stage === 'finalizing' && 'Performing completeness checks and formatting the response...'}
      </div>
    </div>
  );
};

export default ProcessingIndicator;
