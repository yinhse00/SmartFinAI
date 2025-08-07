
import { useState, useCallback } from 'react';
import { enhancedIPOAIChatService } from '@/services/ipo/enhancedIPOAIChatService';
import { contentAnalysisService } from '@/services/ipo/contentAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { ProactiveAnalysisResult, TargetedEdit } from '@/types/ipoAnalysis';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseType?: string;
  proactiveAnalysis?: ProactiveAnalysisResult;
  targetedEdits?: TargetedEdit[];
  confidence?: number;
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
      content: 'Welcome! I\'m your **Enhanced AI Drafting Assistant** for Hong Kong IPO prospectus content. I work like Lovable - analyzing your content proactively and providing intelligent suggestions.\n\n**🎯 HOW I HELP:**\n• **Automatic Analysis**: I continuously analyze your content for issues and opportunities\n• **Proactive Suggestions**: I spot problems before you ask and suggest specific fixes\n• **Targeted Improvements**: I provide precise edits you can apply with one click\n• **Business-Financial Alignment**: I ensure segment consistency between business and financial sections\n• **Materiality Compliance**: I verify products/services align with accountants\' report materiality\n\n**🚀 QUICK ACTIONS:**\n• "Analyze my content" - Get comprehensive analysis\n• "Fix compliance issues" - Auto-fix regulatory gaps\n• "Check segment alignment" - Validate business-financial consistency\n• "Apply improvements" - Enhance quality automatically\n• "Make this professional" - Improve language and tone\n\nJust tell me what you need, and I\'ll provide specific, actionable help with HKEX compliance!',
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
        content: response.message,
        timestamp: new Date(),
        responseType: response.type,
        proactiveAnalysis: response.proactiveAnalysis,
        targetedEdits: response.targetedEdits,
        confidence: response.confidence
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

  return {
    messages,
    isProcessing,
    currentAnalysis,
    processMessage,
    applyAutoFix,
    applyImprovement,
    refreshAnalysis,
    analyzeCurrentContent
  };
};
