
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import ProcessingStageIndicator from './ProcessingStages/ProcessingStageIndicator';
import TypingEffect from './ProcessingStages/TypingEffect';
import ProcessingHeader from './ProcessingStages/ProcessingHeader';
import StatusDetails from './ProcessingStages/StatusDetails';
import { getStageMessages } from './ProcessingStages/stageMessages';

interface ProcessingIndicatorProps {
  stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  isVisible?: boolean;
}

const ProcessingIndicator = ({ isVisible = true, stage }: ProcessingIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  
  // More accurate time estimates based on real-world performance
  useEffect(() => {
    if (!isVisible) return;
    
    // More realistic timeframes based on actual processing times from logs
    const totalTimeEstimate = stage === 'preparing' ? 5 : 
                             stage === 'processing' ? 20 : 
                             stage === 'reviewing' ? 8 : 10;
    
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
  
  if (!isVisible) return null;
  
  // Get the stage-specific messages
  const stageMessages = getStageMessages(stage);
  
  return (
    <div className="w-full p-4 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
      <ProcessingHeader 
        stage={stage} 
        estimatedTime={estimatedTime} 
        progress={progress}
        elapsedTime={elapsedTime}
      />
      
      <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
      
      <div className="mt-3 space-y-2">
        {/* Enhanced visual flow chart representation */}
        <ProcessingStageIndicator stage={stage} />
        
        {/* Improved typing effect with cursor */}
        <TypingEffect 
          messages={stageMessages}
          progress={progress}
          isVisible={isVisible}
          stage={stage}
        />
        
        {/* Additional processing details */}
        <StatusDetails stage={stage} progress={progress} />
      </div>
    </div>
  );
};

export default ProcessingIndicator;
