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
  professionalDraft?: import('@/services/ipo/professionalDraftGenerator').ProfessionalDraftResult;
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
      
      // Categorize error type for better user feedback
      let errorContent = "I'm currently unable to analyze your content. Please try again.";
      let toastDescription = "AI service temporarily unavailable.";
      
      if (error instanceof Error) {
        if (error.message.includes('Monthly token limit exceeded') || error.message.includes('402')) {
          errorContent = "⚠️ AI service has reached its monthly usage limit. The service will be available again next month, or you can add your own API key in Profile settings.";
          toastDescription = "Monthly usage limit reached. Add your own API key to continue.";
        } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
          errorContent = "⚠️ Too many requests. Please wait a moment and try again.";
          toastDescription = "Rate limit reached. Please wait before trying again.";
        } else if (error.message.includes('disabled') || error.message.includes('403')) {
          errorContent = "⚠️ API key is disabled. Please check your API key status in console.x.ai or Profile settings.";
          toastDescription = "API key appears to be disabled. Check your settings.";
        } else if (error.message.includes('Network') || error.message.includes('timeout')) {
          errorContent = "⚠️ Network connection issue. Please check your internet connection and try again.";
          toastDescription = "Network error. Check connection and retry.";
        } else {
          errorContent = `⚠️ ${error.message}`;
          toastDescription = error.message;
        }
      }
      
      // Add error message to chat
      const errorMessage: TransparentChatMessage = {
        id: `error_analysis_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: errorContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Analysis Failed",
        description: toastDescription,
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

      // Detect if the response contains implementable content
      const hasImplementableContent = response.updatedContent || (
        response.message && (
          response.message.includes('suggested revision') ||
          response.message.includes('improved version') ||
          response.message.includes('recommended text') ||
          response.message.length > 200 // Substantial content that could replace current text
        )
      );

      const aiChatMessage: TransparentChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence || 0.8,
        suggestedContent: response.updatedContent || (hasImplementableContent ? response.message : undefined),
        professionalDraft: response.professionalDraft,
        isDraftable: !!hasImplementableContent,
        changePreview: response.changePreview
      };

      setMessages(prev => [...prev, aiChatMessage]);

      // Update analysis if provided
      if (response.analysis) {
        setCurrentAnalysis(response.analysis);
      }

    } catch (error) {
      console.error('Message processing failed:', error);
      
      // Categorize error type for detailed user feedback
      let errorContent = "I encountered an error while processing your message. Please try again.";
      let toastDescription = "Processing failed.";
      
      if (error instanceof Error) {
        if (error.message.includes('Monthly token limit exceeded') || error.message.includes('402')) {
          errorContent = "⚠️ **AI Usage Limit Reached**\n\nThe system AI service has reached its monthly token limit. You can:\n• Wait until next month for the limit to reset\n• Add your own API key in Profile settings to continue using AI features";
          toastDescription = "Monthly limit reached. Add your API key to continue.";
        } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
          errorContent = "⚠️ **Rate Limit Exceeded**\n\nToo many requests in a short time. Please wait 30-60 seconds before trying again.";
          toastDescription = "Rate limit hit. Wait a moment and retry.";
        } else if (error.message.includes('disabled') || error.message.includes('403')) {
          errorContent = "⚠️ **API Key Disabled**\n\nYour API key appears to be disabled. Please:\n• Go to console.x.ai (for Grok) or Google AI Studio (for Google)\n• Check your API key status\n• Re-enable or create a new key\n• Update it in Profile settings";
          toastDescription = "API key disabled. Check console.x.ai settings.";
        } else if (error.message.includes('Network') || error.message.includes('timeout')) {
          errorContent = "⚠️ **Network Error**\n\nCouldn't reach the AI service. Please check your internet connection and try again.";
          toastDescription = "Network error. Check connection.";
        } else if (error.message.includes('temporarily unavailable')) {
          errorContent = "⚠️ **Service Temporarily Unavailable**\n\nThe AI service is experiencing issues. Please try again in a few minutes.";
          toastDescription = "AI service down. Try again later.";
        } else {
          errorContent = `⚠️ **Error**: ${error.message}`;
          toastDescription = error.message;
        }
      }
      
      const errorMessage: TransparentChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        isUser: false,
        content: errorContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Failed",
        description: toastDescription,
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
  const previewSuggestion = useCallback(async (suggestion: {
    id: string;
    title: string;
    description: string;
    suggestedAction: string;
    severity?: string;
    impact?: string;
  }) => {
    try {
      const preview = await transparentAnalysisService.generateSuggestionPreview(
        {
          title: suggestion.title,
          description: suggestion.description,
          suggestedAction: suggestion.suggestedAction,
          severity: suggestion.severity,
          impact: suggestion.impact
        },
        currentContent,
        selectedSection
      );

      return preview;
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast({
        title: "Preview Failed",
        description: "Could not generate preview. Please try applying directly.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentContent, selectedSection, toast]);

  // Apply direct suggestion from message with smart merging
  const applyDirectSuggestion = useCallback(async (content: string, strategy?: import('@/services/ipo/smartContentMerger').MergeStrategy, segments?: string[]) => {
    try {
      console.log('🔄 Applying direct suggestion with strategy:', strategy);
      
      // Validate inputs
      if (!content?.trim()) {
        console.warn('⚠️ Empty content provided');
        toast({
          title: "Invalid Content",
          description: "The suggested content is empty or invalid.",
          variant: "destructive",
        });
        return;
      }

      if (!currentContent) {
        console.warn('⚠️ No current content available');
        toast({
          title: "No Current Content",
          description: "No existing content found to merge with.",
          variant: "destructive",
        });
        return;
      }

      // Validate onContentUpdate callback
      if (typeof onContentUpdate !== 'function') {
        throw new Error('onContentUpdate callback is not available');
      }

      const { smartContentMerger } = await import('@/services/ipo/smartContentMerger');
      
      let finalContent = content;
      
      // If segments are provided, use only those segments
      if (segments?.length) {
        finalContent = segments.join('\n\n');
      }
      
      // Handle replace-all strategy for professional drafts
      if (strategy?.type === 'replace-all') {
        console.log('📝 Applying professional draft directly');
        if (!finalContent?.trim()) {
          throw new Error('Professional draft content is empty');
        }
        
        onContentUpdate(finalContent);
        await analyzeCurrentContent();
        
        toast({
          title: "Professional Draft Applied",
          description: "Your content has been replaced with the professional version."
        });
        return;
      }
      
      // Extract implementable content with validation
      console.log('📝 Extracting implementable content...');
      const extractedContent = smartContentMerger.extractOnlyNewContent(currentContent, finalContent);
      
      // Use smart fallback if extraction yields no content
      if (!extractedContent?.trim()) {
        console.warn('⚠️ No implementable content found, using fallback strategy');
        finalContent = finalContent; // Use original content as fallback
      } else {
        console.log('📝 Successfully extracted content');
        finalContent = extractedContent;
      }
      
      // Default to append strategy unless specifically requested otherwise
      const mergeStrategy = strategy || { 
        type: 'append' as const,
        reason: 'Adding new content to existing draft'
      };
      
      console.log('📝 Applying smart merge...');
      let mergedContent: string;
      try {
        mergedContent = smartContentMerger.smartMerge(currentContent, finalContent, mergeStrategy);
      } catch (mergeError) {
        console.warn('⚠️ Smart merge failed, using append fallback:', mergeError);
        mergedContent = currentContent + '\n\n' + finalContent;
      }
      
      // Validate final content
      if (!mergedContent?.trim()) {
        throw new Error('Final merged content is empty');
      }
      
      onContentUpdate(mergedContent);
      
      // Refresh analysis
      await analyzeCurrentContent();
      
      toast({
        title: "Content Enhanced",
        description: "New content has been added to your existing draft."
      });
    } catch (error) {
      console.error('❌ Direct suggestion application failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Application Failed",
        description: `Unable to apply the suggested content: ${errorMessage}`,
        variant: "destructive"
      });
    }
  }, [onContentUpdate, analyzeCurrentContent, currentContent, toast]);

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