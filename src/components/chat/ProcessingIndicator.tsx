
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
  
  // More realistic time estimates based on stage and complexity
  useEffect(() => {
    if (!isVisible) return;
    
    // Different total time estimates based on stage
    // More realistic timeframes based on actual processing times
    const totalTimeEstimate = stage === 'preparing' ? 8 : 
                             stage === 'processing' ? 35 : 15;
    
    const timer = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(newElapsedTime);
      
      // Calculate progress percentage based on elapsed time and estimated total time
      // Cap at 95% so we don't show 100% until actually complete
      const calculatedProgress = Math.min(95, (newElapsedTime / totalTimeEstimate) * 100);
      setProgress(calculatedProgress);
      
      // Calculate remaining time with more accurate estimates
      const remainingSeconds = Math.max(0, totalTimeEstimate - newElapsedTime);
      setEstimatedTime(remainingSeconds > 60 
        ? `~${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s remaining` 
        : `~${remainingSeconds}s remaining`);
        
      // Update typed output based on stage
      updateTypedOutput(stage, calculatedProgress);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible, stage, startTime]);
  
  // Function to simulate typing effect based on stage
  const updateTypedOutput = (currentStage: string, progressPercent: number) => {
    let statusText = '';
    
    if (currentStage === 'preparing') {
      if (progressPercent < 30) {
        statusText = 'Analyzing query parameters...';
      } else if (progressPercent < 60) {
        statusText = 'Searching regulatory database...';
      } else {
        statusText = 'Extracting relevant context...';
      }
    } else if (currentStage === 'processing') {
      if (progressPercent < 20) {
        statusText = 'Preparing response structure...';
      } else if (progressPercent < 40) {
        statusText = 'Retrieving financial regulations...';
      } else if (progressPercent < 60) {
        statusText = 'Applying regulatory context...';
      } else if (progressPercent < 80) {
        statusText = 'Generating detailed explanation...';
      } else {
        statusText = 'Ensuring response completeness...';
      }
    } else if (currentStage === 'finalizing') {
      if (progressPercent < 30) {
        statusText = 'Validating response accuracy...';
      } else if (progressPercent < 70) {
        statusText = 'Formatting response...';
      } else {
        statusText = 'Performing final quality checks...';
      }
    }
    
    setTypedOutput(statusText);
  };
  
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
        {/* Flow chart representation */}
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center ${stage === 'preparing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full mr-1 ${stage === 'preparing' ? 'bg-finance-medium-blue animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
            Prepare
          </div>
          <div className="h-px w-12 bg-gray-300 dark:bg-gray-700"></div>
          <div className={`flex items-center ${stage === 'processing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full mr-1 ${stage === 'processing' ? 'bg-finance-medium-blue animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
            Process
          </div>
          <div className="h-px w-12 bg-gray-300 dark:bg-gray-700"></div>
          <div className={`flex items-center ${stage === 'finalizing' ? 'text-finance-medium-blue font-medium' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 rounded-full mr-1 ${stage === 'finalizing' ? 'bg-finance-medium-blue animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
            Finalize
          </div>
        </div>
        
        {/* Typing effect */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {typedOutput}<span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
