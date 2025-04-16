
import { logTruncation, LogLevel } from './logLevel';

/**
 * Analyzes a financial response for completeness
 * @param content Response content
 * @param financialQueryType Type of financial query
 * @returns Analysis result with details about completeness
 */
export const analyzeFinancialResponse = (content: string, financialQueryType?: string) => {
  const analysis = {
    isComplete: true,
    isTruncated: false,
    missingElements: [] as string[],
    diagnostics: {} as any
  };
  
  // Check for conclusion section in all financial responses
  if (content.length > 3000 && 
      !content.toLowerCase().includes('in conclusion') &&
      !content.toLowerCase().includes('to conclude') &&
      !content.toLowerCase().includes('key differences:') &&
      !content.toLowerCase().includes('key points:') &&
      !content.toLowerCase().includes('summary:') &&
      !content.toLowerCase().includes('to summarize')) {
    analysis.isComplete = false;
    analysis.missingElements.push("Missing conclusion or summary section");
  }
  
  // Domain-specific checks based on query type
  if (financialQueryType) {
    logTruncation(LogLevel.DEBUG, `Analyzing financial response for ${financialQueryType}`, {
      contentLength: content.length
    });
    
    const queryTypeCheckers = {
      'rights_issue': checkRightsIssueResponse,
      'open_offer': checkOpenOfferResponse
    };
    
    // Run the appropriate checker for the query type
    if (financialQueryType in queryTypeCheckers) {
      const checker = queryTypeCheckers[financialQueryType as keyof typeof queryTypeCheckers];
      const checkResult = checker(content);
      
      if (!checkResult.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...checkResult.missingElements);
      }
    }
    
    // Check for comparison queries across different financial types
    if (isComparisonQuery(content)) {
      const comparisonResult = checkComparisonResponse(content, financialQueryType);
      
      if (!comparisonResult.isComplete) {
        analysis.isComplete = false;
        analysis.missingElements.push(...comparisonResult.missingElements);
      }
    }
    
    // Check for listing rules references
    if ((financialQueryType.includes('rights_issue') || financialQueryType.includes('open_offer')) &&
        !content.match(/rule\s+[0-9.]+|chapter\s+[0-9]+/i)) {
      analysis.isComplete = false;
      analysis.missingElements.push("Missing listing rule references");
    }
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

/**
 * Check if content is a comparison query
 */
function isComparisonQuery(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('difference between') || 
         lowerContent.includes('compare') || 
         lowerContent.includes('versus') || 
         lowerContent.includes('vs');
}

/**
 * Check comparison response for completeness
 */
function checkComparisonResponse(content: string, queryType: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const lowerContent = content.toLowerCase();
  
  // Special checks for rights issue vs open offer comparison
  if (lowerContent.includes('rights issue') && lowerContent.includes('open offer')) {
    const mandatoryRightsIssueTerms = ['nil-paid rights', 'ex-rights', 'trading period'];
    const mandatoryOpenOfferTerms = ['no nil-paid', 'ex-entitlement', 'no trading of rights'];
    
    // Check for missing terms in the comparison
    const missingRightsTerms = mandatoryRightsIssueTerms.filter(term => !lowerContent.includes(term));
    const missingOpenOfferTerms = mandatoryOpenOfferTerms.filter(term => 
      !lowerContent.includes(term) && !lowerContent.includes(term.replace('-', ' ')));
    
    if (missingRightsTerms.length > 0) {
      result.isComplete = false;
      missingRightsTerms.forEach(term => {
        result.missingElements.push(`Missing key rights issue term: ${term}`);
      });
    }
    
    if (missingOpenOfferTerms.length > 0) {
      result.isComplete = false;
      missingOpenOfferTerms.forEach(term => {
        result.missingElements.push(`Missing key open offer term: ${term}`);
      });
    }
    
    // Check for timetable completeness in comparison
    if (lowerContent.includes('timetable')) {
      // For timetables, ensure we have adequate date information for both
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 8) { // We need more dates when comparing two timetables
        result.isComplete = false;
        result.missingElements.push(`Insufficient key dates for comparison (found ${dateMatches.length})`);
      }
    }
    
    // Check for conclusion specifically in comparison responses
    if (!lowerContent.includes('in conclusion') && 
        !lowerContent.includes('to conclude') && 
        !lowerContent.includes('key differences:') && 
        !lowerContent.includes('summary of differences')) {
      result.isComplete = false;
      result.missingElements.push("Missing conclusion section in comparison");
    }
  }
  
  return result;
}

/**
 * Check Rights Issue response for completeness
 */
function checkRightsIssueResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const lowerContent = content.toLowerCase();
  
  // Don't run standard checks if this is a comparison
  if (isComparisonQuery(content)) {
    return result;
  }
  
  const mandatoryKeywords = [
    'ex-rights', 
    'nil-paid rights', 
    'trading period', 
    'record date', 
    'acceptance deadline'
  ];
  
  const missingKeywords = mandatoryKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
    );
  }
  
  // Check for sufficient date information in timetables
  if (lowerContent.includes('timetable')) {
    const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
    if (dateMatches.length < 5) {
      result.isComplete = false;
      result.missingElements.push(`Insufficient key dates (found ${dateMatches.length})`);
    }
    
    // Check that the response doesn't end abruptly with a table without conclusion
    const lastParagraphs = content.split('\n').slice(-7).join('\n').toLowerCase();
    if ((lastParagraphs.includes('|') || lastParagraphs.includes('-')) && 
        !lastParagraphs.includes('conclusion') && 
        !lastParagraphs.includes('summary') &&
        !lastParagraphs.includes('key points')) {
      result.isComplete = false;
      result.missingElements.push("Response ends with table or list without conclusion");
    }
  }
  
  return result;
}

/**
 * Check Open Offer response for completeness
 */
function checkOpenOfferResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[]
  };
  
  const lowerContent = content.toLowerCase();
  
  // Skip standard checks for comparison queries
  if (isComparisonQuery(content)) {
    return result;
  }
  
  const mandatoryKeywords = ['ex-entitlement', 'record date', 'acceptance period', 'payment date'];
  
  const missingKeywords = mandatoryKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingKeywords.map(k => `Missing key open offer concept: ${k}`)
    );
  }
  
  // Check that open offer explicitly mentions no nil-paid rights
  if (!lowerContent.includes('no nil-paid') && !lowerContent.includes('not have nil-paid') && 
      !lowerContent.includes('unlike rights issues') && !lowerContent.includes('no trading of rights')) {
    result.isComplete = false;
    result.missingElements.push("Missing key open offer distinction (no nil-paid rights trading)");
  }
  
  return result;
}
