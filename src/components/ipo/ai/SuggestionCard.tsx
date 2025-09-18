import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  X, 
  Edit3, 
  Eye, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

interface SuggestionCardProps {
  id: string;
  type: 'issue' | 'improvement';
  severity?: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  suggestedAction: string;
  confidence: number;
  citations?: string[];
  preview?: {
    before: string;
    after: string;
  };
  onApply: (id: string, customAction?: string) => void;
  onReject: (id: string) => void;
  onPreview: (id: string) => void;
  isApplying?: boolean;
  isRejected?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  id,
  type,
  severity,
  impact,
  title,
  description,
  reasoning,
  suggestedAction,
  confidence,
  citations,
  preview,
  onApply,
  onReject,
  onPreview,
  isApplying = false,
  isRejected = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customAction, setCustomAction] = useState(suggestedAction);

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (sev?: string) => {
    switch (sev) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactBadge = (imp?: string) => {
    const variant = imp === 'high' ? 'default' : imp === 'medium' ? 'secondary' : 'outline';
    return <Badge variant={variant} className="text-xs">{imp} impact</Badge>;
  };

  const handleApply = () => {
    onApply(id, isEditing ? customAction : undefined);
  };

  if (isRejected) {
    return (
      <Card className="border-muted bg-muted/30 opacity-60">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <X className="h-4 w-4" />
            <span>Suggestion rejected: {title}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${type === 'issue' ? 'border-l-red-500' : 'border-l-green-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              {getSeverityIcon(severity || impact)}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-medium">{title}</h4>
                {(severity || impact) && getImpactBadge(severity || impact)}
                <Badge variant="outline" className="text-xs">
                  {Math.round(confidence * 100)}% confidence
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Expanded Details */}
        {isExpanded && (
          <>
            <div className="space-y-2">
              <h5 className="text-xs font-medium">AI Reasoning:</h5>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {reasoning}
              </p>
            </div>

            {citations && citations.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium">Regulatory References:</h5>
                <div className="flex flex-wrap gap-1">
                  {citations.map((citation, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {citation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium">Content Preview:</h5>
                <div className="space-y-1">
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <span className="font-medium text-red-600">Before:</span>
                    <div className="text-red-800 mt-1">{preview.before}</div>
                  </div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="font-medium text-green-600">After:</span>
                    <div className="text-green-800 mt-1">{preview.after}</div>
                  </div>
                </div>
              </div>
            )}

            <Separator />
          </>
        )}

        {/* Suggested Action */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-medium">Suggested Action:</h5>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-5 px-2 text-xs"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
          
          {isEditing ? (
            <Textarea
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Customize the action..."
            />
          ) : (
            <p className="text-xs bg-muted/50 p-2 rounded">
              {suggestedAction}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={isApplying}
            className="text-xs h-7"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Apply
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(id)}
            className="text-xs h-7"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReject(id)}
            className="text-xs h-7 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};