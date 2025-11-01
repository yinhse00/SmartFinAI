import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, Send, Bot, Loader2, Brain, ChevronDown, ChevronUp, AlertCircle, Settings, Eye, CheckCircle } from 'lucide-react';
import { useTransparentAIChat } from '@/hooks/useTransparentAIChat';
import { SuggestionCard } from './SuggestionCard';
import { PreviewDiffViewer } from './PreviewDiffViewer';
import { MessageFormatter } from './MessageFormatter';
import { ImplementButton } from '@/components/chat/message/ImplementButton';
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState({
    hasKey: false,
    provider: undefined as string | undefined
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
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
      setApiKeyStatus({
        hasKey,
        provider
      });
    };
    checkApiKeys();
  }, []);

  // Test AI connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    setLastError(null);
    try {
      await processMessage("Test AI connection");
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Connection test failed");
    } finally {
      setIsTestingConnection(false);
    }
  };
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
  return <Card className={`${isCollapsed ? 'h-auto' : 'h-full'} rounded-none border-0 border-l transition-all duration-300`}>
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
        
        {!isCollapsed && <>
            {/* Error Display */}
            {lastError && <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-md p-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-destructive">{lastError}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLastError(null)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>}

            {/* API Key Status Warning */}
            {!apiKeyStatus.hasKey && <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-800">Using system keys (may have rate limits)</p>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => navigate('/profile')}>
                  <Settings className="h-3 w-3 mr-1" />
                  Add Keys
                </Button>
              </div>}
            
            {/* Connection Status & Diagnostics */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-4">
                <span>Content: {currentContent.length} chars</span>
                {currentAnalysis && <Badge variant="outline" className="text-xs">
                    Quality: {currentAnalysis.urgentIssues.length === 0 ? 'Good' : 'Needs Work'}
                  </Badge>}
                {apiKeyStatus.hasKey && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {apiKeyStatus.provider} AI
                  </Badge>}
              </div>
              <Button variant="ghost" size="sm" onClick={testConnection} disabled={isTestingConnection} className="h-6 text-xs">
                {isTestingConnection ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                Test AI
              </Button>
            </div>
          </>}
      </CardHeader>
      
      {!isCollapsed && <CardContent className="flex flex-col h-[calc(100vh-12rem)] p-0">
          {/* Error Display */}
          {lastError && (
            <div className="mx-4 mt-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-xs text-destructive/80 mt-1">{lastError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLastError(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Truncation Warning */}
          {currentAnalysis?.urgentIssues.some(issue => issue.title?.toLowerCase().includes('incomplete') || issue.title?.toLowerCase().includes('truncat')) && (
            <div className="mx-4 mt-4 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Content May Be Incomplete</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                  The AI response was truncated. Try regenerating with shorter request or break into smaller sections.
                </p>
              </div>
            </div>
          )}

          {/* Current Analysis Suggestions */}
          {currentAnalysis && currentAnalysis.hasIssues && <div className="px-4 pb-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">AI Suggestions</h3>
                <Button variant="ghost" size="sm" onClick={refreshAnalysis} className="h-6 text-xs">
                  Refresh Analysis
                </Button>
              </div>
              
              {/* Urgent Issues */}
              {currentAnalysis.urgentIssues.map((issue, index) => <SuggestionCard key={`issue_${index}`} id={`issue_${index}`} type="issue" severity={issue.severity} title={issue.title} description={issue.description} reasoning={`HKEX compliance check identified this as a ${issue.severity} priority issue that may affect regulatory approval.`} suggestedAction={issue.suggestedFix || "Review and address this compliance requirement"} confidence={0.9} citations={['HKEX Listing Rules']} onApply={handleSuggestionApply} onReject={rejectSuggestion} onPreview={handleSuggestionPreview} isRejected={rejectedSuggestions.has(`issue_${index}`)} />)}
              
              {/* Quick Wins */}
              {currentAnalysis.quickWins.map((win, index) => <SuggestionCard key={`win_${index}`} id={`win_${index}`} type="improvement" impact={win.impact} title={win.title} description={win.description} reasoning={`Content analysis suggests this improvement would enhance quality with minimal effort required.`} suggestedAction={win.suggestedAction} confidence={0.8} onApply={handleSuggestionApply} onReject={rejectSuggestion} onPreview={handleSuggestionPreview} isRejected={rejectedSuggestions.has(`win_${index}`)} />)}
            </div>}

          {/* Preview Modal */}
          {activePreview && <div className="px-4 pb-4 border-b">
              <PreviewDiffViewer title={activePreview.title} description={activePreview.description} diffs={activePreview.diffs} complianceImpact={activePreview.complianceImpact} confidence={activePreview.confidence} onApply={() => {
          // Apply the preview
          setActivePreview(null);
        }} onReject={() => setActivePreview(null)} />
            </div>}

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
              changePreview: message.changePreview,
              professionalDraft: message.professionalDraft
            };
            const isUserMessage = message.isUser ?? message.type === 'user';
            return <div key={message.id} className="space-y-2">
                    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
                      <div className={`flex items-start gap-3 w-full max-w-[85%] ${isUserMessage ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full ${isUserMessage ? 'bg-primary' : 'bg-muted'} flex items-center justify-center shrink-0 mt-1`}>
                          {isUserMessage ? <span className="text-xs font-medium text-primary-foreground">U</span> : <Bot className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <Card className={`p-3 rounded-lg w-full ${isUserMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {isUserMessage ? <p className="text-sm">{message.content}</p> : <>
                              <MessageFormatter content={message.content} />
                              {message.isDraftable && message.suggestedContent && <ImplementButton message={standardMessage} currentContent={currentContent} onImplement={applyDirectSuggestion} isImplementing={isProcessing} />}
                            </>}
                        </Card>
                      </div>
                    </div>
                  </div>;
          })}
              
              {isProcessing && <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 mr-3">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing with {apiKeyStatus.provider || 'system'} AI...</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Analyzing content and generating recommendations</p>
                  </div>
                </div>}
            </div>
          </ScrollArea>
          
          {/* Minimized Input Area */}
          <div className="p-2 border-t">
            <div className="flex gap-2">
              <Input placeholder="Ask me to analyze, improve, or fix your content..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} className="flex-1 h-8 text-sm" disabled={isProcessing} />
              <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || isProcessing} className="h-8 px-3">
                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
            </div>
            
            {/* Collapsible Quick Actions */}
            <div className="mt-2">
              
              {showQuickActions && <div className="flex flex-wrap gap-1 mt-1">
                  <Button variant="outline" size="sm" onClick={() => processMessage("Analyze my content for HKEX compliance")} disabled={isProcessing} className="text-xs h-6">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Check Compliance
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => processMessage("Suggest improvements to enhance quality")} disabled={isProcessing} className="text-xs h-6">
                    <Eye className="h-3 w-3 mr-1" />
                    Find Improvements
                  </Button>
                </div>}
            </div>
          </div>
        </CardContent>}
    </Card>;
};