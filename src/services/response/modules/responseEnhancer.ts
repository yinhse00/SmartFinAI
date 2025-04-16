
import { GrokResponse } from '@/types/grok';
import { responseFormatter } from './responseFormatter';
import { isFinancialExpertResponse } from '@/services/financial/expertiseDetection';
import { getTradingArrangementInfo } from '@/services/financial/tradingArrangements';
import { getTruncationDiagnostics } from '@/utils/truncation';

/**
 * Service for enhancing responses with metadata
 */
export const responseEnhancer = {
  /**
   * Enhance a response with additional metadata
   */
  enhanceResponse: (
    text: string,
    queryType: string | null,
    usedContext: boolean,
    contextRelevanceScore: number,
    queryText: string
  ): GrokResponse => {
    const isExpertResponse = isFinancialExpertResponse(text);
    const tradingInfo = getTradingArrangementInfo(text, queryText);
    const containsTakeoversCode = text.toLowerCase().includes('takeovers code') || 
                                 text.toLowerCase().includes('takeover code');
    const isWhitewashQuery = queryText.toLowerCase().includes('whitewash');
    const hasRefDocuments = text.includes('REFERENCE DOCUMENTS:');
    
    // Add response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    return responseFormatter.formatResponse(
      text,
      queryType || 'general',
      usedContext,
      contextRelevanceScore,
      tradingInfo !== null,
      containsTakeoversCode,
      isWhitewashQuery,
      hasRefDocuments
    );
  }
};
