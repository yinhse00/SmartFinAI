
import { checkListingRulesResponse } from './listingRulesChecker';
import { checkAggregationResponse } from './aggregationChecker';
import { checkConnectedTransactionResponse } from './connectedTransactionChecker';
import { checkTradingArrangementResponse } from './tradingArrangementChecker';
import { checkRightsIssueResponse } from './rightsIssueChecker';

/**
 * Core function to analyze financial responses based on query type
 * 
 * @param content The response content to analyze
 * @param queryType The type of financial query
 * @returns Analysis result with completeness status and missing elements
 */
export function analyzeFinancialResponse(content: string, queryType: string) {
  // Default result structure
  let result = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  // Normalize query type
  const normalizedType = queryType.toLowerCase();
  
  // Check for specific query types
  if (normalizedType.includes('aggregate') || normalizedType.includes('rule 7.19a')) {
    return checkAggregationResponse(content);
  }
  
  if (normalizedType.includes('connected') || normalizedType.includes('chapter 14a')) {
    return checkConnectedTransactionResponse(content);
  }
  
  if (normalizedType.includes('trading') || normalizedType.includes('arrangement') || 
      normalizedType.includes('timetable')) {
    return checkTradingArrangementResponse(content);
  }
  
  if (normalizedType.includes('rights issue')) {
    return checkRightsIssueResponse(content);
  }
  
  if (normalizedType.includes('rule') || normalizedType.includes('listing rules') || 
      normalizedType.includes('chapter')) {
    return checkListingRulesResponse(content);
  }
  
  // For generic financial queries, check for basic completeness
  const hasConclusion = content.toLowerCase().includes('conclusion') || 
                      content.toLowerCase().includes('in summary') || 
                      content.toLowerCase().includes('to summarize');
  
  if (!hasConclusion && content.length > 2000) {
    result.isComplete = false;
    result.isTruncated = true;
    result.missingElements.push('Missing conclusion section');
    result.confidence = 'medium';
  }
  
  return result;
}
