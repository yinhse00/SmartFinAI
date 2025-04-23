
import { logTruncation, LogLevel } from '../logLevel';
import { GUIDE_COVERED_ACTIONS } from '@/services/constants/financialConstants';

/**
 * Check Rights Issue response for completeness
 * @param content Response content to analyze
 * @returns Analysis result with completeness status and missing elements
 */
export function checkRightsIssueResponse(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };
  
  const lowerContent = content.toLowerCase();
  
  // Don't run standard checks if this is a comparison
  if (isComparisonQuery(content)) {
    return result;
  }
  
  // Check for HKEX Guide on Trading Arrangements reference
  if (!lowerContent.includes('guide on trading arrangement') && 
      !lowerContent.includes('trading arrangements guide') &&
      !lowerContent.includes('hkex guide')) {
    result.isComplete = false;
    result.missingElements.push("Missing reference to HKEX Guide on Trading Arrangements");
    result.confidence = 'high';
  }
  
  // Check for mandatory key elements per the HKEX Guide
  const mandatoryKeywords = [
    'ex-rights', 
    'nil-paid rights', 
    'trading period', 
    'record date', 
    'acceptance deadline',
    'last day of dealings',
    'payment date',
    'latest time for acceptance',
    'despatch of share certificates'
  ];
  
  const missingKeywords = mandatoryKeywords.filter(
    keyword => !lowerContent.includes(keyword) && !lowerContent.includes(keyword.replace('-', ' '))
  );
  
  if (missingKeywords.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingKeywords.map(k => `Missing key rights issue element: ${k}`)
    );
    result.confidence = missingKeywords.length > 3 ? 'high' : 'medium';
  }
  
  // Check for sufficient date information in timetables
  if (lowerContent.includes('timetable')) {
    const dateMatches = content.match(/\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi) || [];
    if (dateMatches.length < 6) { // Increased from 5 to ensure more comprehensive timetable
      result.isComplete = false;
      result.missingElements.push(`Insufficient key dates (found ${dateMatches.length}, HKEX guide requires more)`);
      result.confidence = 'high';
    }
    
    // Check for table format as per HKEX guide
    const hasProperTable = content.includes('|') && (content.includes('---|') || content.includes('---|---'));
    if (!hasProperTable) {
      result.isComplete = false;
      result.missingElements.push("Missing proper table format for timetable as recommended in HKEX guide");
      result.confidence = 'medium';
    }
    
    // Check that the response doesn't end abruptly with a table without conclusion
    const lastParagraphs = content.split('\n').slice(-7).join('\n').toLowerCase();
    if ((lastParagraphs.includes('|') || lastParagraphs.includes('-')) && 
        !lastParagraphs.includes('conclusion') && 
        !lastParagraphs.includes('summary') &&
        !lastParagraphs.includes('key points')) {
      result.isComplete = false;
      result.missingElements.push("Response ends with table without proper conclusion");
      result.confidence = 'medium';
    }
  }

  // Check for mandatory section headers that should be in a complete rights issue response
  const mandatorySections = [
    'timetable',
    'trading arrangement',
    'nil-paid rights'
  ];
  
  const missingSections = mandatorySections.filter(
    section => !lowerContent.includes(section)
  );
  
  if (missingSections.length > 0) {
    result.isComplete = false;
    result.missingElements.push(
      ...missingSections.map(s => `Missing mandatory section: ${s}`)
    );
  }
  
  return result;
}

/**
 * Check if content is a comparison query
 */
export function isComparisonQuery(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('difference between') || 
         lowerContent.includes('compare') || 
         lowerContent.includes('versus') || 
         lowerContent.includes('vs');
}

/**
 * Enhanced check for guide compliance specifically
 */
export function checkGuideCompliance(content: string, queryType: string): {
  compliant: boolean;
  missingElements: string[];
} {
  // Only check for guide-covered actions
  if (!GUIDE_COVERED_ACTIONS.includes(queryType)) {
    return { compliant: true, missingElements: [] };
  }
  
  const lowerContent = content.toLowerCase();
  const missingElements: string[] = [];
  
  // Check for guide reference
  if (!lowerContent.includes('guide on trading arrangement') && 
      !lowerContent.includes('trading arrangements guide') &&
      !lowerContent.includes('hkex guide')) {
    missingElements.push("No reference to HKEX Guide on Trading Arrangements");
  }
  
  // Check for structure compliance based on query type
  switch(queryType) {
    case 'rights_issue':
      if (!lowerContent.includes('nil-paid rights')) {
        missingElements.push("Missing discussion of nil-paid rights trading (required by HKEX guide)");
      }
      if (!lowerContent.includes('ex-right')) {
        missingElements.push("Missing ex-rights date (required by HKEX guide)");
      }
      break;
    case 'open_offer':
      if (!lowerContent.includes('no nil-paid rights') && 
          !lowerContent.includes('not include nil-paid')) {
        missingElements.push("Missing clarification about absence of nil-paid rights trading (required by HKEX guide)");
      }
      break;
    // Add other cases as needed
  }
  
  return {
    compliant: missingElements.length === 0,
    missingElements
  };
}
