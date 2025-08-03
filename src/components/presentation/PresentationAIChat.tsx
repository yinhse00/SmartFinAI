import React, { useState, useRef, useEffect } from 'react';
import { 
  Presentation, 
  PresentationSlide, 
  PresentationAIRequest, 
  PresentationAIResponse,
  SlideType 
} from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Send, 
  Sparkles, 
  FileText, 
  BarChart3, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

interface PresentationAIChatProps {
  presentation: Presentation;
  currentSlide?: PresentationSlide;
  onSlideGenerate: (prompt: string, slideType?: SlideType) => void;
  onSlideUpdate: (slideId: string, updates: Partial<PresentationSlide>) => void;
  onClose: () => void;
}

export const PresentationAIChat: React.FC<PresentationAIChatProps> = ({
  presentation,
  currentSlide,
  onSlideGenerate,
  onSlideUpdate,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI presentation assistant. I can help you create slides, enhance content, check compliance, and provide suggestions. What would you like to work on?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    {
      id: 'generate-executive-summary',
      label: 'Create Executive Summary',
      icon: Sparkles,
      prompt: 'Create an executive summary slide highlighting our key investment themes and financial highlights'
    },
    {
      id: 'enhance-current-slide',
      label: 'Enhance Current Slide',
      icon: FileText,
      prompt: 'Enhance the current slide with better content and structure'
    },
    {
      id: 'add-financial-chart',
      label: 'Add Financial Charts',
      icon: BarChart3,
      prompt: 'Add relevant financial charts and metrics to visualize our performance'
    },
    {
      id: 'check-compliance',
      label: 'Check Compliance',
      icon: CheckCircle,
      prompt: 'Review the presentation for regulatory compliance and completeness'
    }
  ];

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Simulate AI processing - in real implementation, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiResponse = await processAIRequest({
        type: 'generate_slide',
        prompt: messageContent,
        context: {
          presentationType: presentation.type,
          currentSlides: presentation.slides,
          projectData: presentation.metadata
        }
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        data: aiResponse
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle specific AI actions
      if (aiResponse.type === 'slide_generated' && aiResponse.slideData) {
        // This would trigger slide generation in the parent component
        toast.success('New slide generated successfully!');
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process AI request');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIRequest = async (request: PresentationAIRequest): Promise<PresentationAIResponse> => {
    // Mock AI processing - replace with actual AI service call
    if (request.prompt.toLowerCase().includes('executive summary')) {
      return {
        type: 'slide_generated',
        message: "I've created an executive summary slide with key investment highlights. The slide includes your company's value proposition, financial performance metrics, and market opportunity summary.",
        slideData: {
          id: 'new-slide-' + Date.now(),
          type: 'executive_summary',
          title: 'Investment Highlights',
          content: {
            title: 'Investment Highlights',
            bulletPoints: [
              'Leading market position in growing industry',
              'Strong financial performance with 40% revenue growth',
              'Experienced management team with proven track record',
              'Clear path to profitability and positive cash flow'
            ]
          },
          order: presentation.slides.length,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isGenerated: true,
            aiPrompt: request.prompt
          }
        }
      };
    }

    if (request.prompt.toLowerCase().includes('enhance')) {
      return {
        type: 'content_enhanced',
        message: "I've enhanced the current slide with improved content structure, clearer bullet points, and better visual hierarchy. The content now flows more logically and is more investor-friendly.",
        suggestions: [
          {
            id: '1',
            type: 'content',
            priority: 'high',
            title: 'Improve bullet point clarity',
            description: 'Make bullet points more concise and impactful',
            action: 'modify_content'
          }
        ]
      };
    }

    if (request.prompt.toLowerCase().includes('compliance')) {
      return {
        type: 'compliance_check',
        message: "I've reviewed your presentation for compliance. Found 2 recommendations and 1 potential issue that should be addressed.",
        complianceResults: [
          {
            id: '1',
            level: 'warning',
            title: 'Risk factors section',
            description: 'Consider adding more detail about market risks',
            suggestion: 'Add slide about regulatory and market risks'
          },
          {
            id: '2',
            level: 'info',
            title: 'Forward-looking statements',
            description: 'Add disclaimer about forward-looking statements',
            suggestion: 'Include standard disclaimer on final slide'
          }
        ]
      };
    }

    return {
      type: 'suggestions',
      message: "Here are some suggestions to improve your presentation:",
      suggestions: [
        {
          id: '1',
          type: 'content',
          priority: 'medium',
          title: 'Add market size data',
          description: 'Include total addressable market information',
          action: 'add_slide'
        }
      ]
    };
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    handleSendMessage(action.prompt);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            AI
          </div>
        )}
        
        <div
          className={cn(
            "max-w-[80%] rounded-lg p-3",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}
        >
          <div className="text-sm">{message.content}</div>
          
          {/* Render AI response data */}
          {message.data && message.type === 'ai' && (
            <div className="mt-3 space-y-2">
              {message.data.suggestions && (
                <div className="space-y-2">
                  {message.data.suggestions.map((suggestion: any) => (
                    <Card key={suggestion.id} className="p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{suggestion.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </div>
                          <Badge 
                            variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                            className="mt-2 text-xs"
                          >
                            {suggestion.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {message.data.complianceResults && (
                <div className="space-y-2">
                  {message.data.complianceResults.map((result: any) => (
                    <Card key={result.id} className="p-3">
                      <div className="flex items-start gap-2">
                        {result.level === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{result.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.description}
                          </div>
                          {result.suggestion && (
                            <div className="text-xs text-blue-600 mt-1">
                              💡 {result.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
            U
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b p-4">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto p-2 text-xs"
              onClick={() => handleQuickAction(action)}
            >
              <action.icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {messages.map(renderMessage)}
          {isProcessing && (
            <div className="flex gap-3 p-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                AI
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Ask me to create slides, enhance content, or check compliance..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage(input)}
            disabled={isProcessing || !input.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};