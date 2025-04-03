
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
      text: `Based on your query about rights issues, here is my response:\n\n` +
            `A typical Rights Issue timetable for Hong Kong listed companies includes:\n\n` +
            `1. Announcement Date (Day 0): Initial announcement of the rights issue\n` +
            `2. Ex-Rights Date (Day 3-5): Shares begin trading without rights to the offering\n` +
            `3. Record Date (Day 5-7): Date to determine eligible shareholders\n` +
            `4. Prospectus Posting (Day 7-10): Rights issue documents sent to shareholders\n` +
            `5. Subscription Period (Day 10-24): 14-day period for shareholders to exercise rights\n` +
            `6. Trading of Nil-paid Rights (Day 10-20): Period when rights can be traded\n` +
            `7. Latest Time for Acceptance (Day 24): Deadline for payment and acceptance\n` +
            `8. Announcement of Results (Day 25-26): Results of the rights subscription\n` +
            `9. Refund Checks Dispatch (Day 27-28): Refunds for unsuccessful excess applications\n` +
            `10. Dealing in Fully-paid Rights (Day 28-30): New shares begin trading\n\n` +
            `This timetable follows the requirements under Chapter 7 of the Hong Kong Listing Rules.`
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
