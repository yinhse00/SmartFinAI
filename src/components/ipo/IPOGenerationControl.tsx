import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sparkles, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { useApiUsageSettings } from '@/hooks/useApiUsageSettings';
import { IPOContentGenerationRequest } from '@/types/ipo';

interface IPOGenerationControlProps {
  onGenerate: (request: IPOContentGenerationRequest) => Promise<void>;
  onRegenerate: (request: IPOContentGenerationRequest) => Promise<void>;
  isGenerating: boolean;
  hasContent: boolean;
  generationRequest: IPOContentGenerationRequest;
  estimatedTokens?: number;
  lastGenerated?: string;
}

export const IPOGenerationControl = ({
  onGenerate,
  onRegenerate,
  isGenerating,
  hasContent,
  generationRequest,
  estimatedTokens = 1000,
  lastGenerated
}: IPOGenerationControlProps) => {
  const { settings, incrementApiCallCounter, apiCallsToday } = useApiUsageSettings();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'generate' | 'regenerate'>('generate');

  // Estimate API cost based on tokens
  const estimatedCost = Math.ceil(estimatedTokens / 1000); // Rough estimate: 1 call per 1k tokens
  const isHighCost = estimatedCost > 3;
  const isNearLimit = apiCallsToday > 80;

  const handleGenerate = async (type: 'generate' | 'regenerate') => {
    // For economy mode or high-cost operations, show confirmation
    if (settings.manualContentLoading || isHighCost || isNearLimit) {
      setActionType(type);
      setShowConfirmDialog(true);
      return;
    }

    // Direct generation for automatic mode
    await executeGeneration(type);
  };

  const executeGeneration = async (type: 'generate' | 'regenerate') => {
    incrementApiCallCounter();
    
    if (type === 'generate') {
      await onGenerate(generationRequest);
    } else {
      await onRegenerate(generationRequest);
    }
    
    setShowConfirmDialog(false);
  };

  const getSectionDisplayName = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Content Generation
              </CardTitle>
              <CardDescription>
                Generate professional IPO content using AI
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && (
                <Badge variant="secondary" className="animate-pulse">
                  Generating...
                </Badge>
              )}
              {settings.manualContentLoading && (
                <Badge variant="outline">
                  Manual Mode
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Section Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">
                {getSectionDisplayName(generationRequest.section_type)}
              </p>
              <p className="text-sm text-muted-foreground">
                Target length: ~{estimatedTokens} tokens
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                Est. Cost: {estimatedCost} API call{estimatedCost > 1 ? 's' : ''}
              </p>
              {isHighCost && (
                <p className="text-xs text-orange-600">High cost operation</p>
              )}
            </div>
          </div>

          {/* API Usage Warning */}
          {(isNearLimit || isHighCost) && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm text-yellow-700">
                {isNearLimit && (
                  <p>You've made {apiCallsToday} API calls today. Consider using economy mode.</p>
                )}
                {isHighCost && (
                  <p>This operation requires multiple API calls due to content complexity.</p>
                )}
              </div>
            </div>
          )}

          {/* Last Generated Info */}
          {lastGenerated && hasContent && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last generated: {lastGenerated}</span>
            </div>
          )}

          {/* Progress bar for current generation */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Generating AI content...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!hasContent ? (
              <Button 
                onClick={() => handleGenerate('generate')}
                disabled={isGenerating}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => handleGenerate('regenerate')}
                disabled={isGenerating}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Content
              </Button>
            )}
          </div>

          {/* API Usage Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Today's usage: {apiCallsToday} calls</span>
            <span>Mode: {settings.mode}</span>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Confirm API Usage
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will {actionType} content for the {getSectionDisplayName(generationRequest.section_type)} section.
              </p>
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p><strong>Estimated cost:</strong> {estimatedCost} API call{estimatedCost > 1 ? 's' : ''}</p>
                <p><strong>Today's usage:</strong> {apiCallsToday} calls</p>
                <p><strong>Target tokens:</strong> ~{estimatedTokens}</p>
              </div>
              <p className="text-sm">
                Do you want to proceed with this generation?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeGeneration(actionType)}>
              Proceed ({estimatedCost} call{estimatedCost > 1 ? 's' : ''})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};