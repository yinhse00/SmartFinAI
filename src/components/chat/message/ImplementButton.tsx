import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Loader2 } from 'lucide-react';
import { SimpleDiffPreviewModal } from '@/components/ipo/SimpleDiffPreviewModal';
import { Message } from '../ChatMessage';
import { MergeStrategy } from '@/services/ipo/smartContentMerger';

interface ImplementButtonProps {
  message: Message;
  currentContent: string;
  onImplement: (suggestedContent: string, strategy?: MergeStrategy, segments?: string[]) => void;
  isImplementing?: boolean;
}

export const ImplementButton: React.FC<ImplementButtonProps> = ({
  message,
  currentContent,
  onImplement,
  isImplementing = false
}) => {
  const [showPreview, setShowPreview] = useState(false);

  if (!message.isDraftable || !message.suggestedContent) {
    return null;
  }

  const confidence = message.confidence || 0.7;
  const hasPreview = message.changePreview || (currentContent && message.suggestedContent);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleImplement = () => {
    if (message.suggestedContent) {
      onImplement(message.suggestedContent);
    }
    setShowPreview(false);
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              AI Suggestion Ready
            </span>
            <Badge variant="secondary" className={getConfidenceColor()}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Click "Implement" to apply this suggestion directly to your draft.
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-900/30"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={handleImplement}
            disabled={isImplementing}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isImplementing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Implement
          </Button>
        </div>
      </div>

      {showPreview && hasPreview && (
        <SimpleDiffPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          originalContent={currentContent}
          suggestedContent={message.suggestedContent || ''}
          onApply={handleImplement}
          isApplying={isImplementing}
        />
      )}
    </>
  );
};