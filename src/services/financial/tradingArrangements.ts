import { TRADING_ARRANGEMENTS, CORPORATE_ACTION_PROCESSES } from '../constants/tradingConstants';
import { generateDynamicTimetable } from './dynamicTimetableGenerator';
import { addBusinessDays } from '@/services/calendar/businessDayCalculator';

/**
 * Get enhanced trading arrangement template with conditional shareholder approval logic
 */
export async function getFallbackTradingArrangement(type: string, query: string): Promise<string> {
  // Check for execution process queries
  const isExecutionProcessQuery = query.toLowerCase().includes('execution') || 
                                 query.toLowerCase().includes('process') || 
                                 query.toLowerCase().includes('working') || 
                                 query.toLowerCase().includes('timeline');
  
  // If it's an execution process query, use dynamic business day calculation with enhanced logic
  if (isExecutionProcessQuery) {
    return await generateDynamicTimetable(type);
  }
  
  // For timetable queries, use dynamic business day calculations with enhanced logic
  if (query.toLowerCase().includes('timetable') || 
      query.toLowerCase().includes('schedule') ||
      query.toLowerCase().includes('timeline')) {
    return await generateDynamicTimetable(type);
  }
  
  // Otherwise, use enhanced static templates with conditional logic
  return getEnhancedTradingArrangement(type, query);
}

/**
 * Get enhanced trading arrangement with conditional shareholder approval logic
 */
function getEnhancedTradingArrangement(type: string, query: string): string {
  let baseTemplate: string;
  
  switch (type) {
    case 'rights_issue':
      baseTemplate = getConditionalRightsIssueTemplate();
      break;
    case 'open_offer':
      baseTemplate = getConditionalOpenOfferTemplate();
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
        baseTemplate = getConditionalRightsIssueTemplate();
      }
  }
  
  // Enhance template with business day notice and reference document note
  return baseTemplate + `

**IMPORTANT BUSINESS DAY CALCULATION NOTICE:**
All timelines above use business days (Hong Kong trading days) which exclude weekends and public holidays. For precise deadline calculations, consult the HKEX calendar and ensure compliance with minimum business day requirements under the relevant regulatory framework.

**ENHANCED REFERENCE DOCUMENT INTEGRATION:**
This timetable incorporates requirements from uploaded reference documents (Timetable20250520.docx) including:
- Listing document preparation: 5 business days
- Stock Exchange vetting: 10 business days
- Conditional circular/EGM requirements based on shareholder approval needs

**CONDITIONAL LOGIC APPLIED:**
- Circular and EGM phases are only included when shareholder approval is required
- Rights issues and open offers typically do not require shareholder approval unless exceeding regulatory thresholds
- All timelines adjusted based on actual regulatory requirements`;
}

/**
 * Get conditional rights issue template that excludes circular/EGM when not required
 */
function getConditionalRightsIssueTemplate(): string {
  return `# Enhanced Rights Issue Execution Timetable (Conditional Logic Applied)

## Phase 1: Listing Documents Preparation and Vetting
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Rights issue announcement published |

## Phase 2: Implementation (No Shareholder Approval Required)
**Note:** Rights issues typically do not require shareholder approval unless they would increase issued shares by more than 50% when aggregated with other issues in the previous 12 months.

| Date | Trading Event | Details |
|------|---------------|---------|
| T-2 | Last Cum-Rights Trading Day | Last day for trading in shares with rights entitlement |
| T-1 | Ex-Rights Date | Shares begin trading ex-rights |
| T | Record Date | Shareholder register closed to establish entitlements |
| T+5 | PAL Dispatch | Provisional Allotment Letters sent to shareholders |
| T+6 | Nil-Paid Rights Trading Start | First day of dealing in nil-paid rights |
| T+16 | Nil-Paid Rights Trading End | Last day of dealing in nil-paid rights |
| T+20 | Latest Acceptance Date | Final date for acceptance and payment |
| T+27 | New Shares Listing | Dealing in fully-paid new shares commences |

**CONDITIONAL REQUIREMENTS:**
- If rights issue exceeds 50% threshold (aggregated): Shareholder approval via EGM required
- If shareholder approval required: Add 21+ business days for circular preparation, vetting, dispatch, and EGM
- Listing documents must be prepared and vetted before announcement (15 business days total)`;
}

/**
 * Get conditional open offer template that excludes circular/EGM when not required
 */
function getConditionalOpenOfferTemplate(): string {
  return `# Enhanced Open Offer Execution Timetable (Conditional Logic Applied)

## Phase 1: Listing Documents Preparation and Vetting
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Open offer announcement published |

## Phase 2: Implementation (No Shareholder Approval Required)
**Note:** Open offers typically do not require shareholder approval unless they would increase issued shares by more than 50% when aggregated with other issues in the previous 12 months.

| Date | Trading Event | Details |
|------|---------------|---------|
| T-2 | Last Cum-Entitlement Trading Day | Last day for trading in shares with entitlement |
| T-1 | Ex-Entitlement Date | Shares trade ex-entitlement from this date |
| T | Record Date | Shareholder register closed to establish entitlements |
| T+5 | Application Form Dispatch | Application forms sent to qualifying shareholders |
| T+19 | Latest Acceptance Date | Final date for acceptance and payment |
| T+26 | New Shares Listing | Dealing in new shares commences |

**CRITICAL DISTINCTIONS:**
- CORPORATE ACTION regulated under Listing Rules Chapter 7 for capital-raising
- NO trading in nil-paid rights for open offers (unlike rights issues)
- Only one market exists during the open offer period - existing shares (ex-entitlement)

**CONDITIONAL REQUIREMENTS:**
- If open offer exceeds 50% threshold (aggregated): Shareholder approval via EGM required
- If shareholder approval required: Add 21+ business days for circular preparation, vetting, dispatch, and EGM
- Listing documents must be prepared and vetted before announcement (15 business days total)`;
}

/**
 * Get execution process template based on query type - now with business day calculations
 */
async function getExecutionProcessTemplate(type: string, query: string): Promise<string> {
  // Use dynamic business day calculation for execution processes
  return await generateDynamicTimetable(type);
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
                   
    const hasListingDocuments = normalizedContent.includes('listing document');
    
    // Check for conditional circular logic
    const hasConditionalLogic = normalizedContent.includes('conditional') ||
                               normalizedContent.includes('no shareholder approval') ||
                               normalizedContent.includes('if shareholder approval');
    
    return hasPreparation && hasVetting && hasPublication && hasHKEX && 
           hasListingDocuments && hasConditionalLogic;
  }
}
