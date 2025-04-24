
import { logTruncation, LogLevel } from './logLevel';
import { detectTruncationComprehensive } from './advancedDetection';
import { analyzeFinancialResponse as analyzeFinancialResponseDetails } from './financialResponseAnalyzer';

/**
 * Analyzes a financial response for completeness with enhanced detection
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Analysis result with details about completeness
 */
export const analyzeFinancialResponse = (content: string, financialQueryType?: string) => {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low',
    diagnostics: {} as any
  };
  
  // Basic truncation detection - look for obvious markers
  if (content.endsWith('...') || 
      content.endsWith('…') || 
      (content.length > 0 && content.length < 50)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by basic indicators");
    analysis.confidence = 'high';
    return analysis;
  }
  
  // Check for unbalanced constructs (brackets, quotes, etc.)
  const { isUnbalanced, details } = checkUnbalancedConstructs(content);
  if (isUnbalanced) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response contains unbalanced syntax elements");
    analysis.diagnostics.unbalancedDetails = details;
    analysis.confidence = 'medium';
  }
  
  // Check for incomplete sentences at the end (if response is substantial)
  if (content.length > 300) {
    const lastParagraph = content.split('\n').filter(p => p.trim().length > 0).pop() || '';
    const endsWithCompleteSentence = Boolean(lastParagraph.match(/[.!?。]\s*$/));
    
    if (!endsWithCompleteSentence && lastParagraph.split(' ').length > 4) {
      analysis.isTruncated = true;
      analysis.isComplete = false;
      analysis.missingElements.push("Response ends with incomplete sentence");
      analysis.confidence = 'medium';
    }
  }

  // Enhanced checks for financial content types
  if (financialQueryType) {
    // Rights issue specific checks
    if (financialQueryType === 'rights_issue') {
      const hasRightsIssueDates = content.includes('record date') && 
                                  (content.includes('payment date') || content.includes('acceptance'));
      const hasNilPaidInfo = content.includes('nil-paid') || content.includes('nil paid');
      
      if (!hasRightsIssueDates && content.toLowerCase().includes('timetable')) {
        analysis.isComplete = false;
        analysis.missingElements.push("Missing rights issue key dates");
        analysis.confidence = 'high';
      }
      
      if (!hasNilPaidInfo && content.toLowerCase().includes('timetable')) {
        analysis.isComplete = false;
        analysis.missingElements.push("Missing nil-paid rights trading information");
        analysis.confidence = 'high';
      }
    }
    
    // Connected transaction checks
    else if (financialQueryType === 'connected_transaction' || content.toLowerCase().includes('connected transaction')) {
      const hasConnectedPersons = content.includes('connected person') || 
                                content.includes('connected persons');
      const hasThresholds = content.includes('de minimis') || 
                           content.includes('percentage ratio') || 
                           content.includes('threshold');
      
      if (!hasConnectedPersons) {
        analysis.isComplete = false;
        analysis.missingElements.push("Missing connected persons definition");
        analysis.confidence = 'high';
      }
      
      if (!hasThresholds) {
        analysis.isComplete = false;
        analysis.missingElements.push("Missing transaction thresholds");
        analysis.confidence = 'high';
      }
    }
    
    // Run detailed financial analysis using the specialized analyzer
    const financialAnalysis = analyzeFinancialResponseDetails(content, financialQueryType);
    
    // Only mark incomplete if we have multiple missing critical elements
    if (financialAnalysis.missingElements.length > 0) {
      analysis.isComplete = false;
      analysis.missingElements.push(...financialAnalysis.missingElements);
      analysis.confidence = financialAnalysis.confidence || 'medium';
    }
  }
  
  // Special check for comparison queries
  if (content.toLowerCase().includes('comparison') || 
      content.toLowerCase().includes('difference between') ||
      content.toLowerCase().includes('versus') ||
      content.toLowerCase().includes(' vs ')) {
    
    const hasConclusion = content.toLowerCase().includes('conclusion') || 
                        content.toLowerCase().includes('in summary') ||
                        content.toLowerCase().includes('to summarize');
    
    const hasBothSides = content.toLowerCase().includes('advantage') && 
                       content.toLowerCase().includes('disadvantage');
    
    if (!hasConclusion && content.length > 2000) {
      analysis.isComplete = false;
      analysis.missingElements.push("Missing conclusion section for comparison");
      analysis.confidence = 'medium';
    }
    
    if (!hasBothSides) {
      analysis.isComplete = false;
      analysis.missingElements.push("Missing pros/cons or complete comparison");
      analysis.confidence = 'medium';
    }
  }
  
  return analysis;
};

// Helper function to check for unbalanced constructs
function checkUnbalancedConstructs(content: string): { 
  isUnbalanced: boolean; 
  details: { [key: string]: number } 
} {
  const constructs: { [key: string]: { opening: string; closing: string } } = {
    parentheses: { opening: '(', closing: ')' },
    brackets: { opening: '[', closing: ']' },
    braces: { opening: '{', closing: '}' },
    codeBlocks: { opening: '```', closing: '```' }
  };
  
  const counts: { [key: string]: number } = {};
  let isUnbalanced = false;
  
  for (const [name, { opening, closing }] of Object.entries(constructs)) {
    const openCount = (content.match(new RegExp(`\\${opening}`, 'g')) || []).length;
    const closeCount = (content.match(new RegExp(`\\${closing}`, 'g')) || []).length;
    counts[name] = openCount - closeCount;
    
    if (Math.abs(openCount - closeCount) > 1) {
      isUnbalanced = true;
    }
  }
  
  return { isUnbalanced, details: counts };
}
