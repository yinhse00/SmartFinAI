
import { useState, useEffect } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';
import { getGrokApiKey, hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { extractReferences } from '@/services/contextUtils';
import { Message } from './ChatMessage';
import { contextService } from '@/services/regulatory/contextService';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';

export const useChatLogic = () => {
  const [input, setInput] = useState('');
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong regulatory assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all reference documents for better context
  const { data: referenceDocuments } = useReferenceDocuments();

  // Check if API key is set on component mount
  useEffect(() => {
    const hasGrokKey = hasGrokApiKey();
    setIsGrokApiKeySet(hasGrokKey);
    
    // Open dialog if no API key
    if (!hasGrokKey) {
      setApiKeyDialogOpen(true);
    }
  }, []);

  const handleSaveApiKeys = () => {
    if (grokApiKeyInput.trim()) {
      setGrokApiKey(grokApiKeyInput.trim());
      setIsGrokApiKeySet(true);
      toast({
        title: "API Key Saved",
        description: "Your Grok API key has been saved. You can now use the full Grok AI service.",
      });
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    setApiKeyDialogOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Check if Grok API key is set
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if this is a rights issue timetable query - special handling
      const isRightsIssueQuery = input.toLowerCase().includes('rights') && 
                                (input.toLowerCase().includes('issue') || 
                                 input.toLowerCase().includes('timetable'));
                                 
      const isSpecificTimetableRequest = isRightsIssueQuery && 
                                        (input.toLowerCase().includes('timetable') || 
                                         input.toLowerCase().includes('schedule') || 
                                         input.toLowerCase().includes('timeline'));

      // Set appropriate parameters based on query type
      const responseParams: any = {
        prompt: input,
        temperature: isSpecificTimetableRequest ? 0.1 : 0.7,  // Lower temperature for timetables
        maxTokens: isSpecificTimetableRequest ? 2000 : 1500  // More tokens for detailed timetables
      };
      
      // Get regulatory context with reasoning for the query
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(input);
      responseParams.regulatoryContext = regulatoryContext;
      
      // Log the context being used
      console.log("Using regulatory context:", regulatoryContext);
      
      try {
        // Generate response using Grok
        const response = await grokService.generateResponse(responseParams);
        
        // Check if we're using a fallback response (API call failed)
        const isUsingFallback = response.text.includes("Based on your query about") || 
                               response.text.includes("Regarding your query about") ||
                               response.text.includes("In response to your query");
        
        if (isUsingFallback && isGrokApiKeySet) {
          toast({
            title: "API Connection Issue",
            description: "Could not connect to Grok API. Using fallback response instead.",
            variant: "destructive"
          });
        }
        
        // Find references from the regulatory context
        const references = extractReferences(regulatoryContext);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date(),
          references: references,
          isUsingFallback: isUsingFallback,
          reasoning: reasoning
        };
        
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        toast({
          title: "Error",
          description: "Failed to generate a response. Please check your API key and try again.",
          variant: "destructive"
        });
        
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I encountered an error while trying to generate a response. Please check your API key and try again.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error in chat process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    isLoading,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown
  };
};
