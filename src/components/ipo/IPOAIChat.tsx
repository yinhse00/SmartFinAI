import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Send, Bot, User, Loader2, Brain, Target, CheckCircle, Building, BookOpen, Edit, Lightbulb, ChevronDown, ChevronUp, Minimize2, AlertCircle, Settings } from 'lucide-react';
import { useEnhancedIPOAIChat } from '@/hooks/useEnhancedIPOAIChat';
import { ProactiveSuggestions } from './ProactiveSuggestions';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Message } from '@/components/chat/ChatMessage';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { hasGrokApiKey, hasGoogleApiKey } from '@/services/apiKeyService';
import { useNavigate } from 'react-router-dom';
import { AIProvider } from '@/types/aiProvider';
interface IPOAIChatProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
  onClose: () => void;
}
export const IPOAIChat: React.FC<IPOAIChatProps> = ({
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
    processMessage,
    applyAutoFix,
    applyImprovement,
    applyDirectSuggestion,
    refreshAnalysis,
    analyzeCurrentContent
  } = useEnhancedIPOAIChat({
    projectId,
    selectedSection,
    currentContent,
    onContentUpdate
  });
  const [inputValue, setInputValue] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    hasKey: boolean;
    provider?: AIProvider;
  }>({
    hasKey: false
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
      const preference = getFeatureAIPreference('ipo');
      let hasKey = false;
      let provider = preference.provider;
      if (preference.provider === AIProvider.GROK) {
        hasKey = hasGrokApiKey();
      } else if (preference.provider === AIProvider.GOOGLE) {
        hasKey = hasGoogleApiKey();
      }

      // Fallback: check if any provider has a key
      if (!hasKey) {
        if (hasGrokApiKey()) {
          hasKey = true;
          provider = AIProvider.GROK;
        } else if (hasGoogleApiKey()) {
          hasKey = true;
          provider = AIProvider.GOOGLE;
        }
      }
      setApiKeyStatus({
        hasKey,
        provider
      });
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
  return <Card className={`${isCollapsed ? 'h-auto' : 'h-full'} rounded-none border-0 border-l transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Assistant
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
            <p className="text-xs text-muted-foreground">
              {selectedSection} section
            </p>
            {!apiKeyStatus.hasKey && <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-800">API key required for AI assistance</p>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => navigate('/profile')}>
                  <Settings className="h-3 w-3 mr-1" />
                  Setup
                </Button>
              </div>}
          </>}
      </CardHeader>
      
      {!isCollapsed && <CardContent className="flex flex-col h-[calc(100vh-12rem)] p-0">
        {/* Proactive Suggestions Panel */}
        {currentAnalysis && currentAnalysis.hasIssues && <div className="px-4 pb-4 border-b">
            <ProactiveSuggestions analysis={currentAnalysis} onApplyFix={applyAutoFix} onApplyImprovement={applyImprovement} onRefreshAnalysis={refreshAnalysis} isLoading={isProcessing} />
          </div>}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 min-h-0" type="always">
          <div className="space-y-4 pb-4 min-h-full">
            {messages.map(message => {
            // Convert local ChatMessage to standard Message interface
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
            return <ChatMessage key={message.id} message={standardMessage} currentContent={currentContent} onImplementSuggestion={applyDirectSuggestion} isImplementing={isProcessing} />;
          })}
            
            {isProcessing && <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 mr-3">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing content and generating intelligent suggestions...</span>
                  </div>
                </div>
              </div>}
          </div>
        </ScrollArea>
        
        {/* Enhanced Input with Smart Actions */}
        <div className="p-4 border-t">
          {/* Smart Quick Actions */}
          
          
          <div className="flex gap-2">
            <Input placeholder="Try: 'Analyze my content', 'Fix compliance issues', 'Apply improvements', or ask specific questions..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" disabled={isProcessing} />
            <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        </CardContent>}
    </Card>;
};