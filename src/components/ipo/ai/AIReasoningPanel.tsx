import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';

interface ReasoningStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'processing' | 'pending';
  confidence?: number;
  citations?: string[];
}

interface AIReasoningPanelProps {
  reasoningSteps: ReasoningStep[];
  currentStep?: string;
  isProcessing: boolean;
}

export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({
  reasoningSteps,
  currentStep,
  isProcessing
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Analysis Process
          {isProcessing && <Badge variant="secondary" className="text-xs">Processing</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {reasoningSteps.map((step, index) => (
              <div key={step.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{step.title}</h4>
                      <Badge variant={getStepBadgeVariant(step.status)} className="text-xs">
                        {step.status}
                      </Badge>
                      {step.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(step.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.citations && step.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step.citations.map((citation, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {index < reasoningSteps.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
            <Clock className="h-3 w-3 animate-spin" />
            <span>AI is analyzing your content and regulatory requirements...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};