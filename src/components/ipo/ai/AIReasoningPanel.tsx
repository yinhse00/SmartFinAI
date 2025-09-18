import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, AlertTriangle, Clock, Info, Loader2 } from 'lucide-react';
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
    <Card className="bg-muted/50 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Reasoning Process
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {reasoningSteps.map((step) => (
              <div key={step.id} className="border rounded-lg p-3 bg-background">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <Badge variant={getStepBadgeVariant(step.status)} className="text-xs">
                        {step.status}
                      </Badge>
                      {step.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(step.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.citations && step.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {step.citations.map((citation, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {step.id === currentStep && step.status === 'processing' && (
                  <div className="mt-2 pl-7">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {reasoningSteps.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No reasoning steps available
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};