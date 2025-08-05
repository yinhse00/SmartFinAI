import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Brain, Zap, CheckCircle, 
  Loader2, Clock, TrendingUp 
} from 'lucide-react';

interface IPOProcessingIndicatorProps {
  stage: 'preparing' | 'fetching' | 'generating' | 'analyzing' | 'saving';
  progress: number;
  isVisible: boolean;
}

export const IPOProcessingIndicator: React.FC<IPOProcessingIndicatorProps> = ({
  stage,
  progress,
  isVisible
}) => {
  if (!isVisible) return null;

  const getStageInfo = (currentStage: string) => {
    const stages = {
      preparing: {
        icon: <Zap className="h-4 w-4" />,
        title: 'Preparing Enhanced Generation',
        description: 'Initializing parallel processing workflow...',
        color: 'bg-blue-500'
      },
      fetching: {
        icon: <Database className="h-4 w-4" />,
        title: 'Fetching Data in Parallel',
        description: 'Gathering project details, templates, and regulatory guidance...',
        color: 'bg-purple-500'
      },
      generating: {
        icon: <Brain className="h-4 w-4" />,
        title: 'AI Content Generation',
        description: 'Creating comprehensive prospectus content with enhanced context...',
        color: 'bg-green-500'
      },
      analyzing: {
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Quality Analysis',
        description: 'Analyzing compliance, accuracy, and professional standards...',
        color: 'bg-orange-500'
      },
      saving: {
        icon: <CheckCircle className="h-4 w-4" />,
        title: 'Background Processing',
        description: 'Saving content and preparing final delivery...',
        color: 'bg-emerald-500'
      }
    };
    
    return stages[currentStage] || stages.preparing;
  };

  const stageInfo = getStageInfo(stage);
  const estimatedTimeRemaining = Math.max(0, Math.round((100 - progress) / 20));

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full ${stageInfo.color} flex items-center justify-center text-white`}>
            {progress === 100 ? <CheckCircle className="h-4 w-4" /> : stageInfo.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{stageInfo.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round(progress)}%
                </Badge>
                {estimatedTimeRemaining > 0 && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{estimatedTimeRemaining}s
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{stageInfo.description}</p>
          </div>
        </div>
        
        <Progress value={progress} className="h-2 mb-2" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Parallel processing active</span>
          </div>
          <span>35-55% faster than standard generation</span>
        </div>
      </CardContent>
    </Card>
  );
};