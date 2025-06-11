// Trading arrangement templates for different corporate actions with enhanced conditional logic
export const TRADING_ARRANGEMENTS = {
  RIGHTS_ISSUE: `# Enhanced Rights Issue Execution Timetable (Conditional Logic Applied)

## Phase 1: Listing Documents Preparation and Vetting (As per Timetable20250520.docx)
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Rights issue announcement published through HKEXnews |

## Phase 2: Implementation Assessment
**CRITICAL:** Determine if shareholder approval is required based on aggregation rules.

### Scenario A: No Shareholder Approval Required (Standard Case)
**Applies when:** Rights issue does not exceed 50% threshold when aggregated with previous 12 months' issues.

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

### Scenario B: Shareholder Approval Required (Threshold Exceeded)
**Applies when:** Rights issue exceeds 50% threshold when aggregated with previous 12 months' issues.

**Additional phases required:**
| Timeline | Step | Description |
|----------|------|-------------|
| Day 17-21 | Circular Preparation | Drafting of circular with details of rights issue |
| Day 22-36 | Circular Vetting | Stock Exchange review of circular |
| Day 37 | Circular Dispatch | Dispatch of circular to shareholders |
| Day 58 | EGM | Extraordinary General Meeting for shareholders' approval |
| Day 58 | Results Announcement | Announcement of EGM results |

**Then proceed with trading phase as per Scenario A above.**

Notes:
- Listing documents preparation and vetting are ALWAYS required (15 business days total)
- Trading in nil-paid rights typically lasts for 10 trading days (HK Listing Rules 10.29)
- Aggregation threshold per Rule 7.19A applies to cumulative issues within 12 months`,

  OPEN_OFFER: `# Enhanced Open Offer Execution Timetable (Conditional Logic Applied)

## Phase 1: Listing Documents Preparation and Vetting (As per Timetable20250520.docx)
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Open offer announcement published through HKEXnews |

## Phase 2: Implementation Assessment
**CRITICAL:** Determine if shareholder approval is required based on aggregation rules.

### Scenario A: No Shareholder Approval Required (Standard Case)
**Applies when:** Open offer does not exceed 50% threshold when aggregated with previous 12 months' issues.

| Date | Trading Event | Details |
|------|---------------|---------|
| T-2 | Last Cum-Entitlement Trading Day | Last day for trading in shares with entitlement |
| T-1 | Ex-Entitlement Date | Shares trade ex-entitlement from this date |
| T | Record Date | Shareholder register closed to establish entitlements |
| T+5 | Application Form Dispatch | Application forms sent to qualifying shareholders |
| T+19 | Latest Acceptance Date | Final date for acceptance and payment |
| T+26 | New Shares Listing | Dealing in new shares commences |

### Scenario B: Shareholder Approval Required (Threshold Exceeded)
**Applies when:** Open offer exceeds 50% threshold when aggregated with previous 12 months' issues.

**Additional phases required:**
| Timeline | Step | Description |
|----------|------|-------------|
| Day 17-21 | Circular Preparation | Drafting of circular with details of open offer |
| Day 22-36 | Circular Vetting | Stock Exchange review of circular |
| Day 37 | Circular Dispatch | Dispatch of circular to shareholders |
| Day 58 | EGM | Extraordinary General Meeting for shareholders' approval |
| Day 58 | Results Announcement | Announcement of EGM results |

**Then proceed with trading phase as per Scenario A above.**

Notes:
- CRITICAL: Open offers are CORPORATE ACTIONS regulated under Listing Rules Chapter 7
- NO trading in nil-paid rights for open offers (key difference from rights issues)
- Only one market exists during the open offer period - existing shares (ex-entitlement)
- Aggregation threshold per Rule 7.24 applies to cumulative issues within 12 months
- Listing documents preparation and vetting are ALWAYS required (15 business days total)`,

  GENERAL_OFFER: `# Complete Execution Timetable for Offer under Takeovers Code

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

Notes:
- CRITICAL: Offers under the Takeovers Code are ACQUISITION mechanisms governed by the Hong Kong Codes on Takeovers and Mergers, NOT corporate actions under the Listing Rules
- Mandatory offers are triggered when a person acquires 30% or more voting rights (Rule 26.1)
- The exact timetable may vary based on when the offer becomes or is declared unconditional
- Extension is possible only if a competing offer emerges
- This timetable applies to both mandatory and voluntary offers
- All conditions must be fulfilled or waived by Day 60, or the offer lapses`,

  SHARE_CONSOLIDATION: `# Complete Execution Timetable for Share Consolidation (Listing Rules)

## Phase 1: Listing Documents Preparation and Vetting
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Share consolidation announcement published |

## Phase 2: Circular and Approval Phase (Always Required)
| Timeline | Step | Description |
|----------|------|-------------|
| Day 17-21 | Circular Preparation | Drafting of circular with details of share consolidation |
| Day 22-36 | Circular Vetting | Stock Exchange review of circular |
| Day 37 | Circular Dispatch | Dispatch of circular to shareholders |
| Day 58 | EGM | Extraordinary General Meeting for shareholders' approval (always required) |
| Day 58 | Results Announcement | Announcement of EGM results |

## Phase 3: Implementation
| Date | Trading Event | Details |
|------|---------------|---------|
| T | Effective Date | Last day for trading in existing shares |
| T+1 | Ex-date | First day for trading in consolidated shares |
| T+3 to T+5 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+30 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Share consolidation requires shareholder approval in general meeting (always)
- Existing share certificates are valid for trading only up to last trading day
- After effective date, trading is only in consolidated shares and board lots
- Odd lot arrangements must be detailed in the circular
- Listing documents preparation and vetting are required (15 business days total)`,

  BOARD_LOT_CHANGE: `# Complete Execution Timetable for Board Lot Size Change (Listing Rules)

## Phase 1: Listing Documents Preparation and Vetting
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Board lot change announcement published |

## Phase 2: Implementation (No Circular/EGM Required)
| Date | Trading Event | Details |
|------|---------------|---------|
| T | Effective Date | Free exchange of share certificates begins |
| T+1 | First day of parallel trading | Both old and new board lots can be traded |
| T+21 | Last day of parallel trading | Last day for parallel trading in both board lot sizes |
| T+22 | Exchange of old certificates ends | Deadline for free exchange of share certificates |

Notes:
- Board lot size changes do not typically require shareholder approval
- Parallel trading arrangements allow trading in both old and new board lots simultaneously
- During parallel trading, two separate stock codes may be used
- A designated broker is typically appointed to match odd lot trades
- Share registrar provides free exchange of share certificates during the specified period
- Listing documents preparation and vetting are required (15 business days total)`,

  COMPANY_NAME_CHANGE: `# Complete Execution Timetable for Company Name Change (Listing Rules)

## Phase 1: Listing Documents Preparation and Vetting
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1-5 | Listing Documents Preparation | Preparation of listing documents (5 business days) |
| Day 6-15 | Stock Exchange Vetting | Vetting by the Stock Exchange (10 business days) |
| Day 16 | Announcement | Company name change announcement published |

## Phase 2: Circular and Approval Phase (Always Required)
| Timeline | Step | Description |
|----------|------|-------------|
| Day 17-21 | Circular Preparation | Drafting of circular with details of name change |
| Day 22-36 | Circular Vetting | Stock Exchange review of circular |
| Day 37 | Circular Dispatch | Dispatch of circular to shareholders |
| Day 58 | EGM | Extraordinary General Meeting for shareholders' approval (always required) |
| Day 58 | Results Announcement | Announcement of EGM results |

## Phase 3: Implementation
| Date | Trading Event | Details |
|------|---------------|---------|
| T+10 | Effective Date | Certificate of incorporation on change of name issued |
| T+14 | Stock Short Name Change Date | Trading under new stock short name begins |
| T+15 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+45 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Company name changes require shareholder approval in general meeting (always)
- Existing share certificates remain valid for trading despite the name change
- The stock code remains unchanged; only the stock short name is updated
- Share registrar provides free exchange of share certificates during the specified period
- Listing documents preparation and vetting are required (15 business days total)`
};

// Document reference details for different corporate action types
export const TRADING_ARRANGEMENT_REFERENCES = {
  LISTING_RULES: "Guide on Trading Arrangements for Selected Types of Corporate Actions (HKEX)",
  TAKEOVERS_CODE: "Hong Kong Codes on Takeovers and Mergers (SFC)",
  ENHANCED_REQUIREMENTS: "Timetable20250520.docx - Listing Documents Requirements",
  REGULATORY_DISTINCTION: `
    CRITICAL REGULATORY DISTINCTION:
    
    1. Corporate Actions (Listing Rules):
       - Rights issues, open offers, share consolidations, board lot changes, and name changes
       - Governed by HKEX Listing Rules (primarily Chapters 7 and 10)
       - Focus on capital raising, corporate restructuring, and administrative changes
       - Regulated by the Stock Exchange of Hong Kong Limited
       - ALWAYS require listing documents preparation (5 days) and vetting (10 days)
       - Conditional circular/EGM requirements based on thresholds and type
    
    2. Offers under Takeovers Code:
       - General offers, mandatory offers, voluntary offers
       - Governed by the Hong Kong Codes on Takeovers and Mergers
       - Focus on acquisition of control of listed companies
       - Regulated by the Securities and Futures Commission (SFC)
  `
};

// Process templates for corporate actions execution
export const CORPORATE_ACTION_PROCESSES = {
  LISTING_RULES: {
    LISTING_DOCUMENTS: [
      { step: "Listing Documents Preparation", duration: "5 business days" },
      { step: "Stock Exchange Vetting", duration: "10 business days" },
      { step: "Announcement Publication", duration: "1 day" }
    ],
    CONDITIONAL_CIRCULAR_PHASE: [
      { step: "Circular Preparation", duration: "3-5 days" },
      { step: "Circular Vetting", duration: "5-15 business days" },
      { step: "Circular Dispatch", duration: "1 day" },
      { step: "EGM", duration: "Per notice requirements (minimum 21 days)" },
      { step: "Results Announcement", duration: "Same date as EGM" }
    ]
  },
  
  TAKEOVERS_CODE: {
    PRE_ANNOUNCEMENT: [
      { step: "Preparation of Offer Announcement", duration: "3 days" },
      { step: "SFC Vetting", duration: "2-10 business days depending on complexity" },
      { step: "Publication of Announcement", duration: "1 day" }
    ],
    OFFER_DOCUMENT_PHASE: [
      { step: "Preparation of Offer Document", duration: "3-10 days" },
      { step: "SFC Vetting", duration: "5-20 business days depending on complexity" },
      { step: "Offer Document Publication", duration: "1 day" }
    ],
    TAKEOVER_TIMELINE: [
      { step: "First Closing Date", details: "At least 21 days from posting offer document (Rule 15.1)" },
      { step: "Offeree Board Circular", details: "Within 14 days of offer document dispatch (Rule 8.4)" },
      { step: "Last Day for Material New Information", details: "Day 39 from posting offer document (Rule 31.5)" },
      { step: "Last Day for Revisions", details: "Day 46 from posting offer document (Rule 16)" },
      { step: "Final Day for Unconditional Status", details: "Day 60 from posting offer document (Rule 15.5)" }
    ]
  }
};
