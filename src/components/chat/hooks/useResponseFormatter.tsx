
import { useToast } from '@/hooks/use-toast';
import { extractReferences } from '@/services/contextUtils';
import { getTruncationDiagnostics, analyzeFinancialResponse } from '@/utils/truncation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Message } from '../ChatMessage';

/**
 * Hook for formatting response messages with proper metadata
 */
export const useResponseFormatter = () => {
  const { toast } = useToast();
  
  const formatBotMessage = (
    response: any, 
    regulatoryContext: string | undefined,
    reasoning: string | undefined,
    isUsingFallback: boolean
  ): Message => {
    const references = extractReferences(regulatoryContext);
    
    // Enhanced truncation detection with multiple methods
    const diagnostics = getTruncationDiagnostics(response.text);
    
    // Use financial response analyzer for additional checks
    const financialAnalysis = analyzeFinancialResponse(response.text, response.queryType);
    
    // Combined check for truncation from multiple sources
    const isTruncated = diagnostics.isTruncated || financialAnalysis.isTruncated;
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response.text,
      sender: 'bot',
      timestamp: new Date(),
      references: references,
      isUsingFallback: isUsingFallback,
      reasoning: reasoning,
      queryType: response.queryType,
      isTruncated: isTruncated
    };
    
    return botMessage;
  };
  
  const showTruncationToast = (
    diagnostics: any,
    financialAnalysis: any,
    retryLastQuery: () => void
  ) => {
    // Show toast with more detailed reason for truncation
    let truncationReason = "The response appears to have been cut off.";
    
    if (diagnostics.reasons.length > 0) {
      truncationReason = `The response appears incomplete: ${diagnostics.reasons[0]}`;
    } else if (financialAnalysis.missingElements.length > 0) {
      truncationReason = `Financial content incomplete: ${financialAnalysis.missingElements[0]}`;
    }
    
    toast({
      title: "Incomplete Response Detected",
      description: truncationReason + " You can retry your query to get a complete answer with increased token limits.",
      duration: 15000,
      action: <Button 
               onClick={retryLastQuery}
               variant="outline"
               size="sm" 
               className="flex items-center gap-1 bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
              >
                <RefreshCw size={14} />
                Retry with Higher Limits
              </Button>
    });
  };

  return {
    formatBotMessage,
    showTruncationToast
  };
};
