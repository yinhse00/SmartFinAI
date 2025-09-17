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
  return;
};