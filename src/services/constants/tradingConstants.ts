
// Trading arrangement templates for different corporate actions
export const TRADING_ARRANGEMENTS = {
  RIGHTS_ISSUE: `# Trading Arrangements for Rights Issue under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-2 | Announcement Date | Last day for trading in shares with entitlement to the rights issue |
| T-1 | Ex-date | Shares trade ex-rights from this date |
| T+5 | PAL Dispatch | Provisional Allotment Letters sent to shareholders |
| T+6 | Nil-paid Rights Trading Start | First day of dealing in nil-paid rights begins |
| T+10 | Nil-paid Rights Trading End | Last day of dealing in nil-paid rights |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in fully-paid new shares commences |

Notes:
- Trading in nil-paid rights typically lasts for 10 trading days (HK Listing Rules 10.29)
- During nil-paid trading, two markets operate simultaneously - existing shares (ex-rights) and nil-paid rights
- A designated broker is often appointed to facilitate trading in odd lots resulting from the rights issue
- Share certificates for fully-paid shares are typically posted 6 business days after acceptance deadline
- Final timetables must be approved by HKEX before announcement`,

  GENERAL_OFFER: `# Timetable for Mandatory General Offer under Hong Kong Takeovers Code

| Day | Event | Regulatory Reference |
|-----|-------|----------------------|
| Day 0 | Triggering Event (Acquisition of 30%+ voting rights) | Rule 26.1 |
| Day 0-3 | Announcement (Rule 3.5 announcement) | Rule 3.5 |
| Day 0-21 | Appointment of Independent Financial Adviser | Rule 2.1 |
| Day 0-28 | Despatch of Offer Document | Rule 8.2 |
| Day 0-35 | Despatch of Offeree Board Circular | Rule 8.4 |
| Day 0-28 to Day 0-59 | First Closing Date (Min. 21 days after despatch) | Rule 15.1, Note 1 |
| Day 0-80 | Final Day to Fulfill or Waive Conditions (60 days from despatch) | Rule 15.5 |
| Day 0-95 | Final Closing Date (No later than Day 81 if unconditional by Day 60) | Rule 15.5, Note 2 |
| Day 0+7 from Closing | Settlement (within 7 days of offer closing) | Rule 20.1 |

Notes:
- Rule 26.1 requires a mandatory offer when a person acquires 30% or more of voting rights, or when holding between 30-50% increases by more than 2% in any 12 months
- The first closing date must be at least 21 days from the date of despatch of the offer document
- All conditions must be fulfilled or waived within 60 days of despatch of the offer document, or 21 days from when it becomes unconditional as to acceptances, whichever is later
- The offeror must announce the level of acceptances by 7:00 p.m. on the closing date
- Settlement must be made within 7 days of the offer closing
- If competing offers emerge, timetables may be aligned by the Executive
- Offer prices cannot be lowered once announced (Rule 18.1)
- This timetable reflects Takeovers Code requirements and practice in Hong Kong`,

  OPEN_OFFER: `# Trading Arrangements for Open Offer under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-2 | Announcement Date | Last day for trading in shares with entitlement to the open offer |
| T-1 | Ex-date | Shares trade ex-entitlement from this date |
| T+5 | Application Form Dispatch | Application forms sent to qualifying shareholders |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in new shares commences |

Notes:
- Unlike rights issues, there is NO trading in nil-paid rights for open offers
- Only one market exists during the open offer period - existing shares (ex-entitlement)
- Odd lot arrangements should be described in the offering document
- Share certificates for new shares are typically posted 6 business days after acceptance deadline
- Final timetables must be approved by HKEX before announcement`,

  SHARE_CONSOLIDATION: `# Trading Arrangements for Share Consolidation under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement & Circular | Announcement of share consolidation and dispatch of circular |
| T-1 | General Meeting | Shareholders approve the share consolidation |
| T | Effective Date | Last day for trading in existing shares |
| T+1 | Ex-date | First day for trading in consolidated shares |
| T+3 to T+5 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+30 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Share consolidation requires shareholder approval in general meeting
- Existing share certificates are valid for trading only up to last trading day before effective date
- After effective date, trading is only in consolidated shares and board lots
- Parallel trading is typically NOT available for share consolidation/subdivision
- Arrangements must be made for odd lots resulting from the consolidation
- Final timetables must be approved by HKEX before announcement`,

  BOARD_LOT_CHANGE: `# Trading Arrangements for Board Lot Size Change under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement | Announcement of board lot size change |
| T | Effective Date | Free exchange of share certificates begins |
| T+1 | First day of parallel trading | Both old and new board lots can be traded |
| T+21 | Last day of parallel trading | Last day for parallel trading in both board lot sizes |
| T+22 | Exchange of old certificates ends | Deadline for free exchange of share certificates |

Notes:
- Parallel trading arrangements allow trading in both old and new board lots simultaneously
- During parallel trading, two separate stock codes may be used to distinguish the two markets
- A designated broker is typically appointed to match odd lot trades
- Share registrar provides free exchange of share certificates during the specified period
- Final timetables must be approved by HKEX before announcement`,

  COMPANY_NAME_CHANGE: `# Trading Arrangements for Company Name Change under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement & Circular | Announcement of name change and dispatch of circular |
| T-1 | General Meeting | Shareholders approve the name change |
| T+10 | Effective Date | Certificate of incorporation on change of name issued |
| T+14 | Stock Short Name Change Date | Trading under new stock short name begins |
| T+15 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+45 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Existing share certificates remain valid for trading despite the name change
- Trading continues uninterrupted during the name change process
- The stock code remains unchanged; only the stock short name is updated
- Share registrar provides free exchange of share certificates during the specified period
- CCASS and other settlement systems are updated with the new company name
- Final timetables must be approved by HKEX before announcement`
};
