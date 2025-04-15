
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { contextService } from '@/services/regulatory/contextService';
import { extractReferences } from '@/services/contextUtils';
import { Message } from '../ChatMessage';
import { identifyFinancialQueryType, isTradingArrangementRelated } from '../utils/queryTypeUtils';
import { getOptimalTemperature, getOptimalTokens } from '../utils/parameterUtils';
import { detectTruncationComprehensive, isTradingArrangementComplete } from '@/utils/truncationUtils';
import { hasGrokApiKey } from '@/services/apiKeyService';

/**
 * Hook to manage query processing
 */
export const useQueryProcessor = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  lastQuery: string,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const retryLastQuery = useCallback(() => {
    if (!lastQuery) {
      toast({
        title: "No previous query",
        description: "There is no previous query to retry.",
        variant: "destructive"
      });
      return;
    }
    
    setInput(lastQuery);
    setTimeout(() => {
      processQuery(lastQuery);
    }, 100);
  }, [lastQuery, setInput, toast]);

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    if (!isGrokApiKeySet) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    setLastQuery(queryText);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: queryText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.group('Financial Query Processing');
      
      const financialQueryType = identifyFinancialQueryType(queryText);
      console.log('Financial Query Type:', financialQueryType);
      
      // Optimized parameters for preventing truncation
      let maxTokens = getOptimalTokens(financialQueryType, queryText);
      let temperature = getOptimalTemperature(financialQueryType, queryText);
      
      // Special case for rights issue timetable starting from a specific date
      if (financialQueryType === 'rights_issue' && 
          (queryText.toLowerCase().includes('timetable') || 
           queryText.toLowerCase().includes('schedule')) &&
          (queryText.toLowerCase().includes('june') || 
           queryText.toLowerCase().includes('july') || 
           queryText.toLowerCase().includes('jan'))) {
        maxTokens = 4000; // Increased token limit for rights issue timetables
        temperature = 0.05; // Very low temperature for precise output
      }
      
      console.log(`Using specialized parameters - Temperature: ${temperature}, Tokens: ${maxTokens}`);
      
      const responseParams: any = {
        prompt: queryText,
        temperature: temperature,
        maxTokens: maxTokens
      };
      
      const { context: regulatoryContext, reasoning } = await contextService.getRegulatoryContextWithReasoning(queryText);
      responseParams.regulatoryContext = regulatoryContext;
      
      console.log('Financial Context Length:', regulatoryContext?.length);
      console.log('Financial Reasoning:', reasoning);
      
      try {
        console.log('Calling Grok financial expert API');
        const response = await grokService.generateResponse(responseParams);
        
        const isUsingFallback = response.text.includes("Based on your query about") || 
                               response.text.includes("Regarding your query about") ||
                               response.text.includes("In response to your query");
        
        if (isUsingFallback && isGrokApiKeySet) {
          console.log('Using fallback response - API connection issue');
          toast({
            title: "Financial Expert Connection Issue",
            description: "Could not connect to financial expertise service. Using fallback response.",
            variant: "destructive"
          });
        }
        
        const references = extractReferences(regulatoryContext);
        
        // More accurate truncation detection
        const isTruncated = detectTruncationComprehensive(response.text);
        
        // Only check for trading arrangement truncation if not already detected
        const isTradingArrangementTruncated = !isTruncated && 
                                           isTradingArrangementRelated(queryText) && 
                                           !isTradingArrangementComplete(response.text, financialQueryType);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date(),
          references: references,
          isUsingFallback: isUsingFallback,
          reasoning: reasoning,
          queryType: response.queryType,
          isTruncated: isTruncated || isTradingArrangementTruncated
        };
        
        setMessages(prev => [...prev, botMessage]);
        console.log('Response delivered successfully');
        
        if (botMessage.isTruncated) {
          console.log('Response appears to be truncated, showing retry option');
          toast({
            title: "Incomplete Response",
            description: "The response appears to have been cut off. You can retry your query to get a complete answer.",
            duration: 10000,
            action: <button 
                     onClick={retryLastQuery} 
                     className="px-3 py-1 rounded bg-finance-medium-blue text-white text-xs hover:bg-finance-dark-blue"
                    >
                      Retry Query
                    </button>
          });
        }
      } catch (error) {
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
        
        setMessages(prev => [...prev, errorMessage]);
      }
      
      console.groupEnd();
    } catch (error) {
      console.error("Error in financial chat process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    processQuery(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery
  };
};
