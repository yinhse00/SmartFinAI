import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  X, 
  ChevronDown,
  BookOpen,
  AlertCircle,
  Zap,
  FileText
} from 'lucide-react';
import { ContentSuggestion } from '@/services/ipo/realTimeAnalyzer';

interface SmartSuggestionsProps {
  suggestions: ContentSuggestion[];
  onApplySuggestion: (suggestion: ContentSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  className?: string;
}

interface FloatingSuggestionProps {
  suggestion: ContentSuggestion;
  position: { top: number; left: number };
  onApply: () => void;
  onDismiss: () => void;
}

const getSeverityIcon = (severity: ContentSuggestion['severity']) => {
  switch (severity) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeIcon = (type: ContentSuggestion['type']) => {
  switch (type) {
    case 'compliance':
      return <FileText className="h-4 w-4" />;
    case 'disclosure':
      return <BookOpen className="h-4 w-4" />;
    case 'enhancement':
      return <Zap className="h-4 w-4" />;
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: ContentSuggestion['severity']) => {
  switch (severity) {
    case 'error':
      return 'border-l-destructive bg-destructive/5';
    case 'warning':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'suggestion':
      return 'border-l-blue-500 bg-blue-50';
  }
};

const FloatingSuggestion: React.FC<FloatingSuggestionProps> = ({
  suggestion,
  position,
  onApply,
  onDismiss
}) => {
  return (
    <div
      className="fixed z-50 animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-100%)'
      }}
    >
      <Card className="p-3 shadow-lg border max-w-xs">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1">
            {getSeverityIcon(suggestion.severity)}
            {getTypeIcon(suggestion.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{suggestion.message}</p>
            {suggestion.details && (
              <p className="text-xs text-muted-foreground mt-1">{suggestion.details}</p>
            )}
            {suggestion.replacement && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Suggested:</p>
                <p className="text-xs bg-muted p-1 rounded">{suggestion.replacement}</p>
              </div>
            )}
            <div className="flex gap-1 mt-2">
              {suggestion.replacement && (
                <Button size="sm" onClick={onApply} className="h-6 text-xs">
                  Apply
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onDismiss} className="h-6 text-xs">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  className = ''
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [floatingSuggestion, setFloatingSuggestion] = useState<{
    suggestion: ContentSuggestion;
    position: { top: number; left: number };
  } | null>(null);

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const group = groups[suggestion.type] || [];
    groups[suggestion.type] = [...group, suggestion];
    return groups;
  }, {} as Record<string, ContentSuggestion[]>);

  const toggleExpanded = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleShowFloating = (suggestion: ContentSuggestion, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setFloatingSuggestion({
      suggestion,
      position: {
        top: rect.top,
        left: rect.left
      }
    });
  };

  const handleApplyFloating = () => {
    if (floatingSuggestion) {
      onApplySuggestion(floatingSuggestion.suggestion);
      setFloatingSuggestion(null);
    }
  };

  const handleDismissFloating = () => {
    if (floatingSuggestion) {
      onDismissSuggestion(floatingSuggestion.suggestion.id);
      setFloatingSuggestion(null);
    }
  };

  // Close floating suggestion when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setFloatingSuggestion(null);
    };

    if (floatingSuggestion) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [floatingSuggestion]);

  if (suggestions.length === 0) {
    return (
      <div className={`p-4 text-center text-muted-foreground ${className}`}>
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p className="text-sm">No suggestions at the moment.</p>
        <p className="text-xs">Keep writing for real-time analysis.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Smart Suggestions</h3>
          <Badge variant="outline" className="text-xs">
            {suggestions.length} item{suggestions.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
          <Collapsible key={type} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted/50 rounded">
              {getTypeIcon(type as ContentSuggestion['type'])}
              <span className="text-sm font-medium capitalize">
                {type.replace('_', ' ')} ({typeSuggestions.length})
              </span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-4">
              {typeSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border-l-4 p-3 rounded-r transition-all hover:shadow-sm ${getSeverityColor(suggestion.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityIcon(suggestion.severity)}
                        <p className="text-sm font-medium">{suggestion.message}</p>
                      </div>
                      
                      {suggestion.details && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.details}
                        </p>
                      )}

                      {suggestion.ruleReference && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {suggestion.ruleReference}
                        </Badge>
                      )}

                      {suggestion.replacement && (
                        <div className="bg-muted/50 p-2 rounded text-xs mb-2">
                          <p className="font-medium text-green-700">Suggested replacement:</p>
                          <p className="mt-1">{suggestion.replacement}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 ml-2">
                      {suggestion.replacement && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => onApplySuggestion(suggestion)}
                              className="h-7 px-2 text-xs"
                            >
                              Apply
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Apply this suggestion</TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowFloating(suggestion, e);
                            }}
                            className="h-7 px-2"
                          >
                            <Lightbulb className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Show floating suggestion</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismissSuggestion(suggestion.id)}
                            className="h-7 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dismiss suggestion</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Floating Suggestion */}
        {floatingSuggestion && (
          <FloatingSuggestion
            suggestion={floatingSuggestion.suggestion}
            position={floatingSuggestion.position}
            onApply={handleApplyFloating}
            onDismiss={handleDismissFloating}
          />
        )}
      </div>
    </TooltipProvider>
  );
};