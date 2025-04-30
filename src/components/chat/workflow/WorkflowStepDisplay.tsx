
import React from 'react';
import { CheckCircle, CircleDashed, Loader2 } from 'lucide-react';

interface WorkflowStepDisplayProps {
  steps: {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
  }[];
}

const WorkflowStepDisplay: React.FC<WorkflowStepDisplayProps> = ({ steps }) => {
  return (
    <div className="px-4 py-2">
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            {step.status === 'pending' && (
              <CircleDashed className="h-5 w-5 text-gray-400 mt-0.5" />
            )}
            {step.status === 'active' && (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
            )}
            {step.status === 'completed' && (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            {step.status === 'skipped' && (
              <CircleDashed className="h-5 w-5 text-gray-300 mt-0.5" />
            )}
            
            <div>
              <h4 className={`font-medium text-sm ${step.status === 'active' ? 'text-blue-700 dark:text-blue-400' : 
                step.status === 'completed' ? 'text-green-700 dark:text-green-400' : 
                step.status === 'skipped' ? 'text-gray-400' : 'text-gray-600'}`}>
                {step.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowStepDisplay;
