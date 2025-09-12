import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, X, Send, Sparkles, CheckCircle, AlertTriangle, Info, Loader2, Lightbulb, FileCheck, Target } from 'lucide-react';
import { useEnhancedIPOAIChat } from '@/hooks/useEnhancedIPOAIChat';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';
import { complianceValidator } from '@/services/ipo/complianceValidator';
interface WordLikeAIPanelProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (content: string) => void;
  onClose: () => void;
}
export const WordLikeAIPanel: React.FC<WordLikeAIPanelProps> = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate,
  onClose
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [complianceData, setComplianceData] = useState<any>(null);
  const {
    messages,
    isProcessing,
    currentAnalysis,
    processMessage,
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
      complianceValidator.getComplianceScore(currentContent, selectedSection).then(setComplianceData).catch(console.error);
    }
  }, [currentContent, selectedSection]);
  const handleSendMessage = () => {
    if (inputMessage.trim() && !isProcessing) {
      processMessage(inputMessage);
      setInputMessage('');
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
  return <div className="h-full flex flex-col border-l bg-background">
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
          
          {(complianceScore !== undefined || complianceData) && <div className="flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              <span>Compliance: {complianceData?.overall || complianceScore?.overall || 0}%</span>
            </div>}
          {totalSuggestions > 0 && <Badge variant="outline" className="text-xs">
              {totalSuggestions} suggestions
            </Badge>}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Analysis Section */}
        {(suggestions.length > 0 || isAnalyzing) && <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Content Analysis</span>
              {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            
            {suggestions.length > 0 && <div className="space-y-2 max-h-40 overflow-y-auto">
                {suggestions.slice(0, 3).map(suggestion => <div key={suggestion.id} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(suggestion.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{suggestion.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.details || `${suggestion.type} issue`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => applySuggestion(suggestion, onContentUpdate)}>
                            Apply
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => dismissSuggestion(suggestion.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>}
          </div>}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>}
                  
                  {/* AI suggestion actions */}
                  {message.type === 'ai' && message.proactiveAnalysis && <div className="mt-3 space-y-2">
                      <div className="bg-background/50 rounded p-2">
                        <p className="text-xs font-medium">AI Analysis Available</p>
                        <p className="text-xs text-muted-foreground">Click to view detailed insights</p>
                        <Button size="sm" variant="outline" className="h-6 text-xs mt-1" onClick={refreshAnalysis}>
                          View Analysis
                        </Button>
                      </div>
                    </div>}
                  
                  {/* Direct content suggestion */}
                  {message.type === 'ai' && message.targetedEdits && message.targetedEdits.length > 0 && <Button size="sm" variant="outline" className="h-6 text-xs mt-2" onClick={() => applyDirectSuggestion(message.suggestedContent || message.content)}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Apply Suggestion
                    </Button>}
                </div>
              </div>)}
            
            {isProcessing && <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is analyzing and responding...
                  </div>
                </div>
              </div>}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input placeholder="Ask AI to improve your document..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyPress} disabled={isProcessing} />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isProcessing} size="sm">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Quick actions */}
          
        </div>
      </div>
    </div>;
};