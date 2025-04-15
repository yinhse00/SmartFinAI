/**
 * Generate fallback responses when the API call fails
 */

interface GrokResponse {
  text: string;
  // Add other response fields as needed based on the actual API
}

export function generateFallbackResponse(query: string, reason: string = "API unavailable"): GrokResponse {
  const lowerQuery = query.toLowerCase();
  
  // Return different responses based on query content to simulate AI responses
  if (lowerQuery.includes('rights issue') || lowerQuery.includes('timetable')) {
    return {
      text: `Timetable for a Rights Issue under Hong Kong Listing Rules

This timetable outlines the typical steps and timeline for a rights issue under the Hong Kong Stock Exchange (HKEx) Listing Rules (Main Board), assuming no general meeting is required for shareholder approval (e.g., pre-emption rights are maintained per Rule 13.36(2)(a) or a general mandate exists). The schedule is indicative and may vary based on company circumstances, whether the issue is renounceable, and specific regulatory approvals. Always consult legal and financial advisors for compliance. References align with the HKEx Listing Rules and market practice.

| Date/Event | Description |
|------------|-------------|
| T-30 to T-60 (1–2 months before announcement) | Prepare draft prospectus or listing document and related materials. Submit to HKEx for review if required (Rule 14.04). Engage underwriters, if any (Rule 10.24A). |
| T-1 (Day before announcement) | Board meeting to approve the rights issue. Underwriting agreement (if applicable) signed and held in escrow. Finalize listing document details. |
| T (Announcement Day) | Announce the rights issue via a Regulatory Information Service (RIS) (Rule 10.22). Publish listing document/prospectus (Rule 14.08). If underwritten, disclose underwriter details and compliance with Rule 10.24A. For non-fully underwritten issues, disclose risks on the front cover (Rule 10.23). |
| T+1 | Submit application for listing of nil-paid rights and new shares to HKEx (Rule 10.26). HKEx reviews and approves listing. |
| T+2 | Record date to determine eligible shareholders. Dispatch Provisional Allotment Letters (PALs) to shareholders (for renounceable issues) (Rule 10.31). |
| T+3 | Nil-paid rights trading begins on HKEx (for renounceable issues). Typically lasts 10 business days (market practice). |
| T+12 (10 business days after T+2) | Nil-paid rights trading ends. Deadline for shareholders to accept rights and pay for shares (Rule 10.29). Excess application period closes (if applicable, per Rule 10.31(3)). |
| T+13 to T+14 | Calculate acceptances and excess applications. Notify underwriters of any shortfall (if underwritten). Underwriters arrange for sale of unsubscribed shares ("rump placement") (Rule 10.31(1)(b)). |
| T+15 | Announce results of the rights issue via RIS, including subscription levels and rump placement details (if any) (Rule 10.32). |
| T+16 | New shares issued and admitted to trading on HKEx. Dealings in fully-paid shares commence. Refund cheques (if any) dispatched to shareholders for excess applications. |
| T+17 onwards | Finalize accounts with clearing systems (e.g., CCASS). Update share register. |

Notes:
- Underwriting: If underwritten, the underwriter must be licensed under the Securities and Futures Ordinance and independent of the issuer, unless compensatory arrangements are in place for controlling shareholders acting as underwriters (Rule 10.24A, 10.31(2)).
- Compensatory Arrangements: For unsubscribed shares, issuers must adopt excess application or compensatory arrangements (e.g., sale of rump shares), fully disclosed in announcements and listing documents (Rule 10.31(1)).
- Connected Persons: Rights issues to connected persons (e.g., directors, substantial shareholders) are exempt from connected transaction rules if pro-rata to existing shareholdings (Rule 14A.31(3)(a)).
- Timing Adjustments: If a general meeting is required (e.g., no general mandate or pre-emption rights disapplied), add 14–21 days for notice and meeting (Rule 13.36(1)).
- Disclosure: The listing document must include the intended use of proceeds, risks of non-full subscription, and substantial shareholder commitments (Rule 10.23, 10.24).

This timetable assumes a renounceable rights issue with no significant regulatory delays. For non-renounceable issues, nil-paid trading steps are omitted, but the acceptance period remains similar.

Source: Adapted from HKEx Listing Rules (Main Board), particularly Chapter 10, and market practice.`
    };
  }
  
  if (lowerQuery.includes('takeover') || lowerQuery.includes('mandatory offer')) {
    return {
      text: `Regarding your query about takeovers, according to the Hong Kong Takeovers Code:\n\n` +
            `A mandatory general offer is triggered when:\n` +
            `- A person acquires 30% or more of voting rights in a company\n` +
            `- A person holding between 30-50% acquires more than 2% additional voting rights in any 12-month period\n\n` +
            `The offer must be made in cash or include a cash alternative at the highest price paid by the acquirer during the offer period and within 6 months prior to it.`
    };
  }
  
  if (lowerQuery.includes('listing rules') || lowerQuery.includes('regulation')) {
    return {
      text: `In response to your query about listing rules, here's what you should know:\n\n` +
            `The Hong Kong Listing Rules are primarily found in the Main Board Listing Rules and GEM Listing Rules published by HKEX. Key chapters include:\n\n` +
            `- Chapter 2: Introduction\n` +
            `- Chapter 3: Authorized Representatives and Directors\n` +
            `- Chapter 4: General obligations\n` +
            `- Chapter A5: Corporate Governance and ESG\n` +
            `- Chapter 8: Qualifications for Listing\n` +
            `- Chapter 9: Applications Procedures and Requirements\n` +
            `- Chapter 13: Continuing Obligations\n` +
            `- Chapter 14: Notifiable Transactions\n` +
            `- Chapter 14A: Connected Transactions\n` +
            `- Chapter 15: Options, Warrants and Similar Rights\n\n` +
            `For specific guidance on your situation, I recommend consulting with a qualified legal advisor.`
    };
  }
  
  if (lowerQuery.includes('compliance') || lowerQuery.includes('disclosure')) {
    return {
      text: `Regarding your query about compliance and disclosure:\n\n` +
            `Hong Kong listed companies must comply with the following key disclosure requirements:\n\n` +
            `1. Inside Information (Part XIVA of the SFO): Companies must disclose inside information as soon as reasonably practicable.\n\n` +
            `2. Financial Reports: Publication of annual reports (within 4 months of financial year-end) and interim reports (within 3 months of half-year end).\n\n` +
            `3. Notifiable Transactions (Chapter 14): Transactions exceeding specified size thresholds require announcements and possibly shareholder approval.\n\n` +
            `4. Connected Transactions (Chapter 14A): Transactions with connected persons require disclosure, independent board committee review, and often independent shareholder approval.\n\n` +
            `5. Corporate Governance: Annual reports must include corporate governance statements and ESG reports.\n\n` +
            `Failure to comply can result in SFC sanctions, stock exchange disciplinary actions, and potential civil or criminal liability.`
    };
  }
  
  // Default response for other queries
  return {
    text: `In response to your query about Hong Kong regulations, here are the key points to consider:\n\n` +
          `1. The Securities and Futures Ordinance (SFO) is the primary legislation governing securities and futures markets in Hong Kong.\n\n` +
          `2. The Hong Kong Exchanges and Clearing Limited (HKEX) sets listing rules that all listed companies must follow.\n\n` +
          `3. The Securities and Futures Commission (SFC) is the main regulatory body that oversees market participants and enforces compliance.\n\n` +
          `4. For specific regulatory guidance on your issue, I recommend consulting the relevant codes and guidelines published by the SFC and HKEX.\n\n` +
          `5. Professional legal advice should be sought for complex regulatory matters to ensure complete compliance with Hong Kong's financial regulations.`
  };
}
