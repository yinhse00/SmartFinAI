
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
      "4. Implementation of trading timetable per the Guide on Trading Arrangements\n\n" +
      
      "SPECIAL INSTRUCTION FOR OPEN OFFER TIMETABLES: Your response MUST include ALL of the following key components from the Guide on Trading Arrangements:\n" +
      "1. Last cum-entitlement trading day (T-2)\n" +
      "2. Ex-entitlement date (T-1)\n" +
      "3. Record date (T)\n" +
      "4. Application form dispatch (T+5)\n" +
      "5. Latest acceptance date (T+14)\n" +
      "6. New shares listing (T+21)\n" +
      "7. Explicit statement that open offers do NOT have nil-paid rights trading (unlike rights issues)\n" +
      "8. Specific listing rule references (e.g., Rule 7.24, Rule 7.26A for excess applications)\n" +
      "9. A clear conclusion summarizing the key dates and actions\n\n" +
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
      
      "ENSURE COMPLETENESS: Your response MUST include ALL key components of the trading arrangements as specified in the Guide. Always reference the Guide explicitly in your response.";
  }
};
