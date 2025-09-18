
import { useState, useCallback } from 'react';
import { enhancedIPOAIChatService } from '@/services/ipo/enhancedIPOAIChatService';
import { contentAnalysisService } from '@/services/ipo/contentAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { ProactiveAnalysisResult, TargetedEdit } from '@/types/ipoAnalysis';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  isUser?: boolean; // Add compatibility with standard Message interface
  content: string;
  timestamp: Date;
  responseType?: string;
  proactiveAnalysis?: ProactiveAnalysisResult;
  targetedEdits?: TargetedEdit[];
  confidence?: number;
  suggestedContent?: string;
  isDraftable?: boolean;
  changePreview?: {
    before: string;
    after: string;
  };
}

interface UseEnhancedIPOAIChatProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
}

export const useEnhancedIPOAIChat = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate
}: UseEnhancedIPOAIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      isUser: false,
      content: 'Hello! I\'m your AI assistant for IPO prospectus drafting. I can help analyze content, fix compliance issues, and suggest improvements. How can I assist you today?',
      timestamp: new Date(),
      responseType: 'GUIDANCE',
      confidence: 0.95
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ProactiveAnalysisResult | null>(null);
  const { toast } = useToast();

  // Automatically analyze content when it changes
  const analyzeCurrentContent = useCallback(async () => {
    if (!currentContent || currentContent.trim().length < 50) {
      setCurrentAnalysis(null);
      return;
    }

    try {
      const analysis = await contentAnalysisService.getProactiveSuggestions(
        currentContent,
        selectedSection
      );
      setCurrentAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze content:', error);
    }
  }, [currentContent, selectedSection]);

  // Process user message with enhanced capabilities
  const processMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;

    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      isUser: true,
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsProcessing(true);

    try {
      console.log('🔵 Enhanced IPO Chat: Processing message...');
      
      const response = await enhancedIPOAIChatService.processMessageWithAnalysis(
        userMessage,
        projectId,
        selectedSection,
        currentContent
      );
      
      console.log('🟢 Enhanced response received:', response);

      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        isUser: false,
        content: response.message,
        timestamp: new Date(),
        responseType: response.type,
        proactiveAnalysis: response.proactiveAnalysis,
        targetedEdits: response.targetedEdits,
        confidence: response.confidence,
        suggestedContent: response.updatedContent,
        isDraftable: !!response.updatedContent,
        changePreview: response.updatedContent ? {
          before: currentContent,
          after: response.updatedContent
        } : undefined
      };

      setMessages(prev => [...prev, aiChatMessage]);

      // Update content if provided
      if (response.updatedContent) {
        onContentUpdate(response.updatedContent);
        toast({
          title: "Content Updated",
          description: "AI has improved your content based on analysis.",
        });
      }

      // Update current analysis
      if (response.proactiveAnalysis) {
        setCurrentAnalysis(response.proactiveAnalysis);
      }

    } catch (error) {
      console.error('🔴 Enhanced chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        isUser: false,
        content: 'I encountered an error processing your request. Please check your API key configuration and try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [projectId, selectedSection, currentContent, onContentUpdate, isProcessing, toast]);

  // Apply automatic fix for an issue
  const applyAutoFix = useCallback(async (issueId: string) => {
    try {
      const result = await enhancedIPOAIChatService.generateAutoFix(
        issueId,
        currentContent,
        selectedSection
      );

      if (result.success && result.updatedContent) {
        onContentUpdate(result.updatedContent);
        toast({
          title: "Fix Applied",
          description: result.message
        });
        
        // Refresh analysis
        await analyzeCurrentContent();
      } else {
        toast({
          title: "Fix Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast({
        title: "Fix Failed",
        description: "Unable to apply automatic fix.",
        variant: "destructive"
      });
    }
  }, [currentContent, selectedSection, onContentUpdate, toast, analyzeCurrentContent]);

  // Apply improvement opportunity
  const applyImprovement = useCallback(async (opportunityId: string) => {
    try {
      const result = await enhancedIPOAIChatService.applyImprovement(
        opportunityId,
        currentContent,
        selectedSection
      );

      if (result.success && result.updatedContent) {
        onContentUpdate(result.updatedContent);
        toast({
          title: "Improvement Applied",
          description: result.message
        });
        
        // Refresh analysis
        await analyzeCurrentContent();
      } else {
        toast({
          title: "Improvement Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Improvement application failed:', error);
      toast({
        title: "Improvement Failed",
        description: "Unable to apply improvement.",
        variant: "destructive"
      });
    }
  }, [currentContent, selectedSection, onContentUpdate, toast, analyzeCurrentContent]);

  // Refresh analysis
  const refreshAnalysis = useCallback(async () => {
    await analyzeCurrentContent();
    toast({
      title: "Analysis Refreshed",
      description: "Content analysis has been updated."
    });
  }, [analyzeCurrentContent, toast]);

  // Apply suggested content directly from AI message
  const applyDirectSuggestion = useCallback(async (suggestedContent: string) => {
    try {
      if (onContentUpdate) {
        onContentUpdate(suggestedContent);
        
        // Add confirmation message
        const confirmationMessage: ChatMessage = {
          id: `confirmation-${Date.now()}`,
          type: 'ai',
          isUser: false,
          content: '✅ Changes applied successfully! Your draft has been updated with the suggested content.',
          timestamp: new Date(),
          responseType: 'CONTENT_UPDATE',
          confidence: 1.0
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Refresh analysis after applying changes
        setTimeout(() => {
          analyzeCurrentContent();
        }, 1000);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  }, [onContentUpdate, analyzeCurrentContent]);

  return {
    messages,
    isProcessing,
    currentAnalysis,
    processMessage,
    applyAutoFix,
    applyImprovement,
    applyDirectSuggestion,
    refreshAnalysis,
    analyzeCurrentContent
  };
};
