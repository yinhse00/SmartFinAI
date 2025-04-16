
import React from 'react';

interface ProcessingHeaderProps {
  stage: 'preparing' | 'processing' | 'finalizing' | 'reviewing';
  estimatedTime: string;
  progress: number;
  elapsedTime: number;
}

const ProcessingHeader: React.FC<ProcessingHeaderProps> = ({ 
  stage, 
  estimatedTime, 
  progress, 
  elapsedTime 
}) => {
  return (
    <>
      <div className="flex justify-between mb-2">
        <div className="font-medium text-finance-dark-blue dark:text-finance-accent-blue">
          {stage === 'preparing' && 'Preparing regulatory context...'}
          {stage === 'reviewing' && 'Reviewing database for accuracy...'}
          {stage === 'processing' && 'Generating comprehensive financial response...'}
          {stage === 'finalizing' && 'Finalizing and validating response...'}
        </div>
        <div className="text-sm text-gray-500">
          {estimatedTime}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span className="font-medium">{Math.round(progress)}% complete</span>
        <span>Processing for {elapsedTime}s</span>
      </div>
    </>
  );
};

export default ProcessingHeader;
