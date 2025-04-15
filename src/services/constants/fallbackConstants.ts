
// Rights issue timetable fallback for when the model doesn't provide a well-formatted one
export const RIGHTS_ISSUE_TIMETABLE_FALLBACK = `# Rights Issue Timetable under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T | Announcement Day | Formal announcement of rights issue |
| T+1 | Ex-Rights Date | Shares trade ex-rights from this date |
| T+3 | Record Date | Register closing to determine entitled shareholders |
| T+6 | Dispatch of PALs | Provisional Allotment Letters sent to shareholders |
| T+7 | Commencement of nil-paid rights trading | First day dealing in nil-paid rights |
| T+13 | Last day of nil-paid rights trading | Last day dealing in nil-paid rights |
| T+16 | Latest time for acceptance and payment | Final date for acceptance and payment |
| T+17 | Results announcement | Announcement of rights issue results |
| T+23 | Dispatch of share certificates | Share certificates sent to shareholders |
| T+24 | Commencement of dealing in fully-paid shares | Trading of new fully-paid shares begins |

Notes:
- Minimum period for nil-paid rights trading is 10 business days under HK Listing Rules
- Underwriters typically have the right to terminate within 1-2 business days after the acceptance deadline
- Odd lot arrangements should be specified in the offering document
- The timetable must be approved by HKEX before the announcement`;
