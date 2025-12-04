import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Loader2,
  Lightbulb,
  FileCheck,
  Target,
  MousePointerClick,
  Minimize2,
  FileText,
  Languages,
  Scale,
  Eye
} from 'lucide-react';
import { useEnhancedIPOAIChat } from '@/hooks/useEnhancedIPOAIChat';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';
import { TransparentAIPanel } from '@/components/ipo/ai/TransparentAIPanel';
import { MessageFormatter } from '@/components/ipo/ai/MessageFormatter';
import { ImplementButton } from '@/components/chat/message/ImplementButton';
import { complianceValidator } from '@/services/ipo/complianceValidator';
import { Message } from '@/components/chat/ChatMessage';
import { TextSelection } from '@/types/textSelection';
import { ContentFlagPanel } from './ContentFlagPanel';
import { ContentFlag } from '@/services/ipo/contentRelevanceAnalyzer';

interface WordLikeAIPanelProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (content: string) => void;
  onClose: () => void;
  useTransparentMode?: boolean;
  currentSelection?: TextSelection | null;
  onSelectionUpdate?: (oldText: string, newText: string) => void;
}

export const WordLikeAIPanel: React.FC<WordLikeAIPanelProps> = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate,
  onClose,
  useTransparentMode = false,
  currentSelection,
  onSelectionUpdate
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [complianceData, setComplianceData] = useState<any>(null);
  
  const {
    messages,
    isProcessing,
    currentAnalysis,
    contentFlags,
    setContentFlags,
    processMessage,
    processSelectionMessage,
    applyAutoFix,
    applyImprovement,
    refreshAnalysis,
    applyDirectSuggestion
  } = useEnhancedIPOAIChat({
    projectId,
    selectedSection,
    currentContent,
    onContentUpdate
  });

  const {
    suggestions,
    complianceScore,
    isAnalyzing,
    applySuggestion,
    dismissSuggestion,
    totalSuggestions,
    errorCount,
    warningCount,
    wordCount
  } = useRealTimeAnalysis({
    content: currentContent,
    sectionType: selectedSection,
    isEnabled: true,
    debounceMs: 2000
  });

  // Enhanced compliance monitoring
  useEffect(() => {
    if (currentContent.length > 100) {
      complianceValidator.getComplianceScore(currentContent, selectedSection)
        .then(setComplianceData)
        .catch(console.error);
    }
  }, [currentContent, selectedSection]);

  const hasSelection = currentSelection && currentSelection.text.trim().length >= 10;

  // Handlers for content flags
  const handleRemoveFlag = (flagId: string, sentence: string) => {
    // Remove the sentence from content
    const sentenceToRemove = sentence.replace(/\.\.\.$/, ''); // Remove trailing ellipsis
    const newContent = currentContent.replace(sentenceToRemove, '').replace(/\s{2,}/g, ' ').trim();
    onContentUpdate(newContent);
    setContentFlags(prev => prev.filter(f => f.id !== flagId));
  };

  const handleKeepFlag = (flagId: string) => {
    setContentFlags(prev => prev.filter(f => f.id !== flagId));
  };

  const handleMoveFlag = (flagId: string, sentence: string, targetSection: string) => {
    // For now, just remove the flag - actual moving requires section context
    console.log(`📦 User wants to move content to ${targetSection}:`, sentence.substring(0, 50));
    setContentFlags(prev => prev.filter(f => f.id !== flagId));
  };
  const handleSendMessage = () => {
    if (inputMessage.trim() && !isProcessing) {
      if (hasSelection && onSelectionUpdate) {
        // Selection-based amendment
        processSelectionMessage(inputMessage, currentSelection!, onSelectionUpdate);
      } else {
        // Full document amendment
        processMessage(inputMessage);
      }
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  // Use Transparent AI Panel if requested
  if (useTransparentMode) {
    return (
      <TransparentAIPanel
        projectId={projectId}
        selectedSection={selectedSection}
        currentContent={currentContent}
        onContentUpdate={onContentUpdate}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Writing Assistant</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Document metrics */}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span>{wordCount} words</span>
          {(complianceScore !== undefined || complianceData) && (
            <div className="flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              <span>Compliance: {complianceData?.overall || complianceScore?.overall || 0}%</span>
            </div>
          )}
          {totalSuggestions > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalSuggestions} suggestions
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Selection Mode Indicator */}
        {hasSelection && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <MousePointerClick className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-800 dark:text-blue-200">Selection Mode Active</span>
              <Badge variant="secondary" className="text-xs">
                {currentSelection!.text.length} chars
              </Badge>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 italic line-clamp-2 mb-2">
              "{currentSelection!.text.substring(0, 80)}{currentSelection!.text.length > 80 ? '...' : ''}"
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              AI will only amend the selected text while preserving context
            </p>
            
            {/* Quick actions for selection */}
            <div className="flex flex-wrap gap-1.5">
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 text-xs"
                onClick={() => handleQuickAction('Improve clarity and readability')}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Improve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 text-xs"
                onClick={() => handleQuickAction('Make this more concise')}
              >
                <Minimize2 className="h-3 w-3 mr-1" />
                Shorten
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 text-xs"
                onClick={() => handleQuickAction('Expand with more detail')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Expand
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 text-xs"
                onClick={() => handleQuickAction('Check HKEX compliance')}
              >
                <Scale className="h-3 w-3 mr-1" />
                Compliance
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Section */}
        {(suggestions.length > 0 || isAnalyzing) && !hasSelection && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Content Analysis</span>
              {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <div key={suggestion.id} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(suggestion.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{suggestion.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.details || `${suggestion.type} issue`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => applySuggestion(suggestion, onContentUpdate)}
                          >
                            Apply
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => dismissSuggestion(suggestion.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Flags Panel - shown after format revision */}
        {contentFlags.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
                Content Review Suggestions
              </span>
              <Badge variant="secondary" className="text-xs">
                {contentFlags.length} items
              </Badge>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              These items may need review - you can remove, keep, or move them.
            </p>
            <ContentFlagPanel
              flags={contentFlags}
              onRemove={handleRemoveFlag}
              onKeep={handleKeepFlag}
              onMove={handleMoveFlag}
            />
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const standardMessage: Message = {
                id: `msg_${index}`,
                content: message.content,
                isUser: message.type === 'user',
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
                confidence: message.confidence,
                suggestedContent: message.suggestedContent,
                isDraftable: !!message.suggestedContent || (message.targetedEdits && message.targetedEdits.length > 0),
                changePreview: message.changePreview
              };

              return (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.type === 'user' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <>
                        <MessageFormatter content={message.content} />
                        {(message.suggestedContent || (message.targetedEdits && message.targetedEdits.length > 0)) && (
                          <ImplementButton
                            message={standardMessage}
                            currentContent={currentContent}
                            onImplement={applyDirectSuggestion}
                            isImplementing={isProcessing}
                          />
                        )}
                      </>
                    )}
                    
                    {message.timestamp && (
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is analyzing and responding...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask AI to improve your document..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isProcessing}
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setInputMessage('Improve the clarity and flow of this section')}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Improve Clarity
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setInputMessage('Check content against HKEX regulatory requirements and industry templates')}
            >
              <FileCheck className="h-3 w-3 mr-1" />
              Full Assessment
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={refreshAnalysis}
            >
              Refresh Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};