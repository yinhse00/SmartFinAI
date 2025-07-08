import { useState, useCallback } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
      content: 'Hello! I\'m here to help you refine your prospectus content. I can:\n\n• Improve language and tone\n• Enhance regulatory compliance\n• Add market context\n• Strengthen key points\n• Review for completeness\n\nWhat would you like me to help you with?',
      timestamp: new Date()
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
      // Build context-aware prompt for IPO content refinement
      const prompt = buildIPORefinerPrompt(userMessage, selectedSection, currentContent);

      // Generate AI response using existing grok service
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          projectId,
          sectionType: selectedSection,
          requestType: 'content_refinement'
        }
      });

      // Parse the response to check if it includes content modifications
      const aiResponse = parseAIResponse(response.text, currentContent);

      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        changes: aiResponse.changes
      };

      setMessages(prev => [...prev, aiChatMessage]);

      // Apply content changes if any
      if (aiResponse.changes && aiResponse.updatedContent) {
        onContentUpdate(aiResponse.updatedContent);
        toast({
          title: "Content Updated",
          description: "AI has improved your prospectus content based on your request."
        });
      }

    } catch (error) {
      console.error('Error processing IPO chat message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try rephrasing your question or check your API connection.',
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

  return {
    messages,
    isProcessing,
    processMessage
  };
};

/**
 * Build specialized prompt for IPO content refinement
 */
function buildIPORefinerPrompt(userRequest: string, sectionType: string, currentContent: string): string {
  return `
You are an expert Hong Kong investment banking professional specializing in IPO prospectus drafting. You are helping refine the "${getSectionTitle(sectionType)}" section of an IPO prospectus.

CURRENT CONTENT:
${currentContent || 'No content yet - user is starting from scratch.'}

USER REQUEST:
${userRequest}

INSTRUCTIONS:
1. If the user is asking for content modifications, provide the improved content.
2. If the user is asking questions, provide helpful guidance.
3. For content changes, start your response with "CONTENT_UPDATE:" followed by the new content.
4. For general guidance, start with "GUIDANCE:" followed by your advice.
5. Always maintain professional investment banking language.
6. Ensure HKEX compliance and regulatory requirements.
7. Keep the tone formal and appropriate for institutional investors.

Respond helpfully and professionally.`;
}

/**
 * Parse AI response to extract content modifications
 */
function parseAIResponse(aiText: string, originalContent: string) {
  if (aiText.startsWith('CONTENT_UPDATE:')) {
    const updatedContent = aiText.replace('CONTENT_UPDATE:', '').trim();
    return {
      message: 'I\'ve updated your content based on your request. The changes have been applied to your draft.',
      changes: {
        section: 'Content',
        before: originalContent.substring(0, 100) + '...',
        after: updatedContent.substring(0, 100) + '...'
      },
      updatedContent
    };
  }
  
  if (aiText.startsWith('GUIDANCE:')) {
    return {
      message: aiText.replace('GUIDANCE:', '').trim(),
      changes: undefined,
      updatedContent: undefined
    };
  }
  
  // Default case - treat as guidance
  return {
    message: aiText,
    changes: undefined,
    updatedContent: undefined
  };
}

/**
 * Get section title for context
 */
function getSectionTitle(sectionType: string): string {
  const titles = {
    'business': 'Business Overview',
    'history': 'History & Development', 
    'products': 'Products & Services',
    'strengths': 'Competitive Strengths',
    'strategy': 'Business Strategy',
    'financial_summary': 'Financial Summary',
    'risk_factors': 'Risk Factors'
  };
  return titles[sectionType] || 'Business Section';
}