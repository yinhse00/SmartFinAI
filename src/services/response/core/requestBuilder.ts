
import { createFinancialExpertSystemPrompt } from '../../financial/systemPrompts';
import { responseOptimizer } from '../modules/responseOptimizer';
import { REGULATORY_FRAMEWORKS, EXECUTION_TIMELINES, REGULATORY_AUTHORITIES, GUIDE_COVERED_ACTIONS, CORPORATE_ACTION_GUIDES } from '../../constants/financialConstants';

/**
 * Builds appropriate API requests based on query type and context
 */
export const requestBuilder = {
  /**
   * Build a system message based on query characteristics
   */
  buildSystemMessage: (
    queryType: string, 
    regulatoryContext?: string, 
    isFaqQuery: boolean = false
  ): string => {
    // Create a professional financial system message based on expertise area
    let systemMessage = createFinancialExpertSystemPrompt(queryType, regulatoryContext);
    
    // Add specific, comprehensive instructions for Open Offer as a corporate action under Listing Rules
    if (queryType === 'open_offer') {
      systemMessage += "\n\nCRITICAL REGULATORY DISTINCTION: An 'open offer' is a CORPORATE ACTION for capital-raising under the Hong Kong Listing Rules (Chapter 7), NOT the Takeovers Code. It is fundamentally different from a 'general offer' or 'takeover offer' which are governed by the Takeovers Code. When discussing open offers:\n" +
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
    }
    
    // Add special instructions for takeover offers to distinguish from open offers
    if (queryType === 'takeover_offer' || queryType === 'takeovers_code' || queryType === 'takeovers') {
      systemMessage += "\n\nCRITICAL REGULATORY DISTINCTION: A 'takeover offer' or 'general offer' is governed by the Hong Kong Codes on Takeovers and Mergers, NOT the Listing Rules. It is fundamentally different from an 'open offer' which is a CORPORATE ACTION for capital-raising under Listing Rules Chapter 7. When discussing takeover offers:\n" +
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
    }
    
    // Add specific instructions for corporate actions covered by the trading arrangements guide
    if (GUIDE_COVERED_ACTIONS.includes(queryType)) {
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
      
      systemMessage += "\n\nCRITICAL INSTRUCTION FOR TRADING ARRANGEMENTS: When discussing trading arrangements for this corporate action, you MUST follow the \"Guide on Trading Arrangements for Selected Types of Corporate Actions\" issued by HKEX. This guide specifically covers:\n" +
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
    
    // Add stronger instructions to use database content
    systemMessage += "\n\nCRITICAL INSTRUCTION: You MUST prioritize information from the regulatory database over your general knowledge. When regulatory guidance exists in the provided database content, use it verbatim. If the database contains an answer to the question, quote it directly rather than generating your own response. Only use your general knowledge when the database has no relevant information.";
    
    // For FAQ queries, add specific instructions to use the exact wording from the database
    if (isFaqQuery) {
      systemMessage += "\n\nIMPORTANT: For questions related to FAQs or continuing obligations, ONLY use the exact wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document and provide them verbatim. If no exact match is found, explicitly state that.";
    }
    
    // Add special instruction for definition queries to be comprehensive
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR DEFINITIONS: When responding to 'what is' or definition questions, provide COMPREHENSIVE explanations including the formal regulatory definition, practical implications, and relevant examples. For connected persons or connected transactions, include ALL categories of connected persons and relevant thresholds from Chapter 14A.";
    
    // Add special instruction for rights issue timetables
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR RIGHTS ISSUES: When asked about rights issue timetables, provide ALL key dates and actions including: board meeting date, announcement date, circular dispatch, EGM date, record date, commencement of dealings in nil-paid rights, last day for splitting, last day for acceptance and payment, results announcement date, refund date, and dispatch date of share certificates. Include ALL key information and ensure the response is COMPLETE.";
    
    // Add special instruction for execution processes
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR EXECUTION PROCESSES: When explaining execution processes for any corporate action or takeover offer, always include the full timeline from preparation to implementation. For Listing Rules corporate actions, include preparation phase (2-3 days), HKEX vetting (2-10 days), circular preparation (3-10 days), HKEX circular vetting (5-20 days), shareholders' approval if required, and implementation timeline. For Takeover Code offers, include SFC-specific timelines and requirements.";
    
    // Add special instruction for completeness and brevity to avoid truncation
    systemMessage += "\n\nCRITICAL: Ensure your response is COMPLETE and not truncated. Be CONCISE and direct. Prioritize including all key points over lengthy explanations. If discussing a procedure with multiple steps, include ALL steps but explain each briefly. Format information efficiently. Focus on providing complete information rather than verbose explanations.";
    
    return systemMessage;
  },

  /**
   * Build request body for API call
   */
  buildRequestBody: (
    systemMessage: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): any => {
    // Check if this is a retry attempt based on prompt content
    const isRetryAttempt = prompt.includes('[RETRY_ATTEMPT]') || prompt.includes('[THIS IS A RETRY ATTEMPT');
    
    // Add instruction for completeness to the prompt
    let enhancedPrompt = prompt;
    
    // CRITICAL FIX: For financial timetable queries, add specific instructions
    if ((prompt.toLowerCase().includes('open offer') || prompt.toLowerCase().includes('rights issue')) && 
        (prompt.toLowerCase().includes('timetable') || prompt.toLowerCase().includes('schedule'))) {
      enhancedPrompt += " Please ensure to include a clear conclusion or summary section at the end of your response that ties everything together. Your response must be complete and well-structured. Please provide a comprehensive response with a clear conclusion section that summarizes all key points.";
    } else {
      enhancedPrompt += " Please provide a complete but concise response covering all key points.";
    }
    
    // For execution process queries, add specific instructions
    if (prompt.toLowerCase().includes('execution') || 
        prompt.toLowerCase().includes('process') || 
        prompt.toLowerCase().includes('timeline') ||
        prompt.toLowerCase().includes('working')) {
      enhancedPrompt += " Please include all steps in the execution process from preparation through implementation, with appropriate regulatory authority steps and timelines.";
    }
    
    // For retry attempts, use higher token limits and lower temperature
    let finalTokens = maxTokens;
    let finalTemperature = temperature;
    
    if (isRetryAttempt) {
      console.log("Retry attempt detected: Using enhanced parameters");
      // CRITICAL FIX: Use much higher token limits for retries
      finalTokens = Math.max(10000, maxTokens); // Always use at least 10K for retry
      finalTemperature = Math.min(0.1, temperature);
    }
    
    return {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: enhancedPrompt }
      ],
      model: "grok-3-mini-beta",
      temperature: finalTemperature,
      // CRITICAL FIX: Use appropriate token limits consistently
      max_tokens: finalTokens,
    };
  },

  /**
   * Get optimized parameters for the request
   */
  getOptimizedParameters: (
    queryType: string, 
    prompt: string, 
    hasContext: boolean,
    isSimpleQuery: boolean = false
  ): { temperature: number, maxTokens: number } => {
    // CRITICAL FIX: For timetable queries, use specialized settings
    const isTimetableQuery = (queryType === 'open_offer' || queryType === 'rights_issue') &&
                           (prompt.toLowerCase().includes('timetable') || 
                            prompt.toLowerCase().includes('schedule'));
    
    // For execution process queries, also use specialized settings
    const isExecutionProcessQuery = prompt.toLowerCase().includes('execution') || 
                                   prompt.toLowerCase().includes('process') || 
                                   prompt.toLowerCase().includes('timeline') ||
                                   prompt.toLowerCase().includes('working');
    
    // For timetable or execution process queries, use specialized settings
    if (isTimetableQuery || isExecutionProcessQuery) {
      console.log(`${queryType} timetable/process query detected - using specialized parameters`);
      return {
        temperature: 0.1,  // Very low temperature for deterministic results
        maxTokens: 10000   // Much higher token limit for comprehensive timetables
      };
    }
    
    // Check for definition queries
    const isDefinitionQuery = prompt.toLowerCase().includes('what is') || 
                             prompt.toLowerCase().includes('definition');
    
    // For definition queries, use higher token limit
    if (isDefinitionQuery) {
      return {
        temperature: 0.1,  // Very low temperature for accurate definitions
        maxTokens: 8000    // Higher token limit for comprehensive definitions
      };
    }
    
    // Use simpler parameters for conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.3,
        maxTokens: 4000    // Increased from 2000
      };
    }
    
    // Get optimized parameters from the optimizer service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    // Use lower temperature for database-backed queries
    const actualTemperature = hasContext ? 0.1 : temperature;
    
    // CRITICAL FIX: Use consistently higher token limits
    const safeMaxTokens = Math.min(8000, Math.max(4000, maxTokens));
    
    return { temperature: actualTemperature, maxTokens: safeMaxTokens };
  }
};

// Import this at the top of the file
import { REGULATORY_AUTHORITIES } from '../../constants/financialConstants';
