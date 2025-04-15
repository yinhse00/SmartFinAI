import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { contextService } from '@/services/regulatory/contextService';
import { extractReferences } from '@/services/contextUtils';
import { identifyFinancialQueryType, isTradingArrangementRelated } from '../utils/queryTypeUtils';
import { getOptimalTemperature, getOptimalTokens } from '../utils/parameterUtils';
import { detectTruncationComprehensive, isTradingArrangementComplete } from '@/utils/truncationUtils';
import { Message } from '../ChatMessage';

/**
 * Hook for handling query execution logic
 */
export const useQueryExecution = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      
      // Special case for trading arrangements for various corporate actions
      if ((financialQueryType === 'rights_issue' || 
           financialQueryType === 'open_offer' || 
           financialQueryType === 'share_consolidation' || 
           financialQueryType === 'board_lot_change' || 
           financialQueryType === 'company_name_change') && 
          (queryText.toLowerCase().includes('timetable') || 
           queryText.toLowerCase().includes('trading arrangement') || 
           queryText.toLowerCase().includes('schedule'))) {
        
        // Fine-tuned parameters based on corporate action type
        console.log(`Processing ${financialQueryType} trading arrangement query`);
        
        // Set even more precise parameters for rights issue timetables
        if (financialQueryType === 'rights_issue') {
          maxTokens = 100000; // Increased token limit for rights issue timetables to 100,000
          temperature = 0.02; // Very precise temperature for structured output
        } else {
          maxTokens = 10000; // Increased from 5,000 to 10,000 for other corporate actions
          temperature = 0.05; // Low temperature for consistent output
        }
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
      
      await handleApiResponse(queryText, responseParams, regulatoryContext, reasoning, financialQueryType);
      
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

  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string
  ) => {
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
  };

  return {
    isLoading,
    processQuery
  };
};
