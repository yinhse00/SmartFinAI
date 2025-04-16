
import { useToast } from '@/hooks/use-toast';
import { Message } from '../ChatMessage';

/**
 * Hook for handling errors during chat operations
 */
export const useErrorHandling = () => {
  const { toast } = useToast();
  
  const handleApiError = (error: any, processedMessages: Message[]) => {
    console.error("Error generating financial expert response:", error);
    
    toast({
      title: "Expert Response Error",
      description: "Failed to generate a financial expert response. Please check your API key and try again.",
      variant: "destructive"
    });
    
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "I'm sorry, I encountered an error while analyzing your financial query. Please check your API key or try rephrasing your question.",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
    
    return errorMessage;
  };
  
  const handleFallbackResponse = (isGrokApiKeySet: boolean) => {
    console.log('Using fallback response - API connection issue');
    
    toast({
      title: "Financial Expert Connection Issue",
      description: "Could not connect to financial expertise service. Using fallback response.",
      variant: "destructive"
    });
  };
  
  return {
    handleApiError,
    handleFallbackResponse
  };
};
