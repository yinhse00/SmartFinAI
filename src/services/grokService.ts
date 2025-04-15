
// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
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
  queryType?: string;
  metadata?: {
    contextUsed?: boolean;
    relevanceScore?: number;
  }
}

interface TranslationParams {
  content: string;
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'en' | 'zh';
  format?: string;
}

// Financial expertises available in the system
const FINANCIAL_EXPERTISES = {
  LISTING_RULES: 'listing_rules',
  TAKEOVERS: 'takeovers_code',
  RIGHTS_ISSUE: 'rights_issue',
  CONNECTED_TRANSACTIONS: 'connected_transactions',
  DISCLOSURE: 'disclosure',
  PROSPECTUS: 'prospectus',
  CIRCULAR: 'circular',
  WAIVER: 'waiver',
  GENERAL: 'general'
};

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
   * Enhanced professional financial response generation with advanced context handling
   */
  generateResponse: async (params: GrokRequestParams): Promise<GrokResponse> => {
    try {
      // Enhanced logging for professional financial expertise
      console.group('Hong Kong Financial Expert Response Generation');
      console.log('Input Query:', params.prompt);

      // Detect specific query types for specialized financial handling
      const queryType = detectFinancialExpertiseArea(params.prompt);
      console.log('Detected Financial Expertise Area:', queryType);

      // Retrieve context with enhanced financial reasoning
      const { context, reasoning } = await contextService.getRegulatoryContextWithReasoning(params.prompt);
      console.log('Financial Context Reasoning:', reasoning);

      // Create a professional financial system message based on expertise area
      const systemMessage = createFinancialExpertSystemPrompt(queryType, context);
      console.log('Using specialized financial expert prompt');

      // Dynamic temperature and token settings based on query complexity
      const temperature = determineOptimalTemperature(queryType, params.prompt);
      const maxTokens = determineOptimalTokens(queryType, params.prompt);
      
      console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}`);

      // Prepare request body with enhanced instructions
      const requestBody = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: params.prompt }
        ],
        model: "grok-3-mini-beta",
        temperature: temperature,
        max_tokens: maxTokens,
      };

      // Make API call with professional financial expertise configuration
      const response = await grokApiService.callChatCompletions(requestBody);
      
      // Process the response
      const responseText = response.choices[0].message.content;
      
      // Handle special case for timetables if response quality is insufficient
      let finalResponse = responseText;
      if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && 
          params.prompt.toLowerCase().includes('timetable') &&
          !isWellFormattedTimetable(responseText)) {
        console.log('Using fallback professional timetable format for rights issue');
        finalResponse = RIGHTS_ISSUE_TIMETABLE_FALLBACK;
      }

      console.groupEnd();

      return {
        text: finalResponse,
        queryType: queryType,
        metadata: {
          contextUsed: !!context,
          relevanceScore: evaluateResponseRelevance(finalResponse, params.prompt, queryType)
        }
      };

    } catch (error) {
      console.error('Hong Kong Financial Expert Response Error:', error);
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

/**
 * Detect financial expertise area needed for the query
 */
function detectFinancialExpertiseArea(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Prioritize specific Hong Kong financial expertise areas
  if (lowerPrompt.includes('rights issue') && 
      (lowerPrompt.includes('timetable') || lowerPrompt.includes('schedule')))
    return FINANCIAL_EXPERTISES.RIGHTS_ISSUE;
    
  if (lowerPrompt.includes('connected transaction') || 
      lowerPrompt.includes('chapter 14a'))
    return FINANCIAL_EXPERTISES.CONNECTED_TRANSACTIONS;
    
  if ((lowerPrompt.includes('takeover') || lowerPrompt.includes('takeovers code')) && 
      lowerPrompt.includes('mandatory'))
    return FINANCIAL_EXPERTISES.TAKEOVERS;
    
  if (lowerPrompt.includes('prospectus') || 
      lowerPrompt.includes('offering document'))
    return FINANCIAL_EXPERTISES.PROSPECTUS;
    
  if (lowerPrompt.includes('disclosure') || 
      lowerPrompt.includes('announcement'))
    return FINANCIAL_EXPERTISES.DISCLOSURE;
    
  if (lowerPrompt.includes('circular') || 
      lowerPrompt.includes('shareholder approval'))
    return FINANCIAL_EXPERTISES.CIRCULAR;
    
  if (lowerPrompt.includes('waiver') || 
      lowerPrompt.includes('exemption'))
    return FINANCIAL_EXPERTISES.WAIVER;
    
  if (lowerPrompt.includes('listing rules') || 
      lowerPrompt.includes('hkex'))
    return FINANCIAL_EXPERTISES.LISTING_RULES;
    
  return FINANCIAL_EXPERTISES.GENERAL;
}

/**
 * Create system prompt tailored to specific financial expertise areas
 */
function createFinancialExpertSystemPrompt(expertiseArea: string, context: string): string {
  // Base prompt with professional financial credentials and role definition
  const basePrompt = `You are a senior Hong Kong corporate finance expert with deep expertise in Hong Kong listing rules, SFC regulations, takeovers code, and securities law. You have over 15 years of experience advising investment banks, law firms, and listed companies on complex regulatory matters. Use the following financial regulatory context precisely:

${context}

Always cite specific rule numbers, regulations, and regulatory guidance in your responses. Format your answers professionally as a senior financial advisor would, with clear structure and precise technical language appropriate for bankers and lawyers.

`;

  // Specialized expertise-specific instructions
  switch (expertiseArea) {
    case FINANCIAL_EXPERTISES.RIGHTS_ISSUE:
      return basePrompt + `For rights issue inquiries:
- Present timetables in a professional, clear tabular format
- Include all key regulatory dates and deadlines from Chapter 10 of HK Listing Rules
- Specify exact regulatory requirements for each step with rule references
- Include notes on underwriting requirements, connected person implications, and disclosure obligations
- Address practical considerations on pricing, excess applications, and compensatory arrangements`;

    case FINANCIAL_EXPERTISES.CONNECTED_TRANSACTIONS:
      return basePrompt + `For connected transaction analysis:
- Cite specific rules from Chapter 14A of the Listing Rules
- Explain transaction categorization methodology and thresholds
- Detail calculation methods for percentage ratios
- Outline precise disclosure and shareholders' approval requirements
- Address exemption conditions with exact rule references`;

    case FINANCIAL_EXPERTISES.TAKEOVERS:
      return basePrompt + `For takeovers code inquiries:
- Reference specific Rules and Notes from the HK Takeovers Code
- Explain mandatory offer triggers with precise threshold calculations
- Detail offer price determination methodology
- Specify exact timing requirements and documentation needs
- Address practical considerations on compliance and implementation`;

    case FINANCIAL_EXPERTISES.DISCLOSURE:
      return basePrompt + `For disclosure requirements:
- Cite specific disclosure obligations under the Listing Rules and SFO
- Outline exact timing requirements for different disclosure types
- Detail content requirements with template structures
- Address inside information disclosure obligations
- Explain consequences of non-compliance with regulatory references`;

    case FINANCIAL_EXPERTISES.PROSPECTUS:
      return basePrompt + `For prospectus requirements:
- Reference specific CWUMPO and Listing Rules requirements
- Detail exact content requirements with section-by-section guidance
- Explain due diligence obligations with regulatory citations
- Outline liability provisions and safe harbor conditions
- Address practical drafting considerations and common pitfalls`;

    default:
      return basePrompt + `Provide comprehensive, technically precise analysis with specific regulatory citations. Format your response professionally with clear structure, headings, and bullet points where appropriate.`;
  }
}

/**
 * Determine optimal temperature setting based on query type and content
 */
function determineOptimalTemperature(queryType: string, prompt: string): number {
  // For factual regulatory matters, use lower temperature
  if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && prompt.toLowerCase().includes('timetable')) {
    return 0.1; // Very precise for timetables
  }
  
  if ([FINANCIAL_EXPERTISES.LISTING_RULES, FINANCIAL_EXPERTISES.TAKEOVERS].includes(queryType)) {
    return 0.2; // Precise for rule interpretations
  }
  
  if (prompt.toLowerCase().includes('example') || prompt.toLowerCase().includes('template')) {
    return 0.4; // Slightly higher for examples but still controlled
  }
  
  // Default for general inquiries
  return 0.3;
}

/**
 * Determine optimal token limit based on query complexity
 */
function determineOptimalTokens(queryType: string, prompt: string): number {
  if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && prompt.toLowerCase().includes('timetable')) {
    return 2500; // More tokens for detailed timetables
  }
  
  if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('detail')) {
    return 2000; // More tokens for explanations
  }
  
  // Default token count
  return 1500;
}

/**
 * Check if the response contains a well-formatted timetable
 */
function isWellFormattedTimetable(response: string): boolean {
  // Check for table formatting with dates and descriptions
  const hasTableStructure = response.includes('|') && response.includes('---');
  const hasDateEntries = /T[\+\-]\d+|Day \d+|Date/.test(response);
  const hasTimetableHeader = /timetable|timeline|schedule/i.test(response);
  
  return hasTableStructure && hasDateEntries && hasTimetableHeader;
}

/**
 * Evaluate relevance of response to the original query
 */
function evaluateResponseRelevance(response: string, query: string, queryType: string): number {
  let score = 0;
  
  // Check for specific rule citations
  if (/Rule \d+\.\d+|\[Chapter \d+\]|section \d+/i.test(response)) {
    score += 3;
  }
  
  // Check for HK-specific regulatory entities
  if (/HKEX|SFC|Hong Kong Stock Exchange|Securities and Futures Commission/i.test(response)) {
    score += 2;
  }
  
  // Check for professional financial terminology
  const financialTerms = [
    'listing rules', 'takeovers code', 'SFO', 'circular', 'disclosure',
    'connected transaction', 'inside information', 'prospectus'
  ];
  
  financialTerms.forEach(term => {
    if (response.toLowerCase().includes(term)) {
      score += 1;
    }
  });
  
  // Normalize to 0-10 scale
  return Math.min(10, score);
}
