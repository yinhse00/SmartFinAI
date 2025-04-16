
import { detectTruncationComprehensive } from './comprehensiveDetection';
import { logTruncation, LogLevel } from './logLevel';

/**
 * Analyzes a response for financial-specific completeness indicators
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Detailed analysis of content completeness
 */
export const analyzeFinancialResponse = (content: string, financialQueryType?: string) => {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    diagnostics: {} as any
  };
  
  // Basic truncation check with more comprehensive detection
  if (detectTruncationComprehensive(content)) {
    analysis.isTruncated = true;
    analysis.isComplete = false;
    analysis.missingElements.push("Response appears truncated by advanced indicators");
  }
  
  // Domain-specific checks based on query type
  if (financialQueryType) {
    logTruncation(LogLevel.DEBUG, `Analyzing financial response for ${financialQueryType}`, {
      contentLength: content.length
    });
    
    // Rights Issue specific checks
    if (financialQueryType.includes('rights_issue')) {
      const mandatoryKeywords = [
        'ex-rights', 
        'nil-paid rights', 
        'trading period', 
        'record date', 
        'acceptance deadline'
      ];
      
      const missingKeywords = mandatoryKeywords.filter(
        keyword => !content.toLowerCase().includes(keyword)
      );
      
      if (missingKeywords.length > 0) {
        analysis.isComplete = false;
        analysis.missingElements.push(
          ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
        );
      }
      
      // Check for sufficient date information
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 5) {
        analysis.isComplete = false;
        analysis.missingElements.push(`Insufficient key dates (found ${dateMatches.length})`);
      }
    }
    
    // Similar detailed checks can be added for other financial query types
    // like takeovers, open offers, etc.
  }
  
  // Log if the response is not complete
  if (!analysis.isComplete) {
    logTruncation(
      LogLevel.WARN, 
      "Financial response analysis shows incomplete content", 
      { 
        queryType: financialQueryType,
        missingElements: analysis.missingElements
      }
    );
  }
  
  return analysis;
};

