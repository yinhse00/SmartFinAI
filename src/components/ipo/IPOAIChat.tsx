import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  X, Send, Bot, User, RefreshCw, Loader2, 
  FileText, AlertTriangle, Lightbulb, 
  ExternalLink, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Play, Edit, 
  Building, BookOpen, Target
} from 'lucide-react';
import { useIPOAIChat } from '@/hooks/useIPOAIChat';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';

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
    processMessage, 
    applyContentUpdate, 
    applyPartialUpdate 
  } = useIPOAIChat({
    projectId,
    selectedSection,
    currentContent,
    onContentUpdate
  });
  
  const [inputValue, setInputValue] = useState('');

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

  return (
    <Card className="h-full rounded-none border-0 border-l">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Context: {selectedSection} section
        </p>
      </CardHeader>
      
      <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4 min-h-0 h-[calc(100vh-20rem)] max-h-[calc(100vh-20rem)]" type="always">
          <div className="space-y-4 pb-4 min-h-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.type === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-line">{message.content}</p>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: ipoMessageFormatter.formatMessage(message.content) 
                      }}
                      className="regulatory-content [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm"
                    />
                  )}
                  
                  {/* Enhanced AI Response Features */}
                  {message.type === 'ai' && (
                    <div className="mt-3 space-y-2">
                      {/* Response Type Badge and Action Buttons */}
                      {message.responseType && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={['CONTENT_UPDATE', 'PARTIAL_UPDATE', 'DRAFT_SUGGESTION'].includes(message.responseType) ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {message.responseType === 'CONTENT_UPDATE' && <RefreshCw className="h-3 w-3 mr-1" />}
                              {message.responseType === 'PARTIAL_UPDATE' && <Edit className="h-3 w-3 mr-1" />}
                              {message.responseType === 'DRAFT_SUGGESTION' && <Target className="h-3 w-3 mr-1" />}
                              {message.responseType === 'COMPLIANCE_CHECK' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {message.responseType === 'STRUCTURE_GUIDANCE' && <Building className="h-3 w-3 mr-1" />}
                              {message.responseType === 'SUGGESTION' && <Lightbulb className="h-3 w-3 mr-1" />}
                              {message.responseType === 'SOURCE_REFERENCE' && <FileText className="h-3 w-3 mr-1" />}
                              {message.responseType === 'GUIDANCE' && <Bot className="h-3 w-3 mr-1" />}
                              {message.responseType.replace('_', ' ')}
                            </Badge>
                            {message.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(message.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {message.responseType === 'CONTENT_UPDATE' && message.changes && (
                              <Button 
                                size="sm" 
                                variant="default"
                                className="text-xs h-7"
                                onClick={() => applyContentUpdate(message.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Apply Content Update
                              </Button>
                            )}
                            
                            {message.responseType === 'PARTIAL_UPDATE' && message.partialUpdate && (
                              <Button 
                                size="sm" 
                                variant="default"
                                className="text-xs h-7"
                                onClick={() => applyPartialUpdate(message.id)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Apply Change
                              </Button>
                            )}
                            
                            {['DRAFT_SUGGESTION', 'STRUCTURE_GUIDANCE'].includes(message.responseType) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => setInputValue("Apply the suggestions you provided")}
                              >
                                <Target className="h-3 w-3 mr-1" />
                                Request Implementation
                              </Button>
                            )}
                            
                            {message.responseType === 'COMPLIANCE_CHECK' && message.complianceIssues && message.complianceIssues.length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => setInputValue("Fix the compliance issues you identified")}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fix Issues
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Compliance Issues */}
                      {message.complianceIssues && message.complianceIssues.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80">
                            <AlertTriangle className="h-3 w-3" />
                            {message.complianceIssues.length} Compliance Issue{message.complianceIssues.length > 1 ? 's' : ''}
                            <ChevronDown className="h-3 w-3" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-1">
                              {message.complianceIssues.map((issue, index) => (
                                <div key={index} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  {issue}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                            <Lightbulb className="h-3 w-3" />
                            {message.suggestions.length} Suggestion{message.suggestions.length > 1 ? 's' : ''}
                            <ChevronDown className="h-3 w-3" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-1">
                              {message.suggestions.map((suggestion, index) => (
                                <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                            <FileText className="h-3 w-3" />
                            {message.sources.length} Source{message.sources.length > 1 ? 's' : ''}
                            <ChevronDown className="h-3 w-3" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-2">
                              {message.sources.map((source, index) => (
                                <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {source.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(source.confidence * 100)}%
                                    </span>
                                  </div>
                                  <p className="font-medium">{source.title}</p>
                                  <p className="text-muted-foreground">
                                    {source.content.substring(0, 100)}...
                                  </p>
                                  {source.reference && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <ExternalLink className="h-3 w-3" />
                                      <span className="text-xs">{source.reference}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Legacy changes indicator */}
                      {message.changes && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Content Updated
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 mr-3">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing your request and improving content...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-4 border-t">
          {/* Enhanced Quick Action Buttons */}
          <div className="flex flex-wrap gap-1 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputValue("Improve and expand the current content with better details and professional language")}
            >
              <Edit className="h-3 w-3 mr-1" />
              Improve Content
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputValue("Check compliance with HKEX requirements and fix any issues")}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Check Compliance
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputValue("Restructure this content for better flow and organization")}
            >
              <Building className="h-3 w-3 mr-1" />
              Restructure
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6"
              onClick={() => setInputValue("Add specific examples and strengthen the regulatory references")}
            >
              <Target className="h-3 w-3 mr-1" />
              Add Examples
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Tell me what to improve, add, or fix in your draft content..."
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
    </Card>
  );
};