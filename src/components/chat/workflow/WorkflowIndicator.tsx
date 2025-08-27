
import { AlertCircle, Database, Zap, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowPhase, getWorkflowStep } from './workflowConfig';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';

interface WorkflowIndicatorProps {
  currentStep: WorkflowPhase;
  stepProgress: string;
}

export const WorkflowIndicator = ({ currentStep, stepProgress }: WorkflowIndicatorProps) => {
  // Get all workflow steps from configuration
  const allSteps = [
    WorkflowPhase.ANALYSIS,
    WorkflowPhase.CONTEXT_GATHERING,
    WorkflowPhase.INTELLIGENT_PROCESSING,
    WorkflowPhase.RESPONSE_GENERATION,
    WorkflowPhase.VALIDATION
  ];

  // Find current step index
  const currentStepIndex = allSteps.findIndex(step => step === currentStep);
  
  const formattedStepProgress = htmlFormatter.applyHtmlFormatting(stepProgress);
  
  return (
    <div className="mb-4 pt-2">
      <div className="flex items-center justify-center mb-1">
        <span 
          className="text-xs text-gray-500 dark:text-gray-400"
          dangerouslySetInnerHTML={{ __html: formattedStepProgress }}
        />
      </div>
      
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {allSteps.map((stepPhase, index) => {
          const stepConfig = getWorkflowStep(stepPhase);
          if (!stepConfig) return null;

          // Determine if this step is active, completed, or upcoming
          const isActive = stepPhase === currentStep;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          // Get appropriate icon
          const getIcon = () => {
            switch (stepConfig.icon) {
              case 'brain': return <AlertCircle className="h-3 w-3" />;
              case 'database': return <Database className="h-3 w-3" />;
              case 'zap': return <Zap className="h-3 w-3" />;
              case 'message-square': return <MessageSquare className="h-3 w-3" />;
              case 'check-circle': return <CheckCircle2 className="h-3 w-3" />;
              default: return <AlertCircle className="h-3 w-3" />;
            }
          };
          
          return (
            <div key={stepPhase} className="flex flex-col items-center">
              {/* Step indicator */}
              <div 
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  isActive && "bg-blue-500 text-white",
                  isCompleted && "bg-green-500 text-white",
                  isUpcoming && "bg-gray-200 text-gray-500 dark:bg-gray-700"
                )}
              >
                {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
                {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                {isUpcoming && getIcon()}
              </div>
              
              {/* Step name - only show for active step */}
              {isActive && (
                <span className="text-xs mt-1 text-blue-500 font-medium">{stepConfig.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowIndicator;
