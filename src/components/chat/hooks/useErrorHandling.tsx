
import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';

/**
 * Hook for handling errors during chat operations
 */
export const useErrorHandling = () => {
  const { toast } = useToast();
  
  const handleApiError = (error: any, processedMessages: Message[]) => {
    // CRITICAL FIX: Enhanced error logging for better debugging
    console.error("Error generating financial expert response:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      type: typeof error
    });
    
    // Log environment information for better context
    const isProduction = !window.location.href.includes('localhost') && 
                       !window.location.href.includes('127.0.0.1');
    console.log("Current environment:", isProduction ? "production" : "development");
    console.log("Current URL:", window.location.href);
    
    toast({
      title: "SmartFinAI Response Error",
      description: "We encountered an issue processing your request. Showing available information.",
      variant: "destructive"
    });
    
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "I encountered an issue while analyzing your query. Here's what I was able to process. You can try rephrasing your question if needed.",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
    
    return errorMessage;
  };
  
  const handleFallbackResponse = (isGrokApiKeySet: boolean) => {
    console.log('Using fallback response - API connection issue');
    
    // CRITICAL FIX: Less alarming message for fallback responses
    toast({
      title: "Partial Information Available",
      description: "Could not retrieve complete financial expertise. Showing available information.",
      variant: "default" // Changed from destructive to default
    });
  };
  
  return {
    handleApiError,
    handleFallbackResponse
  };
};
