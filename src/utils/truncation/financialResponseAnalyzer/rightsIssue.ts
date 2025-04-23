
import { checkRightsIssueResponse, checkComparisonResponse, isComparisonQuery } from '../checkers';

export function analyzeRightsIssueResponse(content: string) {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low',
    diagnostics: {} as any
  };

  if (isComparisonQuery(content)) {
    const comparisonResult = checkComparisonResponse(content, "rights_issue");
    if (!comparisonResult.isComplete) {
      analysis.isComplete = false;
      analysis.missingElements.push(...comparisonResult.missingElements);
      analysis.confidence = comparisonResult.confidence || 'medium';
    }
    return analysis;
  }

  const checkResult = checkRightsIssueResponse(content);

  if (!checkResult.isComplete) {
    analysis.isComplete = false;
    analysis.missingElements.push(...checkResult.missingElements);
    analysis.confidence = checkResult.confidence || 'medium';
  }

  return analysis;
}
