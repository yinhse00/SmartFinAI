import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, Send, Bot, User, Loader2, Brain, ChevronDown, ChevronUp, 
  Minimize2, AlertCircle, Settings, Eye, CheckCircle 
} from 'lucide-react';
import { useTransparentAIChat } from '@/hooks/useTransparentAIChat';
import { AIReasoningPanel } from './AIReasoningPanel';
import { SuggestionCard } from './SuggestionCard';
import { PreviewDiffViewer } from './PreviewDiffViewer';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Message } from '@/components/chat/ChatMessage';
import { hasGrokApiKey, hasGoogleApiKey } from '@/services/apiKeyService';
import { useNavigate } from 'react-router-dom';

interface TransparentAIPanelProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
  onClose: () => void;
}

export const TransparentAIPanel: React.FC<TransparentAIPanelProps> = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate,
  onClose
}) => {
  const {
    messages,
    isProcessing,
    currentAnalysis,
    rejectedSuggestions,
    processMessage,
    applySuggestion,
    rejectSuggestion,
    previewSuggestion,
    applyDirectSuggestion,
    refreshAnalysis,
    analyzeCurrentContent
  } = useTransparentAIChat({
    projectId,
    selectedSection,
    currentContent,
    onContentUpdate
  });

  const [inputValue, setInputValue] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePreview, setActivePreview] = useState<any>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState({
    hasKey: false,
    provider: undefined as string | undefined
  });
  
  const navigate = useNavigate();

  // Auto-analyze content when it changes
  useEffect(() => {
    if (currentContent && currentContent.trim().length > 50) {
      analyzeCurrentContent();
    }
  }, [currentContent, analyzeCurrentContent]);

  // Check API key status
  useEffect(() => {
    const checkApiKeys = () => {
      let hasKey = false;
      let provider = undefined;
      
      if (hasGrokApiKey()) {
        hasKey = true;
        provider = 'Grok';
      } else if (hasGoogleApiKey()) {
        hasKey = true;
        provider = 'Google';
      }
      
      setApiKeyStatus({ hasKey, provider });
    };
    
    checkApiKeys();
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;
    processMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionApply = async (suggestionId: string, customAction?: string) => {
    await applySuggestion(suggestionId, customAction);
  };

  const handleSuggestionPreview = async (suggestionId: string) => {
    await previewSuggestion(suggestionId);
  };

  const currentReasoning = messages
    .filter(msg => msg.reasoning && msg.reasoning.length > 0)
    .map(msg => msg.reasoning!)
    .flat()
    .slice(-5); // Show last 5 reasoning steps

  return (
    <Card className={`${isCollapsed ? 'h-auto' : 'h-full'} rounded-none border-0 border-l transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Transparent AI Assistant
            {!apiKeyStatus.hasKey && <AlertCircle className="h-4 w-4 text-amber-500" />}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-7 w-7 p-0">
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            {!apiKeyStatus.hasKey && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-800">API key required for AI assistance</p>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => navigate('/profile')}>
                  <Settings className="h-3 w-3 mr-1" />
                  Setup
                </Button>
              </div>
            )}
            
            {/* Content Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>Content: {currentContent.length} chars</span>
              {currentAnalysis && (
                <Badge variant="outline" className="text-xs">
                  Quality: {currentAnalysis.urgentIssues.length === 0 ? 'Good' : 'Needs Work'}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="flex flex-col h-[calc(100vh-12rem)] p-0">
          {/* AI Reasoning Panel */}
          {currentReasoning.length > 0 && (
            <div className="px-4 pb-4 border-b">
              <AIReasoningPanel
                reasoningSteps={currentReasoning}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Current Analysis Suggestions */}
          {currentAnalysis && currentAnalysis.hasIssues && (
            <div className="px-4 pb-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">AI Suggestions</h3>
                <Button variant="ghost" size="sm" onClick={refreshAnalysis} className="h-6 text-xs">
                  Refresh Analysis
                </Button>
              </div>
              
              {/* Urgent Issues */}
              {currentAnalysis.urgentIssues.map((issue, index) => (
                <SuggestionCard
                  key={`issue_${index}`}
                  id={`issue_${index}`}
                  type="issue"
                  severity={issue.severity}
                  title={issue.title}
                  description={issue.description}
                  reasoning={`HKEX compliance check identified this as a ${issue.severity} priority issue that may affect regulatory approval.`}
                  suggestedAction={issue.suggestedFix || "Review and address this compliance requirement"}
                  confidence={0.9}
                  citations={['HKEX Listing Rules']}
                  onApply={handleSuggestionApply}
                  onReject={rejectSuggestion}
                  onPreview={handleSuggestionPreview}
                  isRejected={rejectedSuggestions.has(`issue_${index}`)}
                />
              ))}
              
              {/* Quick Wins */}
              {currentAnalysis.quickWins.map((win, index) => (
                <SuggestionCard
                  key={`win_${index}`}
                  id={`win_${index}`}
                  type="improvement"
                  impact={win.impact}
                  title={win.title}
                  description={win.description}
                  reasoning={`Content analysis suggests this improvement would enhance quality with minimal effort required.`}
                  suggestedAction={win.suggestedAction}
                  confidence={0.8}
                  onApply={handleSuggestionApply}
                  onReject={rejectSuggestion}
                  onPreview={handleSuggestionPreview}
                  isRejected={rejectedSuggestions.has(`win_${index}`)}
                />
              ))}
            </div>
          )}

          {/* Preview Modal */}
          {activePreview && (
            <div className="px-4 pb-4 border-b">
              <PreviewDiffViewer
                title={activePreview.title}
                description={activePreview.description}
                diffs={activePreview.diffs}
                complianceImpact={activePreview.complianceImpact}
                confidence={activePreview.confidence}
                onApply={() => {
                  // Apply the preview
                  setActivePreview(null);
                }}
                onReject={() => setActivePreview(null)}
              />
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 min-h-0" type="always">
            <div className="space-y-4 pb-4 min-h-full">
              {messages.map(message => {
                // Convert to standard Message interface
                const standardMessage: Message = {
                  id: message.id,
                  content: message.content,
                  isUser: message.isUser ?? message.type === 'user',
                  timestamp: message.timestamp,
                  confidence: message.confidence,
                  suggestedContent: message.suggestedContent,
                  isDraftable: message.isDraftable,
                  changePreview: message.changePreview
                };
                
                return (
                  <div key={message.id} className="space-y-2">
                    <ChatMessage 
                      message={standardMessage}
                      currentContent={currentContent}
                      onImplementSuggestion={applyDirectSuggestion}
                      isImplementing={isProcessing}
                    />
                    
                    {/* Show reasoning for AI messages */}
                    {message.reasoning && message.reasoning.length > 0 && (
                      <div className="ml-8">
                        <AIReasoningPanel
                          reasoningSteps={message.reasoning}
                          isProcessing={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 mr-3">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing content with transparent reasoning...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Enhanced Input */}
          <div className="p-4 border-t space-y-3">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => processMessage("Analyze my content for HKEX compliance")}
                disabled={isProcessing}
                className="text-xs h-7"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Check Compliance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => processMessage("Suggest improvements to enhance quality")}
                disabled={isProcessing}
                className="text-xs h-7"
              >
                <Eye className="h-3 w-3 mr-1" />
                Find Improvements
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask me to analyze, improve, or fix your content. I'll show you my reasoning..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};