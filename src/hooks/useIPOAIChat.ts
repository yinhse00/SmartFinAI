import { useState, useCallback } from 'react';
import { ipoAIChatService } from '@/services/ipo/ipoAIChatService';
import { useToast } from '@/hooks/use-toast';

interface SourceReference {
  type: 'regulation' | 'template' | 'guidance' | 'faq';
  title: string;
  content: string;
  reference: string;
  confidence: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseType?: 'CONTENT_UPDATE' | 'GUIDANCE' | 'COMPLIANCE_CHECK' | 'SOURCE_REFERENCE' | 'SUGGESTION';
  sources?: SourceReference[];
  complianceIssues?: string[];
  suggestions?: string[];
  confidence?: number;
  changes?: {
    section: string;
    before: string;
    after: string;
  };
}

interface UseIPOAIChatProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
}

export const useIPOAIChat = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate
}: UseIPOAIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant specialized in Hong Kong IPO prospectus drafting. I can help you with:\n\n• **Content Updates**: Modify and improve your draft content\n• **Compliance Checks**: Validate against HKEX requirements\n• **Regulatory Guidance**: Reference specific listing rules and FAQs\n• **Professional Language**: Enhance tone and clarity\n• **Source Attribution**: Show regulatory references for all suggestions\n• **Industry Context**: Provide sector-specific insights\n\nI have access to HKEX listing rules, templates, and regulatory guidance. Just ask me to review, improve, or check compliance for your content!',
      timestamp: new Date(),
      responseType: 'GUIDANCE',
      confidence: 0.95
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;

    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsProcessing(true);

    try {
      // Use enhanced IPO AI chat service
      const response = await ipoAIChatService.processMessage(
        userMessage,
        projectId,
        selectedSection,
        currentContent
      );

      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        responseType: response.type,
        sources: response.sources,
        complianceIssues: response.complianceIssues,
        suggestions: response.suggestions,
        confidence: response.confidence,
        changes: response.updatedContent ? {
          section: selectedSection,
          before: currentContent.substring(0, 100) + '...',
          after: response.updatedContent.substring(0, 100) + '...'
        } : undefined
      };

      setMessages(prev => [...prev, aiChatMessage]);

      // Apply content changes if any
      if (response.updatedContent) {
        onContentUpdate(response.updatedContent);
        toast({
          title: "Content Updated",
          description: `AI has improved your content with ${response.confidence > 0.8 ? 'high' : 'moderate'} confidence (${Math.round(response.confidence * 100)}%).`
        });
      }

    } catch (error) {
      console.error('Error processing IPO chat message:', error);
      
      // Create more specific error messages based on error type
      let errorContent = 'I apologize, but I encountered an error processing your request.';
      let toastDescription = 'Failed to process your request. Please try again.';
      
      if (error?.message?.toLowerCase().includes('api key')) {
        errorContent = 'Please configure your API key in the settings to use the AI chat feature. Click the "Setup API Key" button in the top bar.';
        toastDescription = 'API key required. Please check your settings.';
      } else if (error?.message?.toLowerCase().includes('timeout')) {
        errorContent = 'The request timed out. Please try again with a shorter message.';
        toastDescription = 'Request timed out. Please try again.';
      } else if (error?.message?.toLowerCase().includes('network')) {
        errorContent = 'Network error occurred. Please check your internet connection and try again.';
        toastDescription = 'Network error. Please check your connection.';
      } else {
        errorContent = 'I encountered an issue processing your request. Please try rephrasing your question or try again in a moment.';
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: toastDescription,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [projectId, selectedSection, currentContent, onContentUpdate, isProcessing, toast]);

  return {
    messages,
    isProcessing,
    processMessage
  };
};

// Helper functions removed - logic moved to ipoAIChatService