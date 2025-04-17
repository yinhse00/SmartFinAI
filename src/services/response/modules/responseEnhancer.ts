
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
    isBackupResponse?: boolean
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
      isBackupResponse
    );
  }
};

/**
 * Determine if a query is related to trading arrangements
 */
function isTradingArrangementQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for trading arrangement indicators in the prompt
  const hasTradingArrangement = lowerPrompt.includes('trading arrangement');
  const hasTradingSchedule = lowerPrompt.includes('trading') && lowerPrompt.includes('schedule');
  
  // Check for corporate actions with timetables
  const hasCorporateAction = 
    lowerPrompt.includes('rights issue') || 
    lowerPrompt.includes('open offer') ||
    lowerPrompt.includes('share consolidation') ||
    lowerPrompt.includes('sub-division') ||
    lowerPrompt.includes('board lot') || 
    lowerPrompt.includes('company name');
    
  const hasTimeReference = 
    lowerPrompt.includes('timetable') || 
    lowerPrompt.includes('schedule');
  
  // Return true if any of the conditions are met
  return hasTradingArrangement || hasTradingSchedule || (hasCorporateAction && hasTimeReference);
}
