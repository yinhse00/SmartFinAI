
// Trading arrangement templates for different corporate actions
export const TRADING_ARRANGEMENTS = {
  RIGHTS_ISSUE: `# Complete Execution Timetable for Rights Issue (Listing Rules)

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

Notes:
- This timeline follows requirements under Hong Kong Listing Rules Chapter 7 (Equity Securities) and Chapter 10 (Equity Securities - Additional Requirements)
- Trading in nil-paid rights typically lasts for 10 trading days (HK Listing Rules 10.29)
- Rights issues may require shareholders' approval if they would increase issued shares by more than 50% (Rule 7.19A)
- Final timetables must be approved by HKEX before announcement`,

  OPEN_OFFER: `# Complete Execution Timetable for Open Offer (Listing Rules - Corporate Action)

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

Notes:
- CRITICAL: Open offers are CORPORATE ACTIONS regulated under Listing Rules Chapter 7 for capital-raising
- Unlike rights issues, there is NO trading in nil-paid rights for open offers
- Only one market exists during the open offer period - existing shares (ex-entitlement)
- Open offers may require shareholders' approval if they would increase issued shares by more than 50% (Rule 7.24)
- Open offers cannot be made at a price discount of 20% or more to the benchmarked price without specific waiver
- Final timetables must be approved by HKEX before announcement`,

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

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (2-10 business days depending on complexity) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Circular and Approval Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Circular | Drafting of circular with details of share consolidation |
| Day 11 to 30 | HKEX Vetting of Circular | Stock Exchange review (5-20 business days depending on complexity) |
| Day 31 | Circular Publication | Dispatch of circular to shareholders |
| Day 45-52 | Shareholders' Meeting | EGM for shareholders' approval (always required) |
| Day 45-52 | Results Announcement | Announcement of EGM results (same day as meeting) |

## Trading and Execution Phase
| Date | Trading Event | Details |
|------|---------------|---------|
| T | Effective Date | Last day for trading in existing shares |
| T+1 | Ex-date | First day for trading in consolidated shares |
| T+3 to T+5 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+30 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Share consolidation requires shareholder approval in general meeting
- Existing share certificates are valid for trading only up to last trading day
- After effective date, trading is only in consolidated shares and board lots
- Odd lot arrangements must be detailed in the circular
- Final timetables must be approved by HKEX before announcement`,

  BOARD_LOT_CHANGE: `# Complete Execution Timetable for Board Lot Size Change (Listing Rules)

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (if required, 2-10 business days) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Implementation Phase (No Circular/EGM Required)
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
- Final timetables must be approved by HKEX before announcement`,

  COMPANY_NAME_CHANGE: `# Complete Execution Timetable for Company Name Change (Listing Rules)

## Pre-Announcement Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day -3 to -1 | Preparation of Announcement | Drafting and internal review of announcement |
| Day -10 to -2 | HKEX Vetting | Vetting by the Stock Exchange (if required, 2-10 business days) |
| Day 0 | Publication of Announcement | Announcement published through HKEXnews |

## Circular and Approval Phase
| Timeline | Step | Description |
|----------|------|-------------|
| Day 1 to 10 | Preparation of Circular | Drafting of circular with details of name change |
| Day 11 to 30 | HKEX Vetting of Circular | Stock Exchange review (5-20 business days depending on complexity) |
| Day 31 | Circular Publication | Dispatch of circular to shareholders |
| Day 45-52 | Shareholders' Meeting | EGM for shareholders' approval (always required) |
| Day 45-52 | Results Announcement | Announcement of EGM results (same day as meeting) |

## Implementation Phase
| Date | Trading Event | Details |
|------|---------------|---------|
| T+10 | Effective Date | Certificate of incorporation on change of name issued |
| T+14 | Stock Short Name Change Date | Trading under new stock short name begins |
| T+15 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+45 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Company name changes require shareholder approval in general meeting
- Existing share certificates remain valid for trading despite the name change
- The stock code remains unchanged; only the stock short name is updated
- Share registrar provides free exchange of share certificates during the specified period
- Final timetables must be approved by HKEX before announcement`
};

// Document reference details for different corporate action types
export const TRADING_ARRANGEMENT_REFERENCES = {
  LISTING_RULES: "Guide on Trading Arrangements for Selected Types of Corporate Actions (HKEX)",
  TAKEOVERS_CODE: "Hong Kong Codes on Takeovers and Mergers (SFC)",
  REGULATORY_DISTINCTION: `
    CRITICAL REGULATORY DISTINCTION:
    
    1. Corporate Actions (Listing Rules):
       - Rights issues, open offers, share consolidations, board lot changes, and name changes
       - Governed by HKEX Listing Rules (primarily Chapters 7 and 10)
       - Focus on capital raising, corporate restructuring, and administrative changes
       - Regulated by the Stock Exchange of Hong Kong Limited
    
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
    PRE_ANNOUNCEMENT: [
      { step: "Preparation of Announcement", duration: "2-3 days" },
      { step: "HKEX Vetting", duration: "2-10 business days depending on complexity" },
      { step: "Publication of Announcement", duration: "1 day" }
    ],
    CIRCULAR_PHASE: [
      { step: "Preparation of Circular", duration: "3-10 days" },
      { step: "HKEX Vetting of Circular", duration: "5-20 business days depending on complexity" },
      { step: "Circular Publication", duration: "1 day" },
      { step: "Shareholders' Meeting", duration: "Per Listing Rules notice requirements" },
      { step: "Results Announcement", duration: "Same date as shareholders' meeting" }
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
