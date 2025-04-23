
import { analyzeRightsIssueResponse } from './rightsIssue';
import { analyzeOpenOfferResponse } from './openOffer';
import { analyzeTakeoverOfferResponse } from './takeoverOffer';
import { checkExecutionProcessCompleteness } from './executionProcess';
import { isExecutionProcessContent } from './helpers';

interface FinancialAnalysisResult {
  isComplete: boolean;
  isTruncated: boolean;
  missingElements: string[];
  confidence: 'high' | 'medium' | 'low';
  diagnostics: any;
}

export function analyzeFinancialResponse(content: string, financialQueryType?: string): FinancialAnalysisResult {
  const analysis: FinancialAnalysisResult = {
    isComplete: true,
    isTruncated: false,
    missingElements: [],
    confidence: 'high',
    diagnostics: {},
  };

  if (content.length > 3000 && !hasConclusion(content)) {
    analysis.isComplete = false;
    analysis.missingElements.push("Missing conclusion or summary section");
    analysis.confidence = 'medium';
  }

  if (financialQueryType) {
    if (['rights_issue'].includes(financialQueryType)) {
      const result = analyzeRightsIssueResponse(content);
      if (!result.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...result.missingElements);
        analysis.confidence = result.confidence;
      }
    }
    if (['open_offer'].includes(financialQueryType)) {
      const result = analyzeOpenOfferResponse(content);
      if (!result.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...result.missingElements);
        analysis.confidence = result.confidence;
      }
    }
    if (['takeover_offer', 'takeovers_code'].includes(financialQueryType)) {
      const result = analyzeTakeoverOfferResponse(content);
      if (!result.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...result.missingElements);
        analysis.confidence = result.confidence;
      }
    }
    if (isExecutionProcessContent(content)) {
      const result = checkExecutionProcessCompleteness(content, financialQueryType);
      if (!result.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...result.missingElements);
        if (result.confidence) analysis.confidence = result.confidence;
      }
    }
  }

  return analysis;
}

// Simple duplicate of the logic in contentHelpers to avoid circular imports
function hasConclusion(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('in conclusion') ||
         lowerContent.includes('to conclude') ||
         lowerContent.includes('key differences:') ||
         lowerContent.includes('key points:') ||
         lowerContent.includes('summary:') ||
         lowerContent.includes('to summarize');
}
