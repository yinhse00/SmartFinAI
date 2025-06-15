import { createFinancialExpertSystemPrompt } from '../../financial/systemPrompts';
import { GUIDE_COVERED_ACTIONS } from '../../constants/financialConstants';
import { systemMessageBuilder } from './messages/systemMessageBuilder';
import { optimizedParametersBuilder } from './parameters/optimizedParametersBuilder';
import { requestBodyBuilder } from './builders/requestBodyBuilder';

/**
 * Coordinates request building using specialized builders with enhanced database preservation
 */
export const requestBuilder = {
  buildSystemMessage(
    queryType: string, 
    regulatoryContext?: string, 
    isFaqQuery: boolean = false
  ): string {
    let systemMessage = createFinancialExpertSystemPrompt(queryType, regulatoryContext);
    
    if (queryType === 'open_offer') {
      systemMessage += systemMessageBuilder.buildOpenOfferMessage();
    }
    
    if (queryType === 'takeover_offer' || queryType === 'takeovers_code' || queryType === 'takeovers') {
      systemMessage += systemMessageBuilder.buildTakeoverMessage();
    }
    
    if (GUIDE_COVERED_ACTIONS.includes(queryType)) {
      systemMessage += systemMessageBuilder.buildTradingArrangementsMessage(queryType);
    }
    
    // Add professional formatting message to all queries
    systemMessage += systemMessageBuilder.buildProfessionalFormatMessage();
    
    // ENHANCED: Extremely explicit database content preservation instructions
    systemMessage += "\n\n🔴 CRITICAL DATABASE CONTENT PRESERVATION 🔴";
    systemMessage += "\nThe regulatory database content is the AUTHORITATIVE source. You MUST:";
    systemMessage += "\n• NEVER change rule numbers (Rule 8.05(1)(a) stays Rule 8.05(1)(a), NOT Rule 8.05(1))";
    systemMessage += "\n• PRESERVE exact regulatory citations from database verbatim";
    systemMessage += "\n• Quote database content exactly - no simplification allowed";
    systemMessage += "\n• When database contains specific subsections like (1)(a), include them all";
    systemMessage += "\n• Database content takes absolute precedence over your general knowledge";
    
    if (isFaqQuery) {
      systemMessage += "\n\nIMPORTANT: For questions related to FAQs or continuing obligations, ONLY use the exact wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document and provide them verbatim. If no exact match is found, explicitly state that.";
    }
    
    // Enhanced formatting instructions with semantic HTML and proper structuring
    systemMessage += "\n\nFORMATTING INSTRUCTIONS: Use semantic HTML elements for better structure and readability:";
    systemMessage += "\n• Use <h1>, <h2>, <h3> tags for headings instead of markdown symbols (#, ##, ###)";
    systemMessage += "\n• Use <p> tags for paragraphs with proper spacing";
    systemMessage += "\n• Use <strong> for bold/important text";
    systemMessage += "\n• Use <em> for italic/emphasized text";
    systemMessage += "\n• Use <ul> and <li> for bullet point lists";
    systemMessage += "\n• Use proper tables with <table>, <tr>, <th>, and <td> tags for tabular data";
    systemMessage += "\n• Ensure adequate spacing between paragraphs and sections";
    systemMessage += "\n• Bold key terms, rule references, and important concepts";
    
    // Add remaining instructions with improved formatting guidance
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR DEFINITIONS: When responding to 'what is' or definition questions, provide COMPREHENSIVE explanations including the formal regulatory definition, practical implications, and relevant examples. For connected persons or connected transactions, include ALL categories of connected persons and relevant thresholds from Chapter 14A.";
    
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR RIGHTS ISSUES: When asked about rights issue timetables, provide ALL key dates and actions including: board meeting date, announcement date, circular dispatch, EGM date, record date, commencement of dealings in nil-paid rights, last day for splitting, last day for acceptance and payment, results announcement date, refund date, and dispatch date of share certificates. Include ALL key information and ensure the response is COMPLETE.";
    
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR EXECUTION PROCESSES: When explaining execution processes for any corporate action or takeover offer, always include the full timeline from preparation to implementation. For Listing Rules corporate actions, include preparation phase (2-3 days), HKEX vetting (2-10 days), circular preparation (3-10 days), HKEX circular vetting (5-20 days), shareholders' approval if required, and implementation timeline. For Takeover Code offers, include SFC-specific timelines and requirements.";
    
    systemMessage += "\n\nVERIFICATION INSTRUCTION: For any FAQ, Guidance Letter, or Listing Decision content, you MUST verify the accuracy of any quoted text against the regulatory database content provided. If directly quoting, ensure verbatim accuracy. If summarizing, clearly indicate this. If uncertain about exact wording, explicitly state that you are providing a general interpretation rather than an exact quote.";
    
    systemMessage += "\n\nCRITICAL: Ensure your response is COMPLETE and not truncated. Prioritize including all key points. If discussing a procedure with multiple steps, include ALL steps but explain each clearly. Format information efficiently with proper paragraphing and formatting.";
    
    // FINAL EMPHASIS on database preservation
    systemMessage += "\n\n🔴 FINAL REMINDER: PRESERVE ALL EXACT RULE REFERENCES FROM DATABASE 🔴";
    
    return systemMessage;
  },

  buildRequestBody(
    systemMessage: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): any {
    return requestBodyBuilder.build(systemMessage, prompt, temperature, maxTokens);
  },

  getOptimizedParameters(
    queryType: string,
    prompt: string,
    hasContext: boolean,
    isSimpleQuery: boolean = false
  ): { temperature: number, maxTokens: number } {
    return optimizedParametersBuilder.getParameters(queryType, prompt, hasContext, isSimpleQuery);
  }
};
