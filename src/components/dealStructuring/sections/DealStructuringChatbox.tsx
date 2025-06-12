
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { aiAnalysisService } from '@/services/dealStructuring/aiAnalysisService';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DealStructuringChatboxProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
}

export const DealStructuringChatbox = ({ results, onResultsUpdate }: DealStructuringChatboxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickActions = [
    'Modify timeline',
    'Explore cost alternatives',
    'Regulatory deep dive',
    'Alternative structures',
    'Risk mitigation'
  ];

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create follow-up request with context
      const followUpRequest = {
        description: `Follow-up question: ${messageContent}\n\nOriginal Analysis Context:\nTransaction Type: ${results.transactionType}\nRecommended Structure: ${results.structure.recommended}`,
        uploadedFiles: []
      };

      const updatedResults = await aiAnalysisService.analyzeTransaction(followUpRequest);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on your follow-up question, I've updated the analysis. The key changes include adjustments to the ${messageContent.toLowerCase().includes('timeline') ? 'execution timetable' : messageContent.toLowerCase().includes('cost') ? 'cost structure' : 'recommendations'}.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onResultsUpdate(updatedResults);

      toast({
        title: "Analysis Updated",
        description: "Your follow-up question has been processed and the analysis updated.",
      });
    } catch (error) {
      console.error('Follow-up analysis error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an issue processing your follow-up question. Please try again or rephrase your question.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Analysis Error",
        description: "Unable to process follow-up question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Follow-up Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Quick Actions */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 text-xs"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Badge>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-3 space-y-2 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              Ask follow-up questions about the analysis or use quick actions above.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`p-2 rounded-lg text-xs ${
                message.role === 'user' 
                  ? 'bg-primary/10 ml-4' 
                  : 'bg-gray-50 mr-4'
              }`}>
                <div className="font-medium mb-1">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="text-gray-700">{message.content}</div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 p-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing your question...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about timeline modifications, cost alternatives, regulatory requirements..."
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
          />
          <Button 
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="w-full"
          >
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
