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
  queryType?: string;
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
   * Enhanced response generation with more robust context handling
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // Enhanced logging for debugging
      console.group('Grok Response Generation');
      console.log('Input Prompt:', params.prompt);

      // Detect specific query types
      const queryType = detectQueryType(params.prompt);
      console.log('Detected Query Type:', queryType);

      // Retrieve context with enhanced reasoning
      const { context, reasoning } = await contextService.getRegulatoryContextWithReasoning(params.prompt);
      console.log('Context Reasoning:', reasoning);

      // Create a more structured system message based on query type
      const systemMessage = createSystemMessageForQueryType(queryType, context);

      // Prepare request body with enhanced instructions
      const requestBody = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: queryType === 'timetable' ? 0.1 : 0.3,
        max_tokens: queryType === 'timetable' ? 2000 : 1500,
      };

      console.log('Request Body:', requestBody);

      // Make API call
      const response = await grokApiService.callChatCompletions(requestBody);

      console.groupEnd();

      return {
        text: response.choices[0].message.content,
        queryType: queryType
      };

    } catch (error) {
      console.error('Grok Response Generation Error:', error);
      console.groupEnd();

      return generateFallbackResponse(params.prompt, error);
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

// Helper function to detect query type
function detectQueryType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('rights issue') && lowerPrompt.includes('timetable')) return 'timetable';
  if (lowerPrompt.includes('connected transaction')) return 'connected_transaction';
  if (lowerPrompt.includes('mandatory offer')) return 'mandatory_offer';
  return 'general';
}

// Create system message tailored to query type
function createSystemMessageForQueryType(queryType: string, context: string): string {
  const baseMessage = `You are a Hong Kong regulatory expert. Use the following context precisely:

${context}

`;

  switch (queryType) {
    case 'timetable':
      return baseMessage + `For rights issue timetables:
- Format your response as a clear, professionally structured table
- Include specific rule references from Chapter 10 of HK Listing Rules
- Be extremely precise about dates, events, and regulatory requirements
- Do not summarize or generalize; provide exact details`;

    case 'connected_transaction':
      return baseMessage + `For connected transactions:
- Cite specific rules from Chapter 14A
- Explain transaction classification and approval requirements
- Highlight disclosure and shareholders' approval thresholds`;

    case 'mandatory_offer':
      return baseMessage + `For mandatory offer rules:
- Reference Rule 26 of Takeovers Code
- Explain triggering events for mandatory offers
- Detail calculation of offer price and shareholders' rights`;

    default:
      return baseMessage + `Provide a comprehensive, rule-based regulatory analysis.`;
  }
}
