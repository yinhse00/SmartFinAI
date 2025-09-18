import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Plus, Edit3, Loader2 } from 'lucide-react';
import { diffGenerator, type DiffResult } from '@/services/ipo/diffGenerator';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';

interface SimpleDiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  suggestedContent: string;
  onApply: () => void;
  isApplying?: boolean;
}

export const SimpleDiffPreviewModal: React.FC<SimpleDiffPreviewModalProps> = ({
  isOpen,
  onClose,
  originalContent,
  suggestedContent,
  onApply,
  isApplying = false
}) => {
  // Generate diff between original and suggested content
  const diffResult: DiffResult = React.useMemo(() => {
    return diffGenerator.generateFullDiff(originalContent, suggestedContent);
  }, [originalContent, suggestedContent]);

  // Format content for display
  const formattedOriginal = React.useMemo(() => {
    return ipoMessageFormatter.formatMessage(originalContent);
  }, [originalContent]);

  const formattedSuggested = React.useMemo(() => {
    return ipoMessageFormatter.formatMessage(suggestedContent);
  }, [suggestedContent]);

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'modification':
        return <Edit3 className="h-3 w-3 text-blue-600" />;
      default:
        return <CheckCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-l-4 border-l-green-500 dark:bg-green-900/20';
      case 'modification':
        return 'bg-blue-50 border-l-4 border-l-blue-500 dark:bg-blue-900/20';
      default:
        return 'bg-muted/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            AI Suggested Changes
            <Badge variant="outline" className="flex items-center gap-1">
              {diffResult.summary.additions > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Plus className="h-3 w-3" />
                  {diffResult.summary.additions} additions
                </span>
              )}
              {diffResult.summary.modifications > 0 && (
                <>
                  {diffResult.summary.additions > 0 && <span className="mx-1">•</span>}
                  <span className="flex items-center gap-1 text-blue-600">
                    <Edit3 className="h-3 w-3" />
                    {diffResult.summary.modifications} enhancements
                  </span>
                </>
              )}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {diffResult.description}
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {diffResult.changes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No changes to preview</p>
            </div>
          ) : (
            <div className="h-full">
              <h3 className="font-medium mb-3 text-sm text-muted-foreground">
                AI Suggested Changes ({diffResult.summary.additions} additions, {diffResult.summary.modifications} enhancements)
              </h3>
              <ScrollArea className="h-[calc(100%-2rem)] bg-muted/30 rounded-lg">
                <div className="p-4">
                  <div className="space-y-4">
                    {diffResult.changes.map((change, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${getChangeColor(change.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getChangeIcon(change.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {change.type === 'addition' ? 'New Content' : 'Enhancement'}
                              </span>
                            </div>
                            <div 
                              className="prose prose-sm w-full dark:prose-invert break-words overflow-wrap-anywhere"
                              dangerouslySetInnerHTML={{ 
                                __html: ipoMessageFormatter.formatMessage(change.content) 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Review the changes above and apply when ready
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={onApply} disabled={isApplying} className="min-w-32">
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply AI Suggestions'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};