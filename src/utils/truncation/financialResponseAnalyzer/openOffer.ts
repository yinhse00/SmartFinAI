
import { checkOpenOfferResponse, checkComparisonResponse, isComparisonQuery } from '../checkers';

export function analyzeOpenOfferResponse(content: string) {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low',
    diagnostics: {} as any
  };

  if (isComparisonQuery(content)) {
    const comparisonResult = checkComparisonResponse(content, "open_offer");
    if (!comparisonResult.isComplete) {
      analysis.isComplete = false;
      analysis.missingElements.push(...comparisonResult.missingElements);
      analysis.confidence = comparisonResult.confidence || 'medium';
    }
    return analysis;
  }

  const checkResult = checkOpenOfferResponse(content);

  if (!checkResult.isComplete) {
    analysis.isComplete = false;
    analysis.missingElements.push(...checkResult.missingElements);
    analysis.confidence = checkResult.confidence || 'medium';
  }

  // Additional hardcoded regulatory checks can go here if needed

  return analysis;
}

export function evaluateOpenOfferContent(content: string): { isComplete: boolean; missingElements: string[] } {
  const analysis = analyzeOpenOfferResponse(content);
  return {
    isComplete: analysis.isComplete,
    missingElements: analysis.missingElements || []
  };
}
