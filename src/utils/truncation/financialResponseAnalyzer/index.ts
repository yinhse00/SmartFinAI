
import { checkRightsIssueResponse } from './rightsIssueChecker';
import { checkOpenOfferResponse } from './openOfferChecker';
import { checkTakeoverOfferResponse } from './takeoverOfferChecker';
import { checkConnectedTransactionResponse } from './connectedTransactionChecker';
import { checkAggregationResponse } from './aggregationChecker';
import { checkListingRulesResponse } from './listingRulesChecker';
import { checkChapter18CResponse } from '../checkers/chapter18cChecker';

/**
 * Analyze financial response completeness based on query type
 */
export function analyzeFinancialResponse(content: string, queryType: string) {
  if (!content || !queryType) {
    return { isComplete: true, missingElements: [] };
  }
  
  // Check if content contains Chapter 18C references
  const isChapter18CContent = content.toLowerCase().includes('chapter 18c') || 
                             content.toLowerCase().includes('specialist technology') || 
                             queryType === 'specialist_technology';
  
  // Conduct specialized analysis based on query type or content
  switch (queryType) {
    case 'rights_issue':
      return checkRightsIssueResponse(content);
    case 'open_offer':
      return checkOpenOfferResponse(content);
    case 'takeover_offer':
    case 'takeovers_code':
      return checkTakeoverOfferResponse(content);
    case 'connected_transactions':
      return checkConnectedTransactionResponse(content);
    case 'specialist_technology':
      return checkChapter18CResponse(content);
    case 'listing_rules':
      // First check if this content mentions Chapter 18C
      if (isChapter18CContent) {
        return checkChapter18CResponse(content);
      }
      
      // Check for rights issue aggregation rules
      if (content.toLowerCase().includes('7.19a') || 
          content.toLowerCase().includes('aggregate')) {
        return checkAggregationResponse(content);
      }
      
      // Default listing rules check
      return checkListingRulesResponse(content);
    default:
      // For other cases, check content for specialized topics
      if (isChapter18CContent) {
        return checkChapter18CResponse(content);
      }
      
      // Default response for general queries
      return { isComplete: true, missingElements: [] };
  }
}
