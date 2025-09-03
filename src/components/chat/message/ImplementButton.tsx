import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Loader2 } from 'lucide-react';
import { ContentPreviewModal } from '@/components/ipo/ContentPreviewModal';
import { Message } from '../ChatMessage';

interface ImplementButtonProps {
  message: Message;
  currentContent: string;
  onImplement: (suggestedContent: string) => void;
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
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-800">
              AI Suggestion Ready
            </span>
            <Badge variant="secondary" className={getConfidenceColor()}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          <p className="text-xs text-blue-600">
            Click "Implement" to apply this suggestion directly to your draft.
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={handleImplement}
            disabled={isImplementing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
        <ContentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onApply={handleImplement}
          beforeContent={message.changePreview?.before || currentContent}
          afterContent={message.changePreview?.after || message.suggestedContent || ''}
          confidence={confidence}
          title="Apply AI Suggestion"
          description="Review the changes before applying them to your IPO draft."
        />
      )}
    </>
  );
};