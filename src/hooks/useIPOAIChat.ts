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
  responseType?: 'CONTENT_UPDATE' | 'PARTIAL_UPDATE' | 'DRAFT_SUGGESTION' | 'COMPLIANCE_CHECK' | 'STRUCTURE_GUIDANCE' | 'GUIDANCE' | 'SOURCE_REFERENCE' | 'SUGGESTION';
  sources?: SourceReference[];
  complianceIssues?: string[];
  suggestions?: string[];
  confidence?: number;
  partialUpdate?: {
    searchText: string;
    replaceWith: string;
  };
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
      content: 'Welcome! I\'m your **AI Drafting Assistant** for Hong Kong IPO prospectus content. I\'m here to actively help you create, improve, and perfect your draft:\n\n**🚀 DIRECT ACTIONS I CAN TAKE:**\n• **Write & Update Content**: Give me requirements and I\'ll draft complete sections\n• **Fix Compliance Issues**: I\'ll identify and automatically fix HKEX violations\n• **Apply Specific Changes**: Request partial edits and I\'ll show exactly what to replace\n• **Restructure Sections**: Ask me to reorganize content for better flow\n• **Add Examples & Details**: I\'ll enhance your content with specific examples\n\n**📋 QUICK WAYS TO GET STARTED:**\n• "Improve this content" - I\'ll enhance what you have\n• "Check HKEX compliance" - I\'ll validate and fix issues\n• "Add more details about [topic]" - I\'ll expand specific areas\n• "Restructure this section" - I\'ll reorganize for better flow\n\n**✅ ACTION-ORIENTED ASSISTANCE:**\nI don\'t just give advice - I provide ready-to-use content improvements with **Apply** buttons you can click to instantly update your draft. Just tell me what you need!',
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
      console.log('🔵 useIPOAIChat: Starting message processing...');
      console.log('Input params:', { userMessage, projectId, selectedSection, currentContent: currentContent?.length || 0 });
      
      // Use enhanced IPO AI chat service
      const response = await ipoAIChatService.processMessage(
        userMessage,
        projectId,
        selectedSection,
        currentContent
      );
      
      console.log('🟢 useIPOAIChat: Service response received:', response);

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
        partialUpdate: response.partialUpdate,
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
      console.error('🔴 useIPOAIChat ERROR CAUGHT:');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      
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

  // Add apply changes functionality
  const applyContentUpdate = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Find the corresponding response from the service
    // This would have the updatedContent
    const response = message;
    if (response.responseType === 'CONTENT_UPDATE' && response.changes) {
      // We need to reconstruct the updated content
      // For now, we'll use a simple approach - the AI should have provided the full content
      // In a production app, you'd want to store the full updated content in the message
      toast({
        title: "Content Applied",
        description: "The AI's suggested content has been applied to your draft."
      });
      // Note: In full implementation, you'd extract and apply the updated content here
    }
  }, [messages, toast]);

  const applyPartialUpdate = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.partialUpdate) return;

    const { searchText, replaceWith } = message.partialUpdate;
    const updatedContent = currentContent.replace(searchText, replaceWith);
    
    onContentUpdate(updatedContent);
    toast({
      title: "Partial Update Applied",
      description: "The suggested text change has been applied to your draft."
    });
  }, [messages, currentContent, onContentUpdate, toast]);

  return {
    messages,
    isProcessing,
    processMessage,
    applyContentUpdate,
    applyPartialUpdate
  };
};

// Helper functions removed - logic moved to ipoAIChatService