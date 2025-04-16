import { GrokResponse } from '@/types/grok';
import { responseFormatter } from './responseFormatter';
import { detectFinancialExpertiseArea } from '@/services/financial/expertiseDetection';
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
    queryText: string,
    isBackupResponse?: boolean  // Added optional parameter
  ): GrokResponse => {
    const isExpertResponse = detectFinancialExpertiseArea(queryText) !== 'general';
    const tradingInfo = isTradingArrangementQuery(queryText);
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
      tradingInfo,
      containsTakeoversCode,
      isWhitewashQuery,
      hasRefDocuments,
      isBackupResponse  // Pass the parameter
    );
  }
};

/**
 * Determine if a query is related to trading arrangements
 */
function isTradingArrangementQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  return lowerPrompt.includes('trading arrangement') || 
         (lowerPrompt.includes('trading') && lowerPrompt.includes('schedule')) ||
         ((lowerPrompt.includes('rights issue') || 
           lowerPrompt.includes('open offer') ||
           lowerPrompt.includes('share consolidation') ||
           lowerPrompt.includes('sub-division') ||
           lowerPrompt.includes('board lot') || 
           lowerPrompt.includes('company name')) && 
           (lowerPrompt.includes('timetable') || 
            lowerPrompt.includes('schedule')));
}
