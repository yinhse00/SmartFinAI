
// This is the service for the Grok AI integration
import { databaseService } from './databaseService';
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';
import { contextService } from './regulatory/contextService';
import { grokApiService } from './api/grokApiService';
import { documentGenerationService } from './documents/documentGenerationService';
import { translationService } from './translation/translationService';

interface GrokRequestParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: string;
  documentContext?: string;
  regulatoryContext?: string;
}

interface GrokResponse {
  text: string;
  // Add other response fields as needed based on the actual API
}

interface TranslationParams {
  content: string;
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'en' | 'zh';
  format?: string;
}

// Detailed rights issue timetable data to use when API fails to generate one
const RIGHTS_ISSUE_TIMETABLE_FALLBACK = `Timetable for a Rights Issue under Hong Kong Listing Rules

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

Source: Adapted from HKEx Listing Rules (Main Board), particularly Chapter 10, and market practice.`;

export const grokService = {
  /**
   * Check if a Grok API key is set
   */
  hasApiKey: (): boolean => {
    return hasGrokApiKey();
  },

  /**
   * Fetch relevant regulatory information for context
   */
  getRegulatoryContext: contextService.getRegulatoryContext,
  
  /**
   * Generate a response from Grok AI with regulatory context
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // If no regulatory context was provided, try to find relevant context
      let regulatoryContext = params.regulatoryContext;
      
      // Check if the query is about rights issues or timetables
      const isRightsIssueQuery = params.prompt.toLowerCase().includes('right') && 
        (params.prompt.toLowerCase().includes('issue') || params.prompt.toLowerCase().includes('timetable'));
      
      if (!regulatoryContext) {
        if (isRightsIssueQuery) {
          console.log("Rights issue query detected, prioritizing rights issue information");
          // Force a specific search for rights issue timetable information
          regulatoryContext = await contextService.getRegulatoryContext("rights issue timetable detailed");
          
          // Enhance the regulatory context with the detailed timetable
          if (!regulatoryContext.includes("T-30 to T-60") && !regulatoryContext.includes("T+16")) {
            console.log("Adding detailed rights issue timetable to context");
            regulatoryContext += "\n\n--- Rights Issue Detailed Timetable (HK Listing Rules Chapter 10) ---\n" + RIGHTS_ISSUE_TIMETABLE_FALLBACK;
          }
        } else {
          regulatoryContext = await contextService.getRegulatoryContext(params.prompt);
        }
      }
      
      // Special case for rights issue timetable queries - if the main context doesn't have detailed information
      if (isRightsIssueQuery && !regulatoryContext.includes("T-30 to T-60") && !regulatoryContext.includes("T+16")) {
        console.log("Detected rights issue query but context lacks detailed information, enhancing context");
        regulatoryContext += "\n\n--- Rights Issue Detailed Timetable (HK Listing Rules Chapter 10) ---\n" + RIGHTS_ISSUE_TIMETABLE_FALLBACK;
      }
      
      // Check if we found relevant regulatory context
      const hasRelevantContext = regulatoryContext && 
                                !regulatoryContext.includes("No specific regulatory information found") &&
                                !regulatoryContext.includes("Error fetching regulatory context");
      
      // Log the context being used for debugging purposes
      console.log("Using regulatory context:", regulatoryContext);
      
      // Create an enhanced prompt that includes the regulatory context
      const enhancedPrompt = createEnhancedPrompt(params.prompt, params.documentContext, regulatoryContext);
      
      console.log("Generating response with enhanced prompt:", enhancedPrompt);
      
      const apiKey = getGrokApiKey();
      
      // Check if API key is available
      if (!apiKey) {
        console.log("No API key provided, using fallback response");
        return generateFallbackResponse(params.prompt, "No API key provided");
      }
      
      // Validate API key format (basic validation)
      if (!apiKey.startsWith('xai-')) {
        console.error("Invalid API key format");
        return generateFallbackResponse(params.prompt, "Invalid API key format");
      }

      // Special case for rights issue timetable - if request is explicitly about timetable
      if (isRightsIssueQuery && 
          (params.prompt.toLowerCase().includes('timetable') || 
           params.prompt.toLowerCase().includes('schedule') ||
           params.prompt.toLowerCase().includes('timeline'))) {
        console.log("Specific rights issue timetable request detected");
        
        try {
          console.log("Connecting to Grok API for rights issue timetable");
          
          // For timetables, use more explicit instructions
          const timetableSystemMessage = 
            'You are a Hong Kong regulatory expert specializing in rights issues. ' +
            'The user is asking about a rights issue timetable under Hong Kong Listing Rules. ' +
            'You MUST format your response as a detailed table showing the exact timing of each event ' +
            'in a rights issue process, with columns for Date/Event and Description. ' +
            'Include key regulatory references to specific rules in Chapter 10 of the HK Listing Rules. ' +
            'Present information extremely precisely and professionally, as it would appear in a ' + 
            'formal legal or regulatory document. DO NOT summarize or simplify the information. ' +
            'Include all relevant timing details, regulatory requirements, and notes about variations that might apply.';
          
          const requestBody = {
            messages: [
              { 
                role: 'system', 
                content: timetableSystemMessage
              },
              { 
                role: 'user', 
                content: `Here is the regulatory context that you MUST use for your response:\n\n${regulatoryContext}\n\nBased on this regulatory information, please provide the detailed timetable for a rights issue under Hong Kong Listing Rules. Format it as a comprehensive table with Date/Event and Description columns.`
              }
            ],
            model: "grok-3-mini-beta",
            temperature: 0.1, // Lower temperature for more precise timetable
            max_tokens: 2000, // Increase token limit for detailed timetable
            response_format: { type: "text" }
          };
          
          // Log the request body for debugging
          console.log("Timetable request body:", JSON.stringify(requestBody));
          
          const data = await grokApiService.callChatCompletions(requestBody);
          
          const responseContent = data.choices?.[0]?.message?.content;
          
          // Check if we got a proper timetable response
          if (responseContent && 
              (responseContent.includes("T-") || 
               responseContent.includes("T+") || 
               responseContent.includes("Date/Event") || 
               responseContent.includes("| --- | --- |"))) {
            
            console.log("Valid timetable response received from API");
            return { text: responseContent };
          } else {
            console.log("API response doesn't contain timetable format, using fallback");
            return { text: RIGHTS_ISSUE_TIMETABLE_FALLBACK };
          }
        } catch (apiTimetableError) {
          console.error("Error calling Grok API for timetable:", apiTimetableError);
          console.log("Using timetable fallback due to API error");
          return { text: RIGHTS_ISSUE_TIMETABLE_FALLBACK };
        }
      }
      
      // Standard processing for non-timetable specific requests
      try {
        console.log("Connecting to Grok API");
        
        // Create a more structured prompt that explicitly tells Grok how to use the context
        const systemMessage = hasRelevantContext 
          ? 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
            'You MUST base your answers on the regulatory context provided to you. ' +
            'The regulatory context contains essential information to answer the user\'s question. ' +
            'If the context contains details about a timetable or process, you MUST present it in a clear, step-by-step table format. ' +
            'For timetables especially, create a formal table with dates/events and descriptions in separate columns. ' +
            'Be extremely precise and detailed, presenting information exactly as it appears in the context. ' +
            'If the context includes specific rules or article numbers, always cite them. ' +
            'If the user is asking about a rights issue timetable, you MUST format it as a clear table showing each date, event, and description ' +
            'exactly matching the information from the context provided, with no omissions.'
          : 'You are a regulatory advisor specialized in Hong Kong financial regulations. ' +
            'You should base your answers on the regulatory context provided. ' +
            'If the context doesn\'t contain relevant information to answer the question, ' +
            'clearly state that you don\'t have specific information about that topic in your reference documents.';
        
        const requestBody = {
          messages: [
            { 
              role: 'system', 
              content: systemMessage
            },
            { 
              role: 'user', 
              content: enhancedPrompt
            }
          ],
          model: "grok-3-mini-beta",
          temperature: params.temperature || 0.2, // Lowering temperature further for more precise responses
          max_tokens: params.maxTokens || 1500, // Increasing max tokens to allow for more detailed responses
          response_format: { type: "text" }
        };
        
        // Log the request body for debugging
        console.log("Request body:", JSON.stringify(requestBody));
        
        const data = await grokApiService.callChatCompletions(requestBody);
        
        const responseContent = data.choices?.[0]?.message?.content;
        
        // Check if the response seems inadequate and it's a rights issue query
        if ((responseContent?.includes("I couldn't generate a response based on the regulatory context") || 
            responseContent?.includes("No specific information") ||
            responseContent?.includes("I don't have specific information")) && 
            isRightsIssueQuery) {
          
          console.log("Received inadequate response for rights issue query, using fallback");
          if (params.prompt.toLowerCase().includes('timetable')) {
            return { text: RIGHTS_ISSUE_TIMETABLE_FALLBACK };
          } else {
            return generateFallbackResponse(params.prompt, "Incomplete API response");
          }
        }
        
        return {
          text: responseContent || 
                "I'm sorry, I couldn't generate a response based on the regulatory context."
        };
      } catch (apiError) {
        console.error("Error calling Grok API:", apiError);
        
        // Fallback to demo responses when API fails
        console.log("Using fallback response due to API error");
        if (isRightsIssueQuery && params.prompt.toLowerCase().includes('timetable')) {
          return { text: RIGHTS_ISSUE_TIMETABLE_FALLBACK };
        } else {
          return generateFallbackResponse(params.prompt, apiError instanceof Error ? apiError.message : "API error");
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return generateFallbackResponse(params.prompt, "Error generating response");
    }
  },

  /**
   * Translate content using Grok AI
   */
  translateContent: translationService.translateContent,
  
  /**
   * Generate a Word document from text
   */
  generateWordDocument: documentGenerationService.generateWordDocument,

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: documentGenerationService.generatePdfDocument,

  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: documentGenerationService.generateExcelDocument
};
