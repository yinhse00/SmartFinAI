
import { createFinancialExpertSystemPrompt } from '../../../financial/systemPrompts';
import { EXECUTION_TIMELINES, REGULATORY_AUTHORITIES, GUIDE_COVERED_ACTIONS, CORPORATE_ACTION_GUIDES } from '../../../constants/financialConstants';

/**
 * Builds system messages for different query types
 */
export const systemMessageBuilder = {
  buildOpenOfferMessage(): string {
    return `\n\nCRITICAL REGULATORY DISTINCTION: An 'open offer' is a CORPORATE ACTION for capital-raising under the Hong Kong Listing Rules (Chapter 7), NOT the Takeovers Code. It is fundamentally different from a 'general offer' or 'takeover offer' which are governed by the Takeovers Code. When discussing open offers:\n` +
      "1. ALWAYS identify it as a CORPORATE ACTION under Listing Rules\n" + 
      "2. ALWAYS reference Listing Rules, NEVER the Takeovers Code\n" +
      "3. Focus EXCLUSIVELY on capital raising aspects, never acquisition of control\n" +
      "4. Highlight that unlike rights issues, open offers do not have tradable nil-paid rights\n" +
      "5. Include relevant Listing Rules references (e.g., Rule 7.24, 7.26, 7.27A)\n\n" +
      
      "EXECUTION PROCESS FOR OPEN OFFERS:\n" +
      "1. Pre-announcement phase: " + EXECUTION_TIMELINES.LISTING_RULES.PRE_ANNOUNCEMENT + "\n" +
      "2. Circular preparation phase: " + EXECUTION_TIMELINES.LISTING_RULES.CIRCULAR_PREPARATION + "\n" +
      "3. Shareholders' approval if required under Rule 7.24\n" +
      "4. Implementation of trading timetable (ex-entitlement, acceptance period, etc.)\n\n" +
      
      "SPECIAL INSTRUCTION FOR OPEN OFFER TIMETABLES: Your response MUST include ALL of the following key components:\n" +
      "1. Ex-entitlement date\n" +
      "2. Record date\n" +
      "3. Acceptance period (start and end dates)\n" +
      "4. Payment date\n" +
      "5. Explanation of nil-paid rights trading (not applicable for open offers)\n" +
      "6. Specific listing rule references (e.g., Rule 7.24, Chapter 7)\n" +
      "7. A clear conclusion summarizing the key dates and actions\n\n" +
      "ENSURE COMPLETENESS: Do not omit any critical information. If a specific date or detail is uncertain, explicitly state so.\n\n" +
      
      "CRITICALLY IMPORTANT: Open offers must NEVER be confused with offers under the Takeovers Code. Open offers are for capital-raising by listed companies under the Listing Rules. They are NOT related to acquisitions or changes in control which fall under the Takeovers Code. Regulated by: " + REGULATORY_AUTHORITIES.LISTING_RULES;
  },

  buildTakeoverMessage(): string {
    return "\n\nCRITICAL REGULATORY DISTINCTION: A 'takeover offer' or 'general offer' is governed by the Hong Kong Codes on Takeovers and Mergers, NOT the Listing Rules. It is fundamentally different from an 'open offer' which is a CORPORATE ACTION for capital-raising under Listing Rules Chapter 7. When discussing takeover offers:\n" +
      "1. Always reference the Takeovers Code, not Listing Rules Chapter 7\n" +
      "2. Focus exclusively on acquisition of control aspects, not capital raising\n" +
      "3. Include relevant Takeovers Code references (e.g., Rule 26, Rule 30)\n" +
      "4. Distinguish between mandatory and voluntary offers where appropriate\n" +
      "5. NEVER confuse with 'open offers' which are corporate actions under Listing Rules\n\n" +
      
      "EXECUTION PROCESS FOR TAKEOVER OFFERS:\n" +
      "1. Pre-announcement phase: " + EXECUTION_TIMELINES.TAKEOVERS_CODE.PRE_ANNOUNCEMENT + "\n" +
      "2. Offer document preparation: " + EXECUTION_TIMELINES.TAKEOVERS_CODE.OFFER_DOCUMENT + "\n" +
      "3. Offer timeline: " + EXECUTION_TIMELINES.TAKEOVERS_CODE.OFFER_TIMELINE + "\n\n" +
      
      "CRITICAL: Takeover offers are about acquisition of control, not capital raising. Open offers are about capital raising, not acquisition of control. These are completely different regulatory concepts governed by different regulatory frameworks. Regulated by: " + REGULATORY_AUTHORITIES.TAKEOVERS_CODE;
  },

  buildTradingArrangementsMessage(queryType: string): string {
    let guideReference = "";
    switch (queryType) {
      case 'rights_issue':
        guideReference = CORPORATE_ACTION_GUIDES.RIGHTS_ISSUE;
        break;
      case 'open_offer':
        guideReference = CORPORATE_ACTION_GUIDES.OPEN_OFFER;
        break;
      case 'share_consolidation':
        guideReference = CORPORATE_ACTION_GUIDES.SHARE_CONSOLIDATION;
        break;
      case 'board_lot_change':
        guideReference = CORPORATE_ACTION_GUIDES.BOARD_LOT_CHANGE;
        break;
      case 'company_name_change':
        guideReference = CORPORATE_ACTION_GUIDES.COMPANY_NAME_CHANGE;
        break;
    }
    
    return `\n\nCRITICAL INSTRUCTION FOR TRADING ARRANGEMENTS: When discussing trading arrangements for this corporate action, you MUST follow the "Guide on Trading Arrangements for Selected Types of Corporate Actions" issued by HKEX. This guide specifically covers:\n` +
      "1. Rights issues\n" +
      "2. Open offers\n" +
      "3. Share consolidations or sub-divisions\n" +
      "4. Changes in board lot size\n" +
      "5. Changes of company name or addition of Chinese name\n\n" +
      
      "REFERENCE: " + guideReference + "\n\n" +
      
      "EXECUTION PROCESS FOR THIS CORPORATE ACTION:\n" +
      "1. Pre-announcement phase: " + EXECUTION_TIMELINES.LISTING_RULES.PRE_ANNOUNCEMENT + "\n" +
      "2. Circular preparation phase: " + EXECUTION_TIMELINES.LISTING_RULES.CIRCULAR_PREPARATION + "\n" +
      "3. Shareholders' approval as required by Listing Rules\n" +
      "4. Implementation of trading timetable according to the Guide\n\n" +
      
      "ENSURE COMPLETENESS: Your response MUST include ALL key components of the trading arrangements as specified in the Guide. Always reference the Guide explicitly in your response.\n\n" +
      
      "FOR RIGHTS ISSUES SPECIFICALLY:\n" +
      "1. Include nil-paid rights trading period\n" +
      "2. Clearly explain ex-rights date and its implications\n" +
      "3. Include record date, payment date, and all other key dates\n" +
      "4. Present timetable in table format as follows:\n" +
      "| Date | Event | Details |\n" +
      "| ---- | ----- | ------- |\n" +
      "| Day X | Ex-rights Date | Shares trade ex-rights |\n" +
      "| ... | ... | ... |\n\n" +
      
      "FOR OPEN OFFERS SPECIFICALLY:\n" +
      "1. Clearly state that UNLIKE rights issues, open offers DO NOT have tradable nil-paid rights\n" +
      "2. Include ex-entitlement date and its implications\n" +
      "3. Include record date, payment date, and all other key dates\n\n" +
      
      "WITHOUT THESE ELEMENTS, YOUR RESPONSE WILL BE CONSIDERED INCOMPLETE AND NON-COMPLIANT WITH HKEX GUIDELINES.";
  },

  /**
   * Enhanced system message specifically for rights issue timetable queries
   */
  buildRightsIssueTimetableMessage(): string {
    return `\n\nCRITICAL INSTRUCTION FOR RIGHTS ISSUE TIMETABLE: You MUST follow the HKEX "Guide on Trading Arrangements for Selected Types of Corporate Actions" when providing a rights issue timetable. Your response MUST include:\n\n` +
    
    "1. EXPLICIT REFERENCE to the HKEX Guide on Trading Arrangements\n" +
    "2. All key dates in proper TABLE FORMAT with clear headers\n" +
    "3. Ex-rights date and explanation\n" +
    "4. Nil-paid rights trading period (start and end dates)\n" +
    "5. Record date\n" +
    "6. Latest time for acceptance and payment\n" +
    "7. Refund date for unsuccessful/partially successful applications\n" +
    "8. Dealing date for new shares\n\n" +
    
    "SAMPLE TABLE FORMAT (MANDATORY):\n" +
    "| Date | Event | Details |\n" +
    "| ---- | ----- | ------- |\n" +
    "| Day X | Last day of dealings in shares on cum-rights basis | Last day to buy shares with rights |\n" +
    "| Day X+1 | Ex-rights date | Shares trade ex-rights from this day |\n" +
    "| ... | ... | ... |\n\n" +
    
    "EXPLANATORY NOTES (MANDATORY):\n" +
    "- After the timetable, include explanatory notes on nil-paid rights trading\n" +
    "- Explain the difference between cum-rights and ex-rights trading\n" +
    "- Explain the options available to shareholders during the rights issue\n\n" +
    
    "REFERENCE TO LISTING RULES:\n" +
    "- Include reference to relevant Listing Rules (e.g. Chapter 7)\n" +
    "- Note the discount restrictions under Rule 7.27B\n\n" +
    
    "YOUR RESPONSE WILL BE CONSIDERED INCOMPLETE AND NON-COMPLIANT IF IT LACKS ANY OF THESE ELEMENTS.";
  },

  /**
   * Professional formatting and structure requirements for all responses
   */
  buildProfessionalFormatMessage(): string {
    return `\n\nPROFESSIONAL PRESENTATION REQUIREMENTS: Structure your response professionally as follows:

1. EXECUTIVE SUMMARY:
   - Begin with a concise (2-3 sentence) summary of key points
   - Focus on the most critical regulatory requirements or distinctions
   - Use formal, authoritative language

2. DETAILED ANALYSIS:
   - Organize content with clear headings and subheadings
   - Use numerical or bullet point lists for sequential steps or requirements
   - Present comparative information in tables with proper headers
   - Include specific rule citations in format: "Rule X.XX of [Regulatory Document]"

3. PRACTICAL IMPLICATIONS:
   - Address operational considerations for implementation
   - Include timeline considerations where relevant
   - Note any common compliance pitfalls

4. CONCLUSION:
   - Provide clear summary of requirements
   - Restate key regulatory distinctions
   - End with a definitive statement on compliance requirements

PROFESSIONAL LANGUAGE REQUIREMENTS:
- Use formal regulatory terminology consistently
- Avoid simplified explanations or colloquial phrasings
- For definitions, use precise technical language from regulatory sources
- When quoting regulatory text, use exact wording and proper citations
- Format all financial figures according to professional standards (e.g., "HK$10,000,000")

DATABASE CONTENT VERIFICATION REQUIREMENTS:
- For any regulatory document references, ONLY cite materials that exist in the database
- For FAQs, Guidance Documents, or regulatory provisions:
  • Quote exact text from the database sources when available
  • Include document reference numbers and sources only if they exist in the database
  • If paraphrasing database content, clearly indicate this is an interpretation
  • If no database content is available for a topic, explicitly state "No specific guidance materials found in the regulatory database"
- Do NOT generate placeholder document codes or reference numbers
- Do NOT create fictitious regulatory document citations
- Only reference actual database entries and legitimate regulatory sources
`;
  }
};
