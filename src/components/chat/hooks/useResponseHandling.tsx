
import { useToast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { extractReferences } from '@/services/contextUtils';
import { getTruncationDiagnostics, analyzeFinancialResponse, isTradingArrangementComplete } from '@/utils/truncationUtils';
import { Message } from '../ChatMessage';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Hook for handling API responses
 */
export const useResponseHandling = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  retryLastQuery: () => void,
  isGrokApiKeySet: boolean
) => {
  const { toast } = useToast();

  const handleApiResponse = async (
    queryText: string,
    responseParams: any,
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    financialQueryType: string,
    processedMessages: Message[]
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
      
      // Enhanced truncation detection with multiple methods
      const diagnostics = getTruncationDiagnostics(response.text);
      const isTruncated = diagnostics.isTruncated;
      
      // Financial content-specific analysis
      const financialAnalysis = analyzeFinancialResponse(response.text, financialQueryType);
      
      // Only check for trading arrangement truncation if not already detected
      const isTradingArrangementTruncated = !isTruncated && 
                                         isTradingArrangementRelated(queryText) && 
                                         !isTradingArrangementComplete(response.text, financialQueryType);
      
      const isResponseIncomplete = isTruncated || 
                                isTradingArrangementTruncated || 
                                !financialAnalysis.isComplete;
                                
      if (isResponseIncomplete) {
        console.log('Incomplete response detected:', {
          basicTruncation: isTruncated,
          diagnostics: diagnostics,
          tradingArrangementTruncated: isTradingArrangementTruncated,
          financialAnalysisMissingElements: financialAnalysis.missingElements
        });
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: 'bot',
        timestamp: new Date(),
        references: references,
        isUsingFallback: isUsingFallback,
        reasoning: reasoning,
        queryType: response.queryType,
        isTruncated: isResponseIncomplete
      };
      
      setMessages([...processedMessages, botMessage]);
      console.log('Response delivered successfully');
      
      if (botMessage.isTruncated) {
        console.log('Response appears to be truncated, showing retry option');
        
        // Show toast with more detailed reason for truncation
        let truncationReason = "The response appears to have been cut off.";
        
        if (diagnostics.reasons.length > 0) {
          truncationReason = `The response appears incomplete: ${diagnostics.reasons[0]}`;
        } else if (financialAnalysis.missingElements.length > 0) {
          truncationReason = `Financial content incomplete: ${financialAnalysis.missingElements[0]}`;
        }
        
        toast({
          title: "Incomplete Response",
          description: truncationReason + " You can retry your query to get a complete answer.",
          duration: 10000,
          action: <Button 
                   onClick={retryLastQuery}
                   variant="outline"
                   size="sm" 
                   className="flex items-center gap-1 bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
                  >
                    <RefreshCw size={14} />
                    Retry Query
                  </Button>
        });
      }
      
      return botMessage;
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
      
      setMessages([...processedMessages, errorMessage]);
      return errorMessage;
    }
  };

  return {
    handleApiResponse
  };
};

// Helper function to check if a query is related to trading arrangements
function isTradingArrangementRelated(queryText: string): boolean {
  const normalizedQuery = queryText.toLowerCase();
  return normalizedQuery.includes('trading arrangement') || 
         normalizedQuery.includes('timetable') || 
         normalizedQuery.includes('schedule');
}
