import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  Check, 
  MoveRight,
  Copy,
  RefreshCw,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import { ContentFlag } from '@/services/ipo/contentRelevanceAnalyzer';

interface ContentFlagPanelProps {
  flags: ContentFlag[];
  onRemove: (flagId: string, sentence: string) => void;
  onKeep: (flagId: string) => void;
  onMove?: (flagId: string, sentence: string, targetSection: string) => void;
}

export const ContentFlagPanel: React.FC<ContentFlagPanelProps> = ({
  flags,
  onRemove,
  onKeep,
  onMove
}) => {
  const getFlagIcon = (flagType: ContentFlag['flagType']) => {
    switch (flagType) {
      case 'redundant':
        return <Copy className="h-3.5 w-3.5" />;
      case 'filler':
        return <MessageSquare className="h-3.5 w-3.5" />;
      case 'off-topic':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'misplaced':
        return <MoveRight className="h-3.5 w-3.5" />;
      default:
        return <Lightbulb className="h-3.5 w-3.5" />;
    }
  };

  const getFlagColor = (flagType: ContentFlag['flagType']) => {
    switch (flagType) {
      case 'redundant':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'filler':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'off-topic':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'misplaced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getFlagLabel = (flagType: ContentFlag['flagType']) => {
    switch (flagType) {
      case 'redundant':
        return 'Redundant';
      case 'filler':
        return 'Filler';
      case 'off-topic':
        return 'Off-topic';
      case 'misplaced':
        return 'Misplaced';
      default:
        return 'Review';
    }
  };

  if (flags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <div 
          key={flag.id} 
          className="bg-background border rounded-lg p-3 space-y-2"
        >
          {/* Header with type badge */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs flex items-center gap-1 ${getFlagColor(flag.flagType)}`}
            >
              {getFlagIcon(flag.flagType)}
              {getFlagLabel(flag.flagType)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(flag.confidence * 100)}% confidence
            </span>
          </div>

          {/* Flagged sentence */}
          <p className="text-sm italic text-muted-foreground line-clamp-2">
            "{flag.sentence}"
          </p>

          {/* Reason */}
          <p className="text-xs text-foreground">
            {flag.reason}
          </p>

          {/* Target section for misplaced content */}
          {flag.flagType === 'misplaced' && flag.targetSection && (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Suggested section: <strong>{flag.targetSection}</strong>
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {flag.suggestedAction === 'remove' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => onRemove(flag.id, flag.sentence)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
            
            {flag.suggestedAction === 'move' && flag.targetSection && onMove && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-purple-600"
                onClick={() => onMove(flag.id, flag.sentence, flag.targetSection!)}
              >
                <MoveRight className="h-3 w-3 mr-1" />
                Move to {flag.targetSection}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => onKeep(flag.id)}
            >
              <Check className="h-3 w-3 mr-1" />
              Keep
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
