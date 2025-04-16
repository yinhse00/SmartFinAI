
import { logTruncation, LogLevel } from './logLevel';

/**
 * Check Rights Issue response completeness
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkRightsIssueCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-rights', 
    'nil-paid', 
    'trading period', 
    'record date', 
    'acceptance'
  ];
  
  // Check for table structure
  const hasTable = content.includes('|') && content.includes('---|') && content.includes('timetable');
  
  // Check for minimum required dates
  const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
  const hasSufficientDates = dateMatches.length >= 5;
  
  // Check for key required elements
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && hasSufficientDates && missingElements.length === 0;
}

/**
 * Check Open Offer response completeness
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkOpenOfferCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-entitlement', 
    'application', 
    'acceptance', 
    'payment'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Share Consolidation/Subdivision completeness
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkShareReorganizationCompleteness(content: string): boolean {
  const requiredElements = [
    'general meeting', 
    'effective date', 
    'exchange period'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Board Lot Change completeness
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkBoardLotCompleteness(content: string): boolean {
  const requiredElements = [
    'parallel trading', 
    'board lot', 
    'exchange'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}

/**
 * Check Company Name Change completeness
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkCompanyNameChangeCompleteness(content: string): boolean {
  const requiredElements = [
    'general meeting', 
    'effective date', 
    'stock short name'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  return hasTable && missingElements.length === 0;
}
