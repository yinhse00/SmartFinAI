import { useState, useEffect, useCallback } from 'react';
import { grokService } from '@/services/grokService';
import { useToast } from '@/hooks/use-toast';
import { getGrokApiKey, hasGrokApiKey, setGrokApiKey } from '@/services/apiKeyService';
import { extractReferences } from '@/services/contextUtils';
import { Message } from './ChatMessage';
import { contextService } from '@/services/regulatory/contextService';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { detectTruncation } from '@/utils/truncationUtils';

const FINANCIAL_QUERY_TYPES = {
  RIGHTS_ISSUE: 'rights_issue',
  CONNECTED_TRANSACTION: 'connected_transaction',
  TAKEOVERS: 'takeovers',
  PROSPECTUS: 'prospectus',
  GENERAL: 'general'
};

export const useChatLogic = () => {
  const [input, setInput] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [grokApiKeyInput, setGrokApiKeyInput] = useState('');
  const [isGrokApiKeySet, setIsGrokApiKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Hong Kong financial regulatory expert. How can I assist with your corporate finance, listing rules, or regulatory compliance questions today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: referenceDocuments } = useReferenceDocuments();

  useEffect(() => {
    const hasGrokKey = hasGrokApiKey();
    setIsGrokApiKeySet(hasGrokKey);
    
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
        description: "Your Grok API key has been saved. You can now use our specialized financial expertise service.",
      });
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Grok API key to access professional financial expertise.",
        variant: "destructive"
      });
      return;
    }
    
    setApiKeyDialogOpen(false);
  };

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
  }, [lastQuery]);

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
      
      const responseParams: any = {
        prompt: queryText,
        temperature: getOptimalTemperature(financialQueryType, queryText),
        maxTokens: getOptimalTokens(financialQueryType, queryText)
      };
      
      console.log(`Using specialized parameters - Temperature: ${responseParams.temperature}, Tokens: ${responseParams.maxTokens}`);
      
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
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date(),
          references: references,
          isUsingFallback: isUsingFallback,
          reasoning: reasoning,
          queryType: response.queryType,
          isTruncated: detectTruncation(response.text)
        };
        
        setMessages(prev => [...prev, botMessage]);
        console.log('Response delivered successfully');
        
        if (botMessage.isTruncated) {
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

  const identifyFinancialQueryType = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('rights issue')) {
      return FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE;
    } 
    
    if (lowerQuery.includes('connected transaction') || lowerQuery.includes('chapter 14a')) {
      return FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION;
    }
    
    if (lowerQuery.includes('takeover') || lowerQuery.includes('mandatory offer') || lowerQuery.includes('rule 26')) {
      return FINANCIAL_QUERY_TYPES.TAKEOVERS;
    }
    
    if (lowerQuery.includes('prospectus') || lowerQuery.includes('offering document') || lowerQuery.includes('ipo')) {
      return FINANCIAL_QUERY_TYPES.PROSPECTUS;
    }
    
    return FINANCIAL_QUERY_TYPES.GENERAL;
  };

  const getOptimalTemperature = (queryType: string, query: string): number => {
    if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
        (query.toLowerCase().includes('timetable') || query.toLowerCase().includes('schedule'))) {
      return 0.1;
    }
    
    if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
      return 0.2;
    }
    
    if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('analysis')) {
      return 0.3;
    }
    
    if (query.toLowerCase().includes('example') || query.toLowerCase().includes('case study')) {
      return 0.4;
    }
    
    return 0.3;
  };

  const getOptimalTokens = (queryType: string, query: string): number => {
    if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
        (query.toLowerCase().includes('timetable') || query.toLowerCase().includes('schedule'))) {
      return 2000;
    }
    
    if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
      return 1800;
    }
    
    if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
      return 1600;
    }
    
    return 1500;
  };

  return {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    setMessages,
    isLoading,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown,
    retryLastQuery
  };
};
