
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
    
    // More aggressive truncation detection
    const truncationIndicators = [
      '...', 'continued in next part', 'to be continued', 'more details to follow',
      'in the next section', 'will cover in part', 'truncated', 'cut off'
    ];
    
    const hasExplicitTruncationMarker = truncationIndicators.some(marker => 
      response.text.toLowerCase().includes(marker.toLowerCase())
    );
    
    // Combined check for truncation from multiple sources
    const isTruncated = diagnostics.isTruncated || 
                        financialAnalysis.isTruncated || 
                        !financialAnalysis.isComplete || 
                        hasExplicitTruncationMarker ||
                        (response.metadata?.responseCompleteness?.isComplete === false);
    
    // For batch parts, process the content
    let content = response.text;
    
    // Remove any part markers from content for cleaner presentation
    if (content.startsWith('[Part') || content.startsWith('Part')) {
      content = content.replace(/^\[Part \d+\]\s*\n+/i, '').replace(/^Part \d+\s*\n+/i, '');
    }
    
    // Clean up any CONTINUATION markers in the content (used by backend)
    content = content.replace(/\[CONTINUATION_PART_\d+\]/g, '');
    
    // Log detailed truncation analysis for debugging
    if (isTruncated) {
      console.log('Response truncation detected:', {
        basicDiagnostics: diagnostics.reasons,
        financialAnalysis: financialAnalysis.missingElements,
        metadataIndicators: response.metadata?.responseCompleteness,
        explicitMarkers: hasExplicitTruncationMarker
      });
    }
    
    const botMessage: Message = {
      id: (Date.now() + Math.random()).toString(),
      content: content,
      isUser: false,
      timestamp: new Date(),
      references: references,
      isUsingFallback: isUsingFallback,
      reasoning: reasoning,
      queryType: response.queryType,
      isTruncated: isTruncated,
      isBatchPart: response.batchPart ? true : false
    };
    
    return botMessage;
  };
  
  const showTruncationToast = (
    diagnostics: any,
    financialAnalysis: any,
    retryLastQuery: () => void
  ) => {
    // Fix: Add null/undefined checks before accessing length
    // More defensive coding to prevent undefined errors
    const diagnosticReasons = diagnostics?.reasons || [];
    const financialMissingElements = financialAnalysis?.missingElements || [];
    
    // Show toast with more detailed reason for truncation
    let truncationReason = "The response appears to have been cut off.";
    
    if (diagnosticReasons.length > 0) {
      truncationReason = `The response appears incomplete: ${diagnosticReasons[0]}`;
    } else if (financialMissingElements.length > 0) {
      truncationReason = `Financial content incomplete: ${financialMissingElements[0]}`;
    }
    
    toast({
      title: "Continue for More Information",
      description: truncationReason + " Click 'Continue' to get the next part of the answer.",
      duration: 10000,
      action: <Button 
               onClick={retryLastQuery}
               variant="outline"
               size="sm" 
               className="flex items-center gap-1 bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
              >
                <RefreshCw size={14} />
                Continue
              </Button>
    });
  };

  return {
    formatBotMessage,
    showTruncationToast
  };
};
