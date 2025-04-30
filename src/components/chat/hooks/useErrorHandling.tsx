
import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';

/**
 * Hook for handling errors during chat operations
 */
export const useErrorHandling = () => {
  const { toast } = useToast();
  
  /**
   * Handle API errors that occur during response generation
   * Returns an error message to display to the user
   */
  const handleApiError = (error: unknown, processedMessages: Message[]): Message => {
    // Enhanced error logging with structured information
    console.error("Error generating financial expert response:", error);
    
    // Log detailed error information for better debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      environment: !window.location.href.includes('localhost') && 
                  !window.location.href.includes('127.0.0.1') ? 'production' : 'development',
      currentUrl: window.location.href
    };
    console.error("Error details:", errorDetails);
    
    // Show consistent user-facing error notification
    toast({
      title: "SmartFinAI Response Error",
      description: "We encountered an issue processing your request. Showing available information.",
      variant: "destructive"
    });
    
    // Create standardized error message for display in the chat
    return {
      id: (Date.now() + 1).toString(),
      content: "I encountered an issue while analyzing your query. Please try again or rephrase your question.",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
  };
  
  /**
   * Handle fallback responses when API connection is unavailable
   */
  const handleFallbackResponse = (isGrokApiKeySet: boolean): void => {
    console.log('Using fallback response - API connection issue');
    
    toast({
      title: "Using Fallback Information",
      description: "Could not retrieve complete financial expertise. Showing available information.",
      variant: "default"
    });
  };
  
  return {
    handleApiError,
    handleFallbackResponse
  };
};
