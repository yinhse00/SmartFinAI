import { logTruncation, LogLevel } from './logLevel';

/**
 * Check Rights Issue response completeness based on HKEX Guide
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkRightsIssueCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-rights', 
    'nil-paid', 
    'trading period', 
    'record date', 
    'acceptance',
    'payment date',
    'dealings',
    'guide on trading'
  ];
  
  // Check for table structure as per HKEX guide
  const hasTable = content.includes('|') && content.includes('---|') && content.includes('timetable');
  
  // Check for minimum required dates as per HKEX guide
  const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
  const hasSufficientDates = dateMatches.length >= 6; // Increased from 5 to ensure compliance
  
  // Check for key required elements
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  // Check for HKEX guide reference which is mandatory
  const hasGuideReference = content.toLowerCase().includes('guide on trading') || 
                           content.toLowerCase().includes('trading arrangements guide') ||
                           content.toLowerCase().includes('hkex guide');
  
  return hasTable && hasSufficientDates && missingElements.length === 0 && hasGuideReference;
}

/**
 * Check Open Offer response completeness based on HKEX Guide
 * @param content The content to analyze
 * @returns Boolean indicating if the content is complete
 */
export function checkOpenOfferCompleteness(content: string): boolean {
  const requiredElements = [
    'ex-entitlement', 
    'application', 
    'acceptance', 
    'payment',
    'guide on trading'
  ];
  
  const hasTable = content.includes('|') && content.includes('---|');
  const missingElements = requiredElements.filter(
    element => !content.includes(element)
  );
  
  // Check for clarification about NO nil-paid rights trading - critical for open offers
  const hasNilPaidClarification = content.toLowerCase().includes('no nil-paid rights') || 
                                content.toLowerCase().includes('not include nil-paid');
  
  return hasTable && missingElements.length === 0 && hasNilPaidClarification;
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

/**
 * Validate timetable against HKEX Guide on Trading Arrangements
 * @param content Content to analyze
 * @param queryType Type of corporate action
 * @returns Analysis result with compliance status and issues
 */
export function validateTimetableAgainstGuide(
  content: string, 
  queryType: string
): { 
  isCompliant: boolean; 
  issues: string[];
} {
  const lowerContent = content.toLowerCase();
  const issues: string[] = [];
  
  // Common checks for all timetables per HKEX guide
  if (!lowerContent.includes('guide on trading') && 
      !lowerContent.includes('trading arrangements guide') &&
      !lowerContent.includes('hkex guide')) {
    issues.push("Missing reference to HKEX Guide on Trading Arrangements");
  }
  
  if (!content.includes('|') || !content.includes('---|')) {
    issues.push("Timetable not presented in proper table format as per HKEX guide");
  }
  
  // Check for proper date formatting
  const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
  if (dateMatches.length < 5) {
    issues.push("Insufficient date references in timetable");
  }
  
  // Type-specific checks
  switch (queryType) {
    case 'rights_issue':
      if (!lowerContent.includes('nil-paid')) {
        issues.push("Missing nil-paid rights trading period (required for rights issues)");
      }
      if (!lowerContent.includes('ex-rights') && !lowerContent.includes('ex rights')) {
        issues.push("Missing ex-rights date (required for rights issues)");
      }
      break;
    case 'open_offer':
      if (!lowerContent.includes('ex-entitlement') && !lowerContent.includes('ex entitlement')) {
        issues.push("Missing ex-entitlement date (required for open offers)");
      }
      if (!lowerContent.includes('no nil-paid') && !lowerContent.includes('not include nil-paid')) {
        issues.push("Missing clarification that open offers don't have nil-paid rights trading");
      }
      break;
    case 'share_consolidation':
      if (!lowerContent.includes('parallel trading') && queryType === 'share_consolidation') {
        issues.push("Missing parallel trading period (required for share consolidations)");
      }
      break;
    case 'board_lot_change':
      if (!lowerContent.includes('parallel trading') && queryType === 'board_lot_change') {
        issues.push("Missing parallel trading period (required for board lot changes)");
      }
      break;
  }
  
  return {
    isCompliant: issues.length === 0,
    issues
  };
}
