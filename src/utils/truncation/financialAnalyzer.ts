
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
    
    // Rights Issue specific checks
    if (financialQueryType.includes('rights_issue')) {
      const lowerContent = content.toLowerCase();
      
      // For comparison queries, check for both key concepts being compared
      if (lowerContent.includes('difference between') || 
          lowerContent.includes('compare') || 
          lowerContent.includes('versus') || 
          lowerContent.includes('vs')) {
            
        // Check for both rights issue and open offer concepts
        if (lowerContent.includes('rights issue') && lowerContent.includes('open offer')) {
          const mandatoryRightsIssueTerms = ['nil-paid rights', 'ex-rights', 'trading period'];
          const mandatoryOpenOfferTerms = ['no nil-paid', 'ex-entitlement', 'no trading of rights'];
          
          // Check for missing terms in the comparison
          const missingRightsTerms = mandatoryRightsIssueTerms.filter(term => !lowerContent.includes(term));
          const missingOpenOfferTerms = mandatoryOpenOfferTerms.filter(term => 
            !lowerContent.includes(term) && !lowerContent.includes(term.replace('-', ' ')));
          
          if (missingRightsTerms.length > 0) {
            analysis.isComplete = false;
            missingRightsTerms.forEach(term => {
              analysis.missingElements.push(`Missing key rights issue term: ${term}`);
            });
          }
          
          if (missingOpenOfferTerms.length > 0) {
            analysis.isComplete = false;
            missingOpenOfferTerms.forEach(term => {
              analysis.missingElements.push(`Missing key open offer term: ${term}`);
            });
          }
          
          // Check for timetable completeness in comparison
          if (lowerContent.includes('timetable')) {
            // For timetables, ensure we have adequate date information for both
            const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
            if (dateMatches.length < 8) { // We need more dates when comparing two timetables
              analysis.isComplete = false;
              analysis.missingElements.push(`Insufficient key dates for comparison (found ${dateMatches.length})`);
            }
          }
          
          // Check for conclusion specifically in comparison responses
          if (!lowerContent.includes('in conclusion') && 
              !lowerContent.includes('to conclude') && 
              !lowerContent.includes('key differences:') && 
              !lowerContent.includes('summary of differences')) {
            analysis.isComplete = false;
            analysis.missingElements.push("Missing conclusion section in comparison");
          }
        } else {
          // Standard rights issue query
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
            analysis.isComplete = false;
            analysis.missingElements.push(
              ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
            );
          }
        }
      } else {
        // Standard rights issue checks
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
          analysis.isComplete = false;
          analysis.missingElements.push(
            ...missingKeywords.map(k => `Missing key rights issue concept: ${k}`)
          );
        }
      }
      
      // Check for sufficient date information
      const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
      if (dateMatches.length < 5 && content.toLowerCase().includes('timetable')) {
        analysis.isComplete = false;
        analysis.missingElements.push(`Insufficient key dates (found ${dateMatches.length})`);
      }
      
      // Check that the response doesn't end abruptly
      if (content.toLowerCase().includes('timetable') || 
          content.toLowerCase().includes('comparison')) {
        // Check if the response ends with a table or list without conclusion
        const lastParagraphs = content.split('\n').slice(-7).join('\n').toLowerCase();
        if ((lastParagraphs.includes('|') || lastParagraphs.includes('-')) && 
            !lastParagraphs.includes('conclusion') && 
            !lastParagraphs.includes('summary') &&
            !lastParagraphs.includes('key points')) {
          analysis.isComplete = false;
          analysis.missingElements.push("Response ends with table or list without conclusion");
        }
      }
    }
    
    // Open offer checks
    if (financialQueryType.includes('open_offer')) {
      const mandatoryKeywords = ['ex-entitlement', 'record date', 'acceptance period', 'payment date'];
      const lowerContent = content.toLowerCase();
      
      const missingKeywords = mandatoryKeywords.filter(
        keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
      );
      
      if (missingKeywords.length > 0) {
        analysis.isComplete = false;
        analysis.missingElements.push(
          ...missingKeywords.map(k => `Missing key open offer concept: ${k}`)
        );
      }
      
      // Check that open offer explicitly mentions no nil-paid rights
      if (!lowerContent.includes('no nil-paid') && !lowerContent.includes('not have nil-paid') && 
          !lowerContent.includes('unlike rights issues') && !lowerContent.includes('no trading of rights')) {
        analysis.isComplete = false;
        analysis.missingElements.push("Missing key open offer distinction (no nil-paid rights trading)");
      }
    }
    
    // Ensure response explicitly mentions key listing rules for both
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
