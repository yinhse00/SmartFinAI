
import { logTruncation, LogLevel } from './logLevel';
import { detectTruncation, checkUnbalancedConstructs } from './basicDetection';

/**
 * Analyzes content for specific domain indicators of truncation and returns detailed diagnostics
 * @param content The content to analyze
 * @returns Detailed diagnostics object
 */
export const getTruncationDiagnostics = (content: string): {
  isTruncated: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  contentSample: string;
} => {
  const reasons: string[] = [];
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  // Check basic truncation
  if (detectTruncation(content)) {
    reasons.push("Basic truncation indicators detected");
    confidence = 'medium';
  }
  
  // Check unbalanced constructs
  const { isUnbalanced, details } = checkUnbalancedConstructs(content);
  if (isUnbalanced) {
    reasons.push(`Unbalanced programming constructs: ${JSON.stringify(details)}`);
    confidence = 'high';
  }
  
  // Advanced checks
  if (content.split(' ').length > 30 && 
      !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?')) {
    reasons.push("Content ends without proper punctuation");
  }
  
  if (content.includes('|') && content.includes('|---|') && !content.includes('|---')) {
    reasons.push("Table formatting appears to be cut off");
    confidence = 'high';
  }
  
  if ((content.match(/```/g) || []).length % 2 !== 0) {
    reasons.push("Uneven number of code block markers");
    confidence = 'high';
  }
  
  if (/\b(and|or|but|if|as|at|by|for|from|in|of|on|to|with)$/i.test(content.trim())) {
    reasons.push("Content ends with conjunction or preposition");
    confidence = 'medium';
  }
  
  // Financial specific checks - enhanced to detect rights issue and aggregation issues
  if (checkFinancialSpecificTruncation(content)) {
    confidence = 'high';
  }
  
  // Enhanced check for regulatory content
  if (checkRegulatoryContentTruncation(content)) {
    reasons.push("Regulatory content appears to be incomplete");
    confidence = 'high';
  }
  
  // Sample of content end for context
  const contentSample = content.length > 100 
    ? `...${content.slice(-100)}` 
    : content;
  
  const isTruncated = reasons.length > 0;
  
  if (isTruncated) {
    logTruncation(
      LogLevel.WARN, 
      "Truncation diagnostics show likely truncation", 
      { confidence, reasons, sample: content.slice(-40) }
    );
  }
  
  return {
    isTruncated,
    confidence,
    reasons,
    contentSample
  };
};

/**
 * Check for financial-specific truncation indicators
 * @param content The content to check
 * @returns Object with reasons and confidence level updates
 */
function checkFinancialSpecificTruncation(content: string): boolean {
  const lowerContent = content.toLowerCase();
  let foundIssue = false;
  
  // Timetable check
  if (lowerContent.includes('timetable') && 
     (content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || []).length < 5) {
    logTruncation(LogLevel.INFO, "Timetable appears incomplete - insufficient dates");
    foundIssue = true;
  }
  
  // Rights issue timetable check
  if (lowerContent.includes('rights issue') && 
      lowerContent.includes('timetable') && 
      !lowerContent.includes('acceptance')) {
    logTruncation(LogLevel.INFO, "Rights issue timetable missing acceptance information");
    foundIssue = true;
  }
  
  // Comparison check
  if (lowerContent.includes('difference between') && 
      lowerContent.includes('rights issue') && 
      lowerContent.includes('open offer') && 
      !lowerContent.includes('conclusion') && 
      !lowerContent.includes('summary') && 
      !lowerContent.includes('key differences')) {
    logTruncation(LogLevel.INFO, "Comparison appears to be missing conclusion section");
    foundIssue = true;
  }
  
  // Enhanced rights issue requirement checks
  if (lowerContent.includes('rights issue') && 
      lowerContent.includes('aggregate') && 
      !lowerContent.includes('12 months') && 
      !lowerContent.includes('50%')) {
    logTruncation(LogLevel.INFO, "Rights issue aggregation requirements incomplete");
    foundIssue = true;
  }
  
  return foundIssue;
}

/**
 * Check for regulatory-specific truncation indicators
 * @param content The content to check
 * @returns True if regulatory content appears incomplete
 */
function checkRegulatoryContentTruncation(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check for incomplete rule citations
  if ((lowerContent.includes('rule 7.19') || lowerContent.includes('rule 7.19a')) && 
      !lowerContent.includes('50% threshold') && 
      !lowerContent.includes('aggregation')) {
    return true;
  }
  
  // Check for incomplete rule analysis
  if (lowerContent.includes('rule') && 
      lowerContent.includes('approval') && 
      !lowerContent.includes('conclusion') && 
      !lowerContent.includes('summary')) {
    return true;
  }
  
  // Check for key requirements missing in rights issue responses
  if (lowerContent.includes('rights issue') && 
      lowerContent.includes('approval') && 
      !lowerContent.includes('independent shareholders')) {
    return true;
  }
  
  // Check for missing conclusion in lengthy responses
  if (content.length > 5000 && 
      !lowerContent.includes('in conclusion') && 
      !lowerContent.includes('to summarize') && 
      !lowerContent.includes('in summary')) {
    return true;
  }
  
  return false;
}
