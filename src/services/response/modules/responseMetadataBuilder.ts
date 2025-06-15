
/**
 * Response metadata builder for regulatory responses
 * Handles creation of response metadata with completeness analysis
 */
import { getTruncationDiagnostics } from '@/utils/truncation';

export interface ResponseMetadata {
  contextUsed: boolean;
  relevanceScore: number;
  tradingArrangementInfoUsed: boolean;
  takeoversCodeUsed: boolean;
  whitewashInfoIncluded: boolean;
  referenceDocumentsUsed: boolean;
  isBackupResponse?: boolean;
  responseCompleteness: {
    isComplete: boolean;
    confidence: number;
    reasons: string[];
  };
}

export const responseMetadataBuilder = {
  /**
   * Build comprehensive metadata for the response
   */
  buildMetadata: (
    text: string,
    queryType: string,
    contextUsed: boolean,
    relevanceScore: number,
    tradingArrangementInfoUsed: boolean,
    takeoversCodeUsed: boolean,
    isWhitewashQuery: boolean,
    hasRefDocuments: boolean,
    isBackupResponse?: boolean
  ): ResponseMetadata => {
    // Enhanced response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    // For Rule 7.19A(1) aggregation questions, ensure content completeness
    const isAggregationResponse = text.toLowerCase().includes('7.19a') && 
                               text.toLowerCase().includes('aggregate') &&
                               queryType === 'listing_rules';
    
    let completenessOverride = false;
    
    // Check if the response looks complete despite truncation indicators
    if (isAggregationResponse && 
        diagnostics.isTruncated && 
        text.toLowerCase().includes('50%') && 
        text.toLowerCase().includes('within 12 months') &&
        text.toLowerCase().includes('independent shareholders') &&
        text.toLowerCase().includes('conclusion')) {
      completenessOverride = true;
    }
    
    return {
      contextUsed: contextUsed,
      relevanceScore: relevanceScore,
      tradingArrangementInfoUsed: tradingArrangementInfoUsed,
      takeoversCodeUsed: takeoversCodeUsed,
      whitewashInfoIncluded: isWhitewashQuery && 
        (text.toLowerCase().includes('whitewash') && 
         text.toLowerCase().includes('dealing')),
      referenceDocumentsUsed: hasRefDocuments,
      isBackupResponse: isBackupResponse,
      responseCompleteness: {
        isComplete: completenessOverride || !diagnostics.isTruncated,
        confidence: diagnostics.confidence,
        reasons: diagnostics.reasons
      }
    };
  }
};
