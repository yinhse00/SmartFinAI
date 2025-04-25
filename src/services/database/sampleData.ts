
/**
 * Sample data for the regulatory database
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";

/**
 * Add initial sample data for development/testing
 */
export const initializeSampleData = () => {
  // Only add sample data if the database is empty
  if (databaseService.getAllEntries().length === 0) {
    databaseService.addSampleEntry({
      title: "Connected Transactions",
      content: "Chapter 14A of the Hong Kong Listing Rules covers connected transactions. " +
        "A connected transaction is any transaction between a listed issuer or any of its subsidiaries and a connected person. " +
        "Connected transactions are subject to reporting, announcement and independent shareholders' approval requirements.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 14A",
      section: "Chapter 14A",
      lastUpdated: new Date("2023-05-15"),
      status: "active"
    });
    
    databaseService.addSampleEntry({
      title: "Mandatory General Offers",
      content: "Rule 26 of the Takeovers Code requires a mandatory general offer to be made when: " +
        "(a) a person acquires, whether by a series of transactions over a period of time or not, 30% or more of the voting rights of a company; or " +
        "(b) a person holding between 30% and 50% of the voting rights of a company acquires additional voting rights that increase their holding by more than 2% in any 12-month period.",
      category: "takeovers",
      source: "SFC Takeovers Code Rule 26",
      section: "Rule 26",
      lastUpdated: new Date("2023-03-10"),
      status: "active"
    });
    
    // Add comprehensive information about Rights Issues Timetable
    databaseService.addSampleEntry({
      title: "Rights Issues Timetable",
      content: "Timetable for a Rights Issue under Hong Kong Listing Rules\n\n" +
        "This timetable outlines the typical steps and timeline for a rights issue under the Hong Kong Stock Exchange (HKEx) Listing Rules (Main Board), assuming no general meeting is required for shareholder approval (e.g., pre-emption rights are maintained per Rule 13.36(2)(a) or a general mandate exists). The schedule is indicative and may vary based on company circumstances, whether the issue is renounceable, and specific regulatory approvals.\n\n" +
        "T-30 to T-60 (1–2 months before announcement): Prepare draft prospectus or listing document and related materials. Submit to HKEx for review if required (Rule 14.04). Engage underwriters, if any (Rule 10.24A).\n\n" +
        "T-1 (Day before announcement): Board meeting to approve the rights issue. Underwriting agreement (if applicable) signed and held in escrow. Finalize listing document details.\n\n" +
        "T (Announcement Day): Announce the rights issue via a Regulatory Information Service (RIS) (Rule 10.22). Publish listing document/prospectus (Rule 14.08). If underwritten, disclose underwriter details and compliance with Rule 10.24A. For non-fully underwritten issues, disclose risks on the front cover (Rule 10.23).\n\n" +
        "T+1: Submit application for listing of nil-paid rights and new shares to HKEx (Rule 10.26). HKEx reviews and approves listing.\n\n" +
        "T+2: Record date to determine eligible shareholders. Dispatch Provisional Allotment Letters (PALs) to shareholders (for renounceable issues) (Rule 10.31).\n\n" +
        "T+3: Nil-paid rights trading begins on HKEx (for renounceable issues). Typically lasts 10 business days (market practice).\n\n" +
        "T+12 (10 business days after T+2): Nil-paid rights trading ends. Deadline for shareholders to accept rights and pay for shares (Rule 10.29). Excess application period closes (if applicable, per Rule 10.31(3)).\n\n" +
        "T+13 to T+14: Calculate acceptances and excess applications. Notify underwriters of any shortfall (if underwritten). Underwriters arrange for sale of unsubscribed shares ('rump placement') (Rule 10.31(1)(b)).\n\n" +
        "T+15: Announce results of the rights issue via RIS, including subscription levels and rump placement details (if any) (Rule 10.32).\n\n" +
        "T+16: New shares issued and admitted to trading on HKEx. Dealings in fully-paid shares commence. Refund cheques (if any) dispatched to shareholders for excess applications.\n\n" +
        "T+17 onwards: Finalize accounts with clearing systems (e.g., CCASS). Update share register.\n\n" +
        "Important Notes:\n" +
        "- Underwriting: If underwritten, the underwriter must be licensed under the Securities and Futures Ordinance and independent of the issuer, unless compensatory arrangements are in place for controlling shareholders acting as underwriters (Rule 10.24A, 10.31(2)).\n" +
        "- Compensatory Arrangements: For unsubscribed shares, issuers must adopt excess application or compensatory arrangements (e.g., sale of rump shares), fully disclosed in announcements and listing documents (Rule 10.31(1)).\n" +
        "- Connected Persons: Rights issues to connected persons (e.g., directors, substantial shareholders) are exempt from connected transaction rules if pro-rata to existing shareholdings (Rule 14A.31(3)(a)).\n" +
        "- Timing Adjustments: If a general meeting is required (e.g., no general mandate or pre-emption rights disapplied), add 14–21 days for notice and meeting (Rule 13.36(1)).\n" +
        "- Disclosure: The listing document must include the intended use of proceeds, risks of non-full subscription, and substantial shareholder commitments (Rule 10.23, 10.24).\n\n" +
        "This timetable assumes a renounceable rights issue with no significant regulatory delays. For non-renounceable issues, nil-paid trading steps are omitted, but the acceptance period remains similar.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 10",
      section: "Chapter 10",
      lastUpdated: new Date("2023-09-20"),
      status: "active"
    });
    
    databaseService.addSampleEntry({
      title: "Rights Issue Requirements",
      content: "Rights issues by Hong Kong listed companies are primarily governed by Chapter 10 of the HKEX Listing Rules. " +
        "Key requirements include: " +
        "1. The rights issue must be made pro rata to existing shareholders. " +
        "2. The subscription period must be at least 10 business days from the dispatch of the rights issue documents. " +
        "3. Rights issues require approval by shareholders unless the new shares being issued are not more than 50% of the existing issued shares. " +
        "4. The issuer must make arrangements to dispose of rights shares not subscribed and the net proceeds exceeding HK$100 must be paid to the original allottees. " +
        "5. The company must issue a prospectus in accordance with the Companies (Winding Up and Miscellaneous Provisions) Ordinance. " +
        "6. For companies with a primary listing on HKEX, the rights shares must be offered for subscription at a price that is at a discount of at least 30% to the benchmarked price.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 10",
      section: "Chapter 10",
      lastUpdated: new Date("2022-09-20"),
      status: "active"
    });
    
    // Add information about General Offers under Takeovers Code
    databaseService.addSampleEntry({
      title: "General Offers Timetable",
      content: "Takeovers Code Rule 15 establishes the timeline requirements for general offers:\n\n" +
        "1. First closing date must be at least 21 days following the posting of the offer document (Rule 15.1).\n\n" +
        "2. An offer must initially be open for at least 21 days following the date on which the offer document is posted (Rule 15.1).\n\n" +
        "3. When an offer becomes or is declared unconditional as to acceptances, it should remain open for acceptance for not less than 14 days thereafter (Rule 15.3).\n\n" + 
        "4. All conditions must be fulfilled or the offer must lapse within 60 days of posting the offer document, or 21 days from the date the offer becomes or is declared unconditional as to acceptances, whichever is later (Rule 15.5).\n\n" +
        "5. The offeror must post consideration to accepting shareholders within 7 days following the later of: the date on which the offer becomes or is declared unconditional; or the date of receipt of a complete acceptance (Rule 20.1).\n\n" +
        "6. Competing offers may cause adjustments to timetables at the Executive's discretion (Rule 15.6).",
      category: "takeovers",
      source: "SFC Takeovers Code Rule 15",
      section: "Rule 15",
      lastUpdated: new Date("2023-01-15"),
      status: "active"
    });
    
    // Add up-to-date information about Rule 8.05 (Qualifications for Listing)
    databaseService.addSampleEntry({
      title: "Rule 8.05 - Qualifications for Listing",
      content: "Rule 8.05 of the HKEX Listing Rules sets out the basic financial eligibility requirements for new listing applicants. " +
        "New applicants must meet one of the following three tests:\n\n" +
        "1. Profit Test: The applicant must have a trading record of at least three financial years with:\n" +
        "   (a) Profits attributable to shareholders of at least HK$35 million in the most recent year; and\n" +
        "   (b) Aggregate profits attributable to shareholders of at least HK$45 million in the two preceding years; and\n" +
        "   (c) Management continuity for at least the three preceding financial years; and\n" +
        "   (d) Ownership continuity and control for at least the most recent audited financial year.\n\n" +
        "2. Market Capitalization/Revenue/Cash Flow Test: The applicant must have:\n" +
        "   (a) Market capitalization of at least HK$2 billion at the time of listing; and\n" +
        "   (b) Revenue of at least HK$500 million for the most recent audited financial year; and\n" +
        "   (c) Positive cash flow from operating activities of at least HK$100 million in aggregate for the three preceding financial years; and\n" +
        "   (d) Management continuity for at least the three preceding financial years; and\n" +
        "   (e) Ownership continuity and control for at least the most recent audited financial year.\n\n" +
        "3. Market Capitalization/Revenue Test: The applicant must have:\n" +
        "   (a) Market capitalization of at least HK$4 billion at the time of listing; and\n" +
        "   (b) Revenue of at least HK$500 million for the most recent audited financial year; and\n" +
        "   (c) Management continuity for at least the three preceding financial years; and\n" +
        "   (d) Ownership continuity and control for at least the most recent audited financial year.\n\n" +
        "Note: These financial tests are subject to exceptions and modifications for specific industries or circumstances. The Exchange may accept a shorter trading record period and/or vary or waive the financial standards requirement in certain cases as specified in Rule 8.05A, 8.05B and 8.05C.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 8",
      section: "Rule 8.05",
      lastUpdated: new Date("2023-12-01"),
      status: "active"
    });
    
    console.log("Added sample regulatory data");
  }
};
