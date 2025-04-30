
import { AlertCircle, BookOpen, FileText, CheckCircle2, BarChart2, Loader2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface WorkflowIndicatorProps {
  currentStep: 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';
  stepProgress: string;
  isApiKeyRotating?: boolean;
}

export const WorkflowIndicator = ({ 
  currentStep, 
  stepProgress, 
  isApiKeyRotating = false 
}: WorkflowIndicatorProps) => {
  // Define all workflow steps
  const steps: WorkflowStep[] = [
    {
      id: 'initial',
      name: 'Initial Analysis',
      description: 'Analyzing and classifying your query',
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      id: 'listingRules',
      name: 'Listing Rules',
      description: 'Searching through Listing Rules',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      id: 'takeoversCode',
      name: 'Takeovers Code',
      description: 'Checking Takeovers Code regulations',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'execution',
      name: 'Execution Guidance',
      description: 'Finding relevant process documentation',
      icon: <BarChart2 className="h-4 w-4" />
    },
    {
      id: 'response',
      name: 'Response Generation',
      description: 'Compiling final answer',
      icon: <CheckCircle2 className="h-4 w-4" />
    }
  ];

  // Find current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Calculate percentage of completion
  const totalSteps = steps.length;
  const completionPercentage = currentStep === 'complete' 
    ? 100 
    : Math.round(((currentStepIndex + 0.5) / totalSteps) * 100);
  
  // Track elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Start timer when we enter a new step
  useEffect(() => {
    if (currentStep === 'complete') return;
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentStep]);
  
  // Format elapsed time for display
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };
  
  return (
    <div className="mb-4 pt-2 bg-background">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {stepProgress}
          {isApiKeyRotating && (
            <span className="ml-2 flex items-center gap-1 text-blue-500">
              <KeyRound size={10} className="animate-pulse" />
              <span>Rotating API keys</span>
            </span>
          )}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-finance-dark-blue">{completionPercentage}% complete</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">{formatElapsedTime(elapsedTime)} elapsed</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center max-w-xs mx-auto">
        {steps.map((step, index) => {
          // Determine if this step is active, completed, or upcoming
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
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
                {isUpcoming && step.icon}
              </div>
              
              {/* Step name - only show for active step */}
              {isActive && (
                <span className="text-xs mt-1 text-blue-500 font-medium">{step.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowIndicator;
