
import { createFinancialExpertSystemPrompt } from '../../financial/systemPrompts';
import { GUIDE_COVERED_ACTIONS } from '../../constants/financialConstants';
import { systemMessageBuilder } from './messages/systemMessageBuilder';
import { optimizedParametersBuilder } from './parameters/optimizedParametersBuilder';
import { requestBodyBuilder } from './builders/requestBodyBuilder';

/**
 * Coordinates request building using specialized builders
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
    
    // Add database and FAQ instructions
    systemMessage += "\n\nCRITICAL INSTRUCTION: You MUST prioritize information from the regulatory database over your general knowledge. When regulatory guidance exists in the provided database content, use it verbatim. If the database contains an answer to the question, quote it directly rather than generating your own response. Only use your general knowledge when the database has no relevant information.";
    
    if (isFaqQuery) {
      systemMessage += "\n\nIMPORTANT: For questions related to FAQs or continuing obligations, ONLY use the exact wording from the provided database entries. DO NOT paraphrase, summarize or use your own knowledge. Extract the relevant FAQ question and answer from the '10.4 FAQ Continuing Obligations' document and provide them verbatim. If no exact match is found, explicitly state that.";
    }
    
    // Add remaining instructions
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR DEFINITIONS: When responding to 'what is' or definition questions, provide COMPREHENSIVE explanations including the formal regulatory definition, practical implications, and relevant examples. For connected persons or connected transactions, include ALL categories of connected persons and relevant thresholds from Chapter 14A.";
    
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR RIGHTS ISSUES: When asked about rights issue timetables, provide ALL key dates and actions including: board meeting date, announcement date, circular dispatch, EGM date, record date, commencement of dealings in nil-paid rights, last day for splitting, last day for acceptance and payment, results announcement date, refund date, and dispatch date of share certificates. Include ALL key information and ensure the response is COMPLETE.";
    
    systemMessage += "\n\nSPECIAL INSTRUCTION FOR EXECUTION PROCESSES: When explaining execution processes for any corporate action or takeover offer, always include the full timeline from preparation to implementation. For Listing Rules corporate actions, include preparation phase (2-3 days), HKEX vetting (2-10 days), circular preparation (3-10 days), HKEX circular vetting (5-20 days), shareholders' approval if required, and implementation timeline. For Takeover Code offers, include SFC-specific timelines and requirements.";
    
    systemMessage += "\n\nCRITICAL: Ensure your response is COMPLETE and not truncated. Be CONCISE and direct. Prioritize including all key points over lengthy explanations. If discussing a procedure with multiple steps, include ALL steps but explain each briefly. Format information efficiently. Focus on providing complete information rather than verbose explanations.";
    
    // Add strong environment consistency instruction
    systemMessage += "\n\nCRITICAL ENVIRONMENT CONSISTENCY INSTRUCTION: You MUST provide IDENTICAL responses across all environments (development, staging, production) when given the same input. Do not change responses based on where you are deployed. Do not add disclaimers or notes about environment differences. Use the same reasoning process and provide the same content regardless of environment. Maintain absolute consistency.";
    
    // Add processing determinism instruction
    systemMessage += "\n\nCRITICAL DETERMINISTIC PROCESSING: For maximum consistency, follow a structured approach when generating responses: 1) Identify the core question, 2) Match it with relevant database content, 3) Format the response in standard structure, 4) Review for completeness. Always use this consistent process to ensure identical outputs across environments.";
    
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
