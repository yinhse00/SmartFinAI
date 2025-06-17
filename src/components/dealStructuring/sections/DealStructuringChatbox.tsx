import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { followUpService, FollowUpContext } from '@/services/dealStructuring/followUpService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
interface DealStructuringChatboxProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
}
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  changedSections?: string[];
}
export const DealStructuringChatbox = ({
  results,
  onResultsUpdate
}: DealStructuringChatboxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    type: 'assistant',
    content: 'Hello! I can help you refine your transaction analysis. Ask me questions about specific aspects you\'d like to adjust or clarify.',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    toast
  } = useToast();

  // Create session ID and maintain follow-up context with mutable conversation history
  const sessionIdRef = useRef(followUpService.createSessionId());
  const [conversationHistory, setConversationHistory] = useState<Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>>([]);

  // Update context with current conversation history
  const context: FollowUpContext = {
    originalTransactionDescription: results.transactionType,
    conversationHistory: conversationHistory,
    sessionId: sessionIdRef.current
  };
  console.log('DealStructuringChatbox rendered with session ID:', sessionIdRef.current);
  console.log('Current conversation history length:', conversationHistory.length);
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);
    try {
      console.log('Processing new follow-up question:', currentInput);
      console.log('Using session ID:', sessionIdRef.current);

      // Process the follow-up question with fresh context
      const followUpResponse = await followUpService.processFollowUpQuestion(results, currentInput, context);

      // Update the analysis results
      onResultsUpdate(followUpResponse.updatedResults);

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: followUpResponse.assistantMessage,
        timestamp: new Date(),
        changedSections: followUpResponse.changedSections
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation history for future context
      const newHistoryEntry = followUpService.createHistoryEntry(currentInput, followUpResponse.assistantMessage);
      setConversationHistory(prev => [...prev, newHistoryEntry]);
      console.log('Updated conversation history length:', conversationHistory.length + 1);

      // Show success toast with changed sections
      if (followUpResponse.changedSections.length > 0) {
        toast({
          title: "Analysis Updated",
          description: followUpService.formatChangedSections(followUpResponse.changedSections)
        });
      } else {
        toast({
          title: "Response Generated",
          description: "I've provided information without changing the analysis."
        });
      }
    } catch (error) {
      console.error('Error processing follow-up:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try rephrasing your question or ask about a specific aspect of the analysis.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return <Card className="h-[700px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          Analysis Chat
          
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 px-6 pb-4" type="always">
          <div className="space-y-4">
            {messages.map(message => <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 text-sm ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="leading-relaxed">{message.content}</p>
                  {message.changedSections && message.changedSections.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                      {message.changedSections.map((section, index) => <Badge key={index} variant="secondary" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {section}
                        </Badge>)}
                    </div>}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </p>
                </div>
              </div>)}
            {isProcessing && <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing your question...</span>
                  </div>
                </div>
              </div>}
          </div>
        </ScrollArea>
        
        <div className="flex-shrink-0 p-6 border-t">
          <div className="flex gap-3">
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask about your analysis..." className="text-sm" disabled={isProcessing} />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isProcessing} size="sm" className="flex-shrink-0">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};