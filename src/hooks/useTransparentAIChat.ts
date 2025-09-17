import { useState, useCallback } from 'react';
import { transparentAnalysisService } from '@/services/ipo/transparentAnalysisService';
import { useToast } from '@/hooks/use-toast';

interface ReasoningStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'processing' | 'pending';
  confidence?: number;
  citations?: string[];
}

interface AnalysisResult {
  hasIssues: boolean;
  urgentIssues: any[];
  quickWins: any[];
  summary: string;
  nextSteps: string[];
  reasoning: ReasoningStep[];
}

interface TransparentChatMessage {
  id: string;
  type: 'user' | 'ai';
  isUser?: boolean;
  content: string;
  timestamp: Date;
  analysisResult?: AnalysisResult;
  suggestions?: any[];
  reasoning?: ReasoningStep[];
  confidence?: number;
  suggestedContent?: string;
  isDraftable?: boolean;
  changePreview?: {
    before: string;
    after: string;
    location?: string;
  };
}

interface UseTransparentAIChatProps {
  projectId: string;
  selectedSection: string;
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
}

export const useTransparentAIChat = ({
  projectId,
  selectedSection,
  currentContent,
  onContentUpdate
}: UseTransparentAIChatProps) => {
  const [messages, setMessages] = useState<TransparentChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      isUser: false,
      content: "I'll analyze your content and provide actionable suggestions to improve your IPO prospectus. Ask me questions or request specific improvements, and I'll provide implementable solutions with preview options.",
      timestamp: new Date()
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Analyze current content with transparent reasoning
  const analyzeCurrentContent = useCallback(async () => {
    if (!currentContent || currentContent.trim().length < 50) return;

    try {
      setIsProcessing(true);
      const result = await transparentAnalysisService.performTransparentAnalysis(
        currentContent,
        selectedSection,
        projectId
      );
      
      setCurrentAnalysis(result);
      
      if (result.hasIssues) {
        const aiMessage: TransparentChatMessage = {
          id: `analysis_${Date.now()}`,
          type: 'ai',
          isUser: false,
          content: `I've analyzed your ${selectedSection} section and found ${result.urgentIssues.length} issues and ${result.quickWins.length} improvement opportunities that need attention.`,
          timestamp: new Date(),
          analysisResult: result
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Transparent analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, selectedSection, projectId, toast]);

  // Process user message with transparent reasoning
  const processMessage = useCallback(async (userMessage: string) => {
    if (isProcessing) return;

    const userChatMessage: TransparentChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      isUser: true,
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsProcessing(true);

    try {
      const response = await transparentAnalysisService.processMessageWithReasoning(
        userMessage,
        projectId,
        selectedSection,
        currentContent
      );

      const aiChatMessage: TransparentChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence,
        suggestedContent: response.updatedContent,
        isDraftable: !!response.updatedContent,
        changePreview: response.changePreview
      };

      setMessages(prev => [...prev, aiChatMessage]);

      // Update analysis if provided
      if (response.analysis) {
        setCurrentAnalysis(response.analysis);
      }

    } catch (error) {
      console.error('Message processing failed:', error);
      
      const errorMessage: TransparentChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: "I encountered an error while processing your message. Please try again or rephrase your request.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Failed",
        description: "Unable to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [projectId, selectedSection, currentContent, isProcessing, toast]);

  // Apply suggestion with preview
  const applySuggestion = useCallback(async (suggestionId: string, customAction?: string) => {
    try {
      const result = await transparentAnalysisService.applySuggestionWithPreview(
        suggestionId,
        currentContent,
        selectedSection,
        customAction
      );

      if (result.success && result.updatedContent) {
        onContentUpdate(result.updatedContent);
        
        // Update current analysis
        const refreshedAnalysis = await transparentAnalysisService.performTransparentAnalysis(
          result.updatedContent,
          selectedSection,
          projectId
        );
        setCurrentAnalysis(refreshedAnalysis);

        toast({
          title: "Suggestion Applied",
          description: result.message || "Content has been updated successfully."
        });
      } else {
        toast({
          title: "Application Failed",
          description: result.message || "Unable to apply this suggestion.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Suggestion application failed:', error);
      toast({
        title: "Error",
        description: "Failed to apply suggestion. Please try manual editing.",
        variant: "destructive"
      });
    }
  }, [currentContent, selectedSection, projectId, onContentUpdate, toast]);

  // Reject suggestion
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setRejectedSuggestions(prev => new Set(prev).add(suggestionId));
    toast({
      title: "Suggestion Dismissed",
      description: "This suggestion has been dismissed."
    });
  }, [toast]);

  // Preview suggestion
  const previewSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const preview = await transparentAnalysisService.generateSuggestionPreview(
        suggestionId,
        currentContent,
        selectedSection
      );

      // Add preview message to chat
      const previewMessage: TransparentChatMessage = {
        id: `preview_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: `Here's a preview of what would change if you apply this suggestion:`,
        timestamp: new Date(),
        changePreview: preview
      };

      setMessages(prev => [...prev, previewMessage]);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast({
        title: "Preview Failed",
        description: "Unable to generate preview for this suggestion.",
        variant: "destructive"
      });
    }
  }, [currentContent, selectedSection, toast]);

  // Apply direct suggestion from message
  const applyDirectSuggestion = useCallback(async (content: string) => {
    try {
      onContentUpdate(content);
      
      // Refresh analysis
      await analyzeCurrentContent();
      
      toast({
        title: "Content Applied",
        description: "The suggested content has been applied to your document."
      });
    } catch (error) {
      console.error('Direct suggestion application failed:', error);
      toast({
        title: "Application Failed",
        description: "Unable to apply the suggested content.",
        variant: "destructive"
      });
    }
  }, [onContentUpdate, analyzeCurrentContent, toast]);

  // Refresh analysis
  const refreshAnalysis = useCallback(async () => {
    await analyzeCurrentContent();
  }, [analyzeCurrentContent]);

  return {
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
  };
};