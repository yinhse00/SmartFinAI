
import { useState, useCallback } from 'react';
import { enhancedIPOAIChatService } from '@/services/ipo/enhancedIPOAIChatService';
import { contentAnalysisService } from '@/services/ipo/contentAnalysisService';
import { professionalDraftGenerator } from '@/services/ipo/professionalDraftGenerator';
import { useToast } from '@/hooks/use-toast';
import { ProactiveAnalysisResult, TargetedEdit } from '@/types/ipoAnalysis';
import { TextSelection } from '@/types/textSelection';
import { ContentFlag } from '@/services/ipo/contentRelevanceAnalyzer';

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
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
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

  // Check if message is a format-only request
  const isFormatOnlyRequest = useCallback((userRequest: string): boolean => {
    const request = userRequest.toLowerCase();
    const formatKeywords = [
      'format', 'structure', 'reorganize', 'restructure', 'reformat',
      'reorder', 'layout', 'paragraph', 'heading', 'bullet point',
      'better organized', 'cleaner format', 'improve layout', 'readable',
      'better structure', 'improve structure', 'fix format', 'fix structure'
    ];
    const contentChangeKeywords = ['add', 'remove', 'delete', 'expand', 'shorten', 'write', 'include', 'mention'];
    const hasContentChange = contentChangeKeywords.some(k => request.includes(k));
    const hasFormatRequest = formatKeywords.some(k => request.includes(k));
    return hasFormatRequest && !hasContentChange;
  }, []);

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
      
      // Check for format-only requests - use professionalDraftGenerator for content flags
      if (isFormatOnlyRequest(userMessage) && currentContent?.length > 200) {
        console.log('📐 Format-only request detected, using professionalDraftGenerator');
        
        const draftResult = await professionalDraftGenerator.generateProfessionalDraft({
          currentContent,
          sectionType: selectedSection,
          userRequest: userMessage,
          projectId
        });
        
        // Update content flags if present
        if (draftResult.contentFlags && draftResult.contentFlags.length > 0) {
          console.log(`🔍 Found ${draftResult.contentFlags.length} content flags`);
          setContentFlags(draftResult.contentFlags);
        }
        
        const aiChatMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          isUser: false,
          content: draftResult.contentFlags?.length 
            ? `Format applied. Found ${draftResult.contentFlags.length} items that may need review - see the Content Review panel above.`
            : 'Format improved while preserving all content.',
          timestamp: new Date(),
          responseType: 'CONTENT_UPDATE',
          confidence: draftResult.confidence,
          suggestedContent: draftResult.fullDraft,
          isDraftable: true,
          changePreview: {
            before: currentContent,
            after: draftResult.fullDraft
          }
        };
        
        setMessages(prev => [...prev, aiChatMessage]);
        onContentUpdate(draftResult.fullDraft);
        
        toast({
          title: "Format Applied",
          description: draftResult.contentFlags?.length 
            ? `Format improved. ${draftResult.contentFlags.length} items flagged for review.`
            : "Format improved while preserving all content."
        });
        
        setIsProcessing(false);
        return;
      }
      
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
  }, [projectId, selectedSection, currentContent, onContentUpdate, isProcessing, toast, isFormatOnlyRequest, setContentFlags]);

  // Process selection-based amendment
  const processSelectionMessage = useCallback(async (
    userMessage: string, 
    selection: TextSelection,
    onSelectionUpdate: (oldText: string, newText: string) => void
  ) => {
    if (!userMessage.trim() || isProcessing || !selection.text.trim()) return;

    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      isUser: true,
      content: `[Selection: "${selection.text.substring(0, 50)}${selection.text.length > 50 ? '...' : ''}"] ${userMessage}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsProcessing(true);

    try {
      console.log('🔵 Selection-based amendment: Processing...');
      
      const amendedText = await professionalDraftGenerator.generateSelectionAmendment({
        fullContent: currentContent,
        selectedText: selection.text,
        userRequest: userMessage,
        sectionType: selectedSection
      });
      
      console.log('🟢 Selection amendment received:', amendedText.substring(0, 100));

      // Apply the amendment
      onSelectionUpdate(selection.text, amendedText);

      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        isUser: false,
        content: `✅ Selection amended successfully!\n\n**Original:**\n"${selection.text.substring(0, 100)}${selection.text.length > 100 ? '...' : ''}"\n\n**Updated:**\n"${amendedText.substring(0, 100)}${amendedText.length > 100 ? '...' : ''}"`,
        timestamp: new Date(),
        responseType: 'SELECTION_AMENDMENT',
        confidence: 0.95
      };

      setMessages(prev => [...prev, aiChatMessage]);

      toast({
        title: "Selection Amended",
        description: "The selected text has been updated.",
      });

    } catch (error) {
      console.error('🔴 Selection amendment error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        isUser: false,
        content: 'I encountered an error processing your selection amendment. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to amend selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, selectedSection, isProcessing, toast]);

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

  // Apply suggested content directly from AI message with smart merging
  const applyDirectSuggestion = useCallback(async (suggestedContent: string, strategy?: import('@/services/ipo/smartContentMerger').MergeStrategy, segments?: string[]) => {
    try {
      if (onContentUpdate) {
        // Use smart content merger instead of replacing everything
        const { smartContentMerger } = await import('@/services/ipo/smartContentMerger');
        
        let finalContent = suggestedContent;
        
        // If segments are provided, use only those segments
        if (segments?.length) {
          finalContent = segments.join('\n\n');
        }
        
        const mergedContent = strategy 
          ? smartContentMerger.smartMerge(currentContent, finalContent, strategy)
          : smartContentMerger.smartMerge(currentContent, finalContent);
        
        onContentUpdate(mergedContent);
        
        // Add confirmation message
        const confirmationMessage: ChatMessage = {
          id: `confirmation-${Date.now()}`,
          type: 'ai',
          isUser: false,
          content: '✅ Content enhanced successfully! The AI suggestion has been intelligently merged with your existing draft.',
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
  }, [onContentUpdate, analyzeCurrentContent, currentContent]);

  return {
    messages,
    isProcessing,
    currentAnalysis,
    contentFlags,
    setContentFlags,
    processMessage,
    processSelectionMessage,
    applyAutoFix,
    applyImprovement,
    applyDirectSuggestion,
    refreshAnalysis,
    analyzeCurrentContent
  };
};
