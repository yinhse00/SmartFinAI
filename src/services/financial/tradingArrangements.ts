import { TRADING_ARRANGEMENTS, CORPORATE_ACTION_PROCESSES } from '../constants/tradingConstants';
import { generateDynamicTimetable } from './dynamicTimetableGenerator';
import { addBusinessDays } from '@/services/calendar/businessDayCalculator';

/**
 * Get fallback trading arrangement template based on type with reference document integration
 */
export async function getFallbackTradingArrangement(type: string, query: string): Promise<string> {
  // Check for execution process queries
  const isExecutionProcessQuery = query.toLowerCase().includes('execution') || 
                                 query.toLowerCase().includes('process') || 
                                 query.toLowerCase().includes('working') || 
                                 query.toLowerCase().includes('timeline');
  
  // If it's an execution process query, use dynamic business day calculation with reference docs
  if (isExecutionProcessQuery) {
    return await generateDynamicTimetable(type);
  }
  
  // For timetable queries, use business day calculations with reference docs
  if (query.toLowerCase().includes('timetable') || 
      query.toLowerCase().includes('schedule') ||
      query.toLowerCase().includes('timeline')) {
    return await generateDynamicTimetable(type);
  }
  
  // Otherwise, use enhanced static templates with business day notes
  return getEnhancedTradingArrangement(type, query);
}

/**
 * Get enhanced trading arrangement with business day annotations
 */
function getEnhancedTradingArrangement(type: string, query: string): string {
  let baseTemplate: string;
  
  switch (type) {
    case 'rights_issue':
      baseTemplate = TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      break;
    case 'open_offer':
      baseTemplate = TRADING_ARRANGEMENTS.OPEN_OFFER;
      break;
    case 'share_consolidation': 
      baseTemplate = TRADING_ARRANGEMENTS.SHARE_CONSOLIDATION;
      break;
    case 'board_lot_change':
      baseTemplate = TRADING_ARRANGEMENTS.BOARD_LOT_CHANGE;
      break;
    case 'company_name_change':
      baseTemplate = TRADING_ARRANGEMENTS.COMPANY_NAME_CHANGE;
      break;
    case 'takeovers_code':
    case 'takeover_offer':
      baseTemplate = TRADING_ARRANGEMENTS.GENERAL_OFFER;
      break;
    default:
      if (query.toLowerCase().includes('general offer') || 
          query.toLowerCase().includes('mandatory offer') || 
          query.toLowerCase().includes('takeover')) {
        baseTemplate = TRADING_ARRANGEMENTS.GENERAL_OFFER;
      } else {
        baseTemplate = TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      }
  }
  
  // Enhance template with business day notice and reference document note
  return baseTemplate + `

**IMPORTANT BUSINESS DAY CALCULATION NOTICE:**
All timelines above use business days (Hong Kong trading days) which exclude weekends and public holidays. For precise deadline calculations, consult the HKEX calendar and ensure compliance with minimum business day requirements under the relevant regulatory framework.

**REFERENCE DOCUMENT INTEGRATION:**
This timetable has been enhanced to consider requirements from uploaded reference documents including specific timing requirements and regulatory guidelines.`;
}

/**
 * Get execution process template based on query type - now with business day calculations
 */
function getExecutionProcessTemplate(type: string, query: string): string {
  // Use dynamic business day calculation for execution processes
  return generateDynamicTimetable(type);
}

/**
 * Check if timetable format is well-formed
 */
export function isWellFormattedTimetable(text: string): boolean {
  // Check for structured table format
  const hasTableFormat = text.includes('|') && 
                        (text.includes('Date') || text.includes('Day') || text.includes('Event'));
                        
  // Check for minimum required dates/events
  const hasMinimalStructure = 
    (text.includes('Announcement') || text.includes('Ex-date')) && 
    (text.includes('Trading') || text.includes('Closing') || text.includes('Settlement'));
    
  // Check for execution process details
  const hasExecutionProcessDetails =
    (text.includes('Preparation') || text.includes('Vetting')) &&
    (text.includes('HKEX') || text.includes('SFC') || text.includes('Stock Exchange'));
    
  return hasTableFormat && (hasMinimalStructure || hasExecutionProcessDetails);
}

/**
 * Check if an execution process description is complete
 */
export function isCompleteExecutionProcess(content: string, type: string): boolean {
  const normalizedContent = content.toLowerCase();
  
  // Check for essential execution process components based on regulatory framework
  const isTakeoversType = type === 'takeovers_code' || type === 'takeover_offer';
  
  // Common checks for all execution processes
  const hasPreparation = normalizedContent.includes('preparation') || 
                        normalizedContent.includes('drafting');
                        
  const hasVetting = normalizedContent.includes('vetting');
  
  const hasPublication = normalizedContent.includes('publication') || 
                        normalizedContent.includes('announcement');
  
  // Framework-specific checks
  if (isTakeoversType) {
    // Takeovers Code specific checks
    const hasSFC = normalizedContent.includes('sfc') || 
                  normalizedContent.includes('securities and futures commission');
                  
    const hasOfferDocument = normalizedContent.includes('offer document');
    
    const hasOfferTimeline = normalizedContent.includes('closing date') || 
                            normalizedContent.includes('rule 15');
    
    return hasPreparation && hasVetting && hasPublication && hasSFC && 
           hasOfferDocument && hasOfferTimeline;
  } else {
    // Listing Rules specific checks
    const hasHKEX = normalizedContent.includes('hkex') || 
                   normalizedContent.includes('stock exchange');
                   
    const hasCircular = normalizedContent.includes('circular');
    
    const hasShareholders = normalizedContent.includes('shareholders') ||
                           normalizedContent.includes('egm') ||
                           normalizedContent.includes('meeting');
    
    return hasPreparation && hasVetting && hasPublication && hasHKEX && 
           hasCircular && hasShareholders;
  }
}
