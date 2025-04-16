
import { GrokResponse } from '@/types/grok';
import { getTruncationDiagnostics } from '@/utils/truncationUtils';

/**
 * Service for formatting final responses
 */
export const responseFormatter = {
  /**
   * Format the final response with metadata
   */
  formatResponse: (
    text: string, 
    queryType: string,
    contextUsed: boolean,
    relevanceScore: number,
    tradingArrangementInfoUsed: boolean,
    takeoversCodeUsed: boolean,
    isWhitewashQuery: boolean,
    hasRefDocuments: boolean
  ): GrokResponse => {
    // Add response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    return {
      text: text,
      queryType: queryType,
      metadata: {
        contextUsed: contextUsed,
        relevanceScore: relevanceScore,
        tradingArrangementInfoUsed: tradingArrangementInfoUsed,
        takeoversCodeUsed: takeoversCodeUsed,
        whitewashInfoIncluded: isWhitewashQuery && 
          (text.toLowerCase().includes('whitewash') && 
           text.toLowerCase().includes('dealing')),
        referenceDocumentsUsed: hasRefDocuments,
        responseCompleteness: {
          isComplete: !diagnostics.isTruncated,
          confidence: diagnostics.confidence,
          reasons: diagnostics.reasons
        }
      }
    };
  }
};
