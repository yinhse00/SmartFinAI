import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileText, Zap } from 'lucide-react';

interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  beforeContent: string;
  afterContent: string;
  confidence: number;
  title?: string;
  description?: string;
}

export const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({
  isOpen,
  onClose,
  onApply,
  beforeContent,
  afterContent,
  confidence,
  title = "Apply AI Suggestion",
  description = "Review the suggested changes before applying them to your draft."
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const renderDiff = () => {
    // Simple diff visualization - highlight changes
    const beforeLines = beforeContent.split('\n');
    const afterLines = afterContent.split('\n');
    
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Current Content
          </h4>
          <ScrollArea className="h-64 border rounded-md p-3 bg-red-50">
            <div className="space-y-1">
              {beforeLines.map((line, index) => (
                <div key={index} className="text-sm">
                  <span className="text-red-600 mr-2">-</span>
                  <span className="line-through text-red-800">{line}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Suggested Content
          </h4>
          <ScrollArea className="h-64 border rounded-md p-3 bg-green-50">
            <div className="space-y-1">
              {afterLines.map((line, index) => (
                <div key={index} className="text-sm">
                  <span className="text-green-600 mr-2">+</span>
                  <span className="text-green-800">{line}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {title}
              <Badge 
                variant="outline" 
                className={getConfidenceColor(confidence)}
              >
                {Math.round(confidence * 100)}% confidence
              </Badge>
            </DialogTitle>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {renderDiff()}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Changes will be applied to your current draft. You can undo this action later.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onApply} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};