import { TRADING_ARRANGEMENTS, CORPORATE_ACTION_PROCESSES } from '../constants/tradingConstants';

/**
 * Get fallback trading arrangement template based on type
 */
export function getFallbackTradingArrangement(type: string, query: string): string {
  // Check for execution process queries
  const isExecutionProcessQuery = query.toLowerCase().includes('execution') || 
                                 query.toLowerCase().includes('process') || 
                                 query.toLowerCase().includes('working') || 
                                 query.toLowerCase().includes('timeline');
  
  // If it's an execution process query, include the full execution process template
  if (isExecutionProcessQuery) {
    return getExecutionProcessTemplate(type, query);
  }
  
  // Otherwise, use standard trading arrangement templates
  switch (type) {
    case 'rights_issue':
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      
    case 'open_offer':
      return TRADING_ARRANGEMENTS.OPEN_OFFER;
      
    case 'share_consolidation': 
      return TRADING_ARRANGEMENTS.SHARE_CONSOLIDATION;
      
    case 'board_lot_change':
      return TRADING_ARRANGEMENTS.BOARD_LOT_CHANGE;
      
    case 'company_name_change':
      return TRADING_ARRANGEMENTS.COMPANY_NAME_CHANGE;
      
    case 'takeovers_code':
    case 'takeover_offer':
      return TRADING_ARRANGEMENTS.GENERAL_OFFER;
      
    default:
      // If type not specifically matched but contains general offer in query
      if (query.toLowerCase().includes('general offer') || 
          query.toLowerCase().includes('mandatory offer') || 
          query.toLowerCase().includes('takeover')) {
        return TRADING_ARRANGEMENTS.GENERAL_OFFER;
      }
      
      // Default to rights issue if no specific match
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
  }
}

/**
 * Get execution process template based on query type
 */
function getExecutionProcessTemplate(type: string, query: string): string {
  // Determine if this is a Listing Rules or Takeovers Code query
  const isTakeoversQuery = type === 'takeovers_code' || type === 'takeover_offer' || 
                          query.toLowerCase().includes('takeover') || 
                          query.toLowerCase().includes('general offer');
  
  if (isTakeoversQuery) {
    // Takeovers Code execution process
    return `# Complete Execution Process for Offers under Takeovers Code

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 | Preparation of Offer Announcement | Drafting and internal review of offer announcement |
| Day -10 to -2 | SFC Vetting | Vetting by the Securities and Futures Commission (2-10 business days) |
| Day 0 | Publication of Rule 3.5 Announcement | Firm intention to make an offer announced |

## Offer Document Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Offer Document | Drafting of offer document with full terms and conditions |
| Day 11 to 30 | SFC Vetting | SFC review of offer document (5-20 business days depending on complexity) |
| Day 21 (max) | Offer Document Dispatch | Posting of offer document (within 21 days of announcement) |
| Day 14 from Dispatch | Offeree Board Circular | Offeree company board issues response circular |

## Offer Timeline (Regulated by Takeovers Code)
| Day | Event | Regulatory Reference |
|-----|-------|----------------------|
| Day 0 | Dispatch of Offer Document | Rule 8.2 |
| Day 21 | First Closing Date | Rule 15.1 (minimum offer period) |
| Day 28 | Latest Date for Offeree Response | Rule 8.4 |
| Day 39 | No Material New Information | Rule 31.5 |
| Day 46 | Last Date for Revisions | Rule 16 |
| Day 60 | Final Unconditional Date | Rule 15.5 |
| Day 81 | Latest Final Closing Date | Rule 15.3 |
| + 10 business days | Payment Deadline | Rule 20.1 |

CRITICAL REGULATORY DISTINCTION:
Offers under the Takeovers Code are acquisition mechanisms for obtaining control of a company.
They are governed by the SFC (Securities and Futures Commission) under the Hong Kong Codes on Takeovers and Mergers.
These are fundamentally different from corporate actions like open offers under the Listing Rules.`;
  } else {
    // Listing Rules corporate action process based on type
    switch (type) {
      case 'open_offer':
        return `# Complete Execution Process for Open Offer (Listing Rules - Corporate Action)

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of open offer announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (2-10 business days depending on complexity) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Circular and Approval Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Circular | Drafting of circular with details of open offer |
| Day 11 to 30 | HKEX Vetting of Circular | Stock Exchange review (5-20 business days depending on complexity) |
| Day 31 | Circular Publication | Dispatch of circular to shareholders |
| Day 45-52 | Shareholders' Meeting | EGM for shareholders' approval (if required) |
| Day 45-52 | Results Announcement | Announcement of EGM results (same day as meeting) |

## Trading and Execution Phase
| Date | Trading Event | Details |
|------|---------------|---------|
| T-2 | Last Cum-Entitlement Trading Day | Last day for trading in shares with entitlement |
| T-1 | Ex-Entitlement Date | Shares trade ex-entitlement from this date |
| T | Record Date | Shareholder register closed to establish entitlements |
| T+5 | Application Form Dispatch | Application forms sent to qualifying shareholders |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in new shares commences |

CRITICAL REGULATORY DISTINCTION:
Open offers are CORPORATE ACTIONS regulated under Listing Rules Chapter 7 for capital-raising by listed companies.
They are governed by the Stock Exchange of Hong Kong Limited (HKEX).
Unlike rights issues, there is NO trading in nil-paid rights for open offers.`;
        
      case 'rights_issue':
        return `# Complete Execution Process for Rights Issue (Listing Rules - Corporate Action)

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of rights issue announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (2-10 business days depending on complexity) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Circular and Approval Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Circular | Drafting of circular with details of rights issue |
| Day 11 to 30 | HKEX Vetting of Circular | Stock Exchange review (5-20 business days depending on complexity) |
| Day 31 | Circular Publication | Dispatch of circular to shareholders |
| Day 45-52 | Shareholders' Meeting | EGM for shareholders' approval (if required) |
| Day 45-52 | Results Announcement | Announcement of EGM results (same day as meeting) |

## Trading and Execution Phase
| Date | Trading Event | Details |
|------|---------------|---------|
| T-2 | Last Cum-Rights Trading Day | Last day for trading in shares with rights entitlement |
| T-1 | Ex-Rights Date | Shares begin trading ex-rights |
| T | Record Date | Shareholder register closed to establish entitlements |
| T+5 | PAL Dispatch | Provisional Allotment Letters sent to shareholders |
| T+6 | Nil-Paid Rights Trading Start | First day of dealing in nil-paid rights |
| T+10 | Nil-Paid Rights Trading End | Last day of dealing in nil-paid rights |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in fully-paid new shares commences |

REGULATORY FRAMEWORK:
Rights issues are CORPORATE ACTIONS regulated under Listing Rules Chapter 7 for capital-raising by listed companies.
They are governed by the Stock Exchange of Hong Kong Limited (HKEX).
Trading in nil-paid rights typically lasts for 10 trading days (HK Listing Rules 10.29).`;
        
      default:
        // For any other Listing Rules corporate action
        return `# Standard Execution Process for Corporate Actions under Listing Rules

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (2-10 business days depending on complexity) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Circular and Approval Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Circular | Drafting of circular with details of corporate action |
| Day 11 to 30 | HKEX Vetting of Circular | Stock Exchange review (5-20 business days depending on complexity) |
| Day 31 | Circular Publication | Dispatch of circular to shareholders |
| Day 45-52 | Shareholders' Meeting | EGM for shareholders' approval (if required) |
| Day 45-52 | Results Announcement | Announcement of EGM results (same day as meeting) |

## Implementation Phase
| Timeline | Action | Description |
|----------|--------|-------------|
| As per timetable | Effective Date | Corporate action takes effect |
| Post-Effective | HKEXnews Announcement | Results/completion announcement |
| Post-Effective | Implementation | Implementation of remaining steps |

REGULATORY FRAMEWORK:
Corporate actions are regulated under the Hong Kong Listing Rules.
They are governed by the Stock Exchange of Hong Kong Limited (HKEX).
Specific chapters apply to different corporate actions (e.g., Chapter 7 for equity securities).`;
    }
  }
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
