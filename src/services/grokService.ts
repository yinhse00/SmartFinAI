// This is the service for the Grok AI integration specialized for Hong Kong financial expertise
import { databaseService } from './databaseService';
import { hasGrokApiKey, getGrokApiKey } from './apiKeyService';
import { createEnhancedPrompt, formatRegulatoryEntriesAsContext } from './contextUtils';
import { generateFallbackResponse } from './fallbackResponseService';
import { contextService } from './regulatory/contextService';
import { grokApiService } from './api/grokApiService';
import { documentGenerationService } from './documents/documentGenerationService';
import { translationService } from './translation/translationService';
import { isTradingArrangementComplete } from '@/utils/truncationUtils';

// Financial expertises available in the system
const FINANCIAL_EXPERTISES = {
  LISTING_RULES: 'listing_rules',
  TAKEOVERS: 'takeovers_code',
  RIGHTS_ISSUE: 'rights_issue',
  OPEN_OFFER: 'open_offer',
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  CONNECTED_TRANSACTIONS: 'connected_transactions',
  DISCLOSURE: 'disclosure',
  PROSPECTUS: 'prospectus',
  CIRCULAR: 'circular',
  WAIVER: 'waiver',
  GENERAL: 'general'
};

// Trading arrangement templates for different corporate actions
const TRADING_ARRANGEMENTS = {
  RIGHTS_ISSUE: `# Trading Arrangements for Rights Issue under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-2 | Announcement Date | Last day for trading in shares with entitlement to the rights issue |
| T-1 | Ex-date | Shares trade ex-rights from this date |
| T+5 | PAL Dispatch | Provisional Allotment Letters sent to shareholders |
| T+6 | Nil-paid Rights Trading Start | First day of dealing in nil-paid rights begins |
| T+10 | Nil-paid Rights Trading End | Last day of dealing in nil-paid rights |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in fully-paid new shares commences |

Notes:
- Trading in nil-paid rights typically lasts for 10 trading days (HK Listing Rules 10.29)
- During nil-paid trading, two markets operate simultaneously - existing shares (ex-rights) and nil-paid rights
- A designated broker is often appointed to facilitate trading in odd lots resulting from the rights issue
- Share certificates for fully-paid shares are typically posted 6 business days after acceptance deadline
- Final timetables must be approved by HKEX before announcement`,

  OPEN_OFFER: `# Trading Arrangements for Open Offer under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-2 | Announcement Date | Last day for trading in shares with entitlement to the open offer |
| T-1 | Ex-date | Shares trade ex-entitlement from this date |
| T+5 | Application Form Dispatch | Application forms sent to qualifying shareholders |
| T+14 | Latest Acceptance Date | Final date for acceptance and payment |
| T+21 | New Shares Listing | Dealing in new shares commences |

Notes:
- Unlike rights issues, there is NO trading in nil-paid rights for open offers
- Only one market exists during the open offer period - existing shares (ex-entitlement)
- Odd lot arrangements should be described in the offering document
- Share certificates for new shares are typically posted 6 business days after acceptance deadline
- Final timetables must be approved by HKEX before announcement`,

  SHARE_CONSOLIDATION: `# Trading Arrangements for Share Consolidation under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement & Circular | Announcement of share consolidation and dispatch of circular |
| T-1 | General Meeting | Shareholders approve the share consolidation |
| T | Effective Date | Last day for trading in existing shares |
| T+1 | Ex-date | First day for trading in consolidated shares |
| T+3 to T+5 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+30 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Share consolidation requires shareholder approval in general meeting
- Existing share certificates are valid for trading only up to last trading day before effective date
- After effective date, trading is only in consolidated shares and board lots
- Parallel trading is typically NOT available for share consolidation/subdivision
- Arrangements must be made for odd lots resulting from the consolidation
- Final timetables must be approved by HKEX before announcement`,

  BOARD_LOT_CHANGE: `# Trading Arrangements for Board Lot Size Change under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement | Announcement of board lot size change |
| T | Effective Date | Free exchange of share certificates begins |
| T+1 | First day of parallel trading | Both old and new board lots can be traded |
| T+21 | Last day of parallel trading | Last day for parallel trading in both board lot sizes |
| T+22 | Exchange of old certificates ends | Deadline for free exchange of share certificates |

Notes:
- Parallel trading arrangements allow trading in both old and new board lots simultaneously
- During parallel trading, two separate stock codes may be used to distinguish the two markets
- A designated broker is typically appointed to match odd lot trades
- Share registrar provides free exchange of share certificates during the specified period
- Final timetables must be approved by HKEX before announcement`,

  COMPANY_NAME_CHANGE: `# Trading Arrangements for Company Name Change under Hong Kong Listing Rules

| Date | Event | Trading Implications |
|------|-------|----------------------|
| T-14 | Announcement & Circular | Announcement of name change and dispatch of circular |
| T-1 | General Meeting | Shareholders approve the name change |
| T+10 | Effective Date | Certificate of incorporation on change of name issued |
| T+14 | Stock Short Name Change Date | Trading under new stock short name begins |
| T+15 | Free Exchange Period Start | Shareholders may submit old share certificates for exchange |
| T+45 | Free Exchange Period End | Deadline for free exchange of share certificates |

Notes:
- Existing share certificates remain valid for trading despite the name change
- Trading continues uninterrupted during the name change process
- The stock code remains unchanged; only the stock short name is updated
- Share registrar provides free exchange of share certificates during the specified period
- CCASS and other settlement systems are updated with the new company name
- Final timetables must be approved by HKEX before announcement`
};

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
      
      // Handle special cases for financial arrangements if response quality is insufficient
      let finalResponse = responseText;
      
      // Check for trading arrangement queries that need specialized handling
      if (isTradingArrangementQuery(params.prompt)) {
        const tradingArrangementType = determineTradingArrangementType(params.prompt);
        
        if (tradingArrangementType && 
            !isTradingArrangementComplete(responseText, tradingArrangementType)) {
          console.log(`Using fallback trading arrangement for ${tradingArrangementType}`);
          finalResponse = getFallbackTradingArrangement(tradingArrangementType, params.prompt);
        }
      }
      // Rights issue timetable special case
      else if (queryType === FINANCIAL_EXPERTISES.RIGHTS_ISSUE && 
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
  
  // First check for trading arrangement related queries
  if (isTradingArrangementQuery(prompt)) {
    const tradingType = determineTradingArrangementType(prompt);
    if (tradingType) return tradingType;
  }
  
  // Prioritize specific Hong Kong financial expertise areas
  if (lowerPrompt.includes('rights issue'))
    return FINANCIAL_EXPERTISES.RIGHTS_ISSUE;
    
  if (lowerPrompt.includes('open offer'))
    return FINANCIAL_EXPERTISES.OPEN_OFFER;
    
  if (lowerPrompt.includes('share consolidation') || 
      lowerPrompt.includes('sub-division') ||
      lowerPrompt.includes('subdivision'))
    return FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION;
    
  if ((lowerPrompt.includes('board lot') || lowerPrompt.includes('lot size')) &&
      lowerPrompt.includes('change'))
    return FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE;
    
  if (lowerPrompt.includes('company name') &&
      (lowerPrompt.includes('change') || lowerPrompt.includes('chinese name')))
    return FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE;
    
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
 * Determine if a query is related to trading arrangements
 */
function isTradingArrangementQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  return lowerPrompt.includes('trading arrangement') || 
         (lowerPrompt.includes('trading') && lowerPrompt.includes('schedule')) ||
         ((lowerPrompt.includes('rights issue') || 
           lowerPrompt.includes('open offer') ||
           lowerPrompt.includes('share consolidation') ||
           lowerPrompt.includes('sub-division') ||
           lowerPrompt.includes('board lot') || 
           lowerPrompt.includes('company name')) && 
           (lowerPrompt.includes('timetable') || 
            lowerPrompt.includes('schedule')));
}

/**
 * Determine the specific type of trading arrangement query
 */
function determineTradingArrangementType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('rights issue'))
    return FINANCIAL_EXPERTISES.RIGHTS_ISSUE;
    
  if (lowerPrompt.includes('open offer'))
    return FINANCIAL_EXPERTISES.OPEN_OFFER;
    
  if (lowerPrompt.includes('share consolidation') || lowerPrompt.includes('sub-division'))
    return FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION;
    
  if ((lowerPrompt.includes('board lot') || lowerPrompt.includes('lot size')))
    return FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE;
    
  if (lowerPrompt.includes('company name') && 
      (lowerPrompt.includes('change') || lowerPrompt.includes('chinese name')))
    return FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE;
    
  return '';
}

/**
 * Get appropriate fallback trading arrangement based on type
 */
function getFallbackTradingArrangement(type: string, prompt: string): string {
  switch (type) {
    case FINANCIAL_EXPERTISES.RIGHTS_ISSUE:
      return TRADING_ARRANGEMENTS.RIGHTS_ISSUE;
      
    case FINANCIAL_EXPERTISES.OPEN_OFFER:
      return TRADING_ARRANGEMENTS.OPEN_OFFER;
      
    case FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION:
      return TRADING_ARRANGEMENTS.SHARE_CONSOLIDATION;
      
    case FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE:
      return TRADING_ARRANGEMENTS.BOARD_LOT_CHANGE;
      
    case FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE:
      return TRADING_ARRANGEMENTS.COMPANY_NAME_CHANGE;
      
    default:
      // If nothing specific found, return a general message with all arrangements
      return `# Hong Kong Trading Arrangements Guide\n\nHere are trading arrangements for various corporate actions:\n\n## Rights Issue\n${TRADING_ARRANGEMENTS.RIGHTS_ISSUE}\n\n## Open Offer\n${TRADING_ARRANGEMENTS.OPEN_OFFER}`;
  }
}

/**
 * Create system prompt tailored to specific financial expertise areas with enhanced trading arrangement knowledge
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
- Address practical considerations on pricing, excess applications, and compensatory arrangements
- For trading arrangements, clearly distinguish between last day for cum-rights trading, ex-date, nil-paid rights trading period, and new share listing date`;

    case FINANCIAL_EXPERTISES.OPEN_OFFER:
      return basePrompt + `For open offer inquiries:
- Explain clearly that unlike rights issues, open offers have no nil-paid rights trading
- Present timetables in a professional, clear tabular format
- Include all key regulatory dates and deadlines from HK Listing Rules
- Specify exact regulatory requirements for each step with rule references
- Include notes on underwriting requirements, connected person implications, and disclosure obligations
- For trading arrangements, clearly specify ex-date and new share listing date`;

    case FINANCIAL_EXPERTISES.SHARE_CONSOLIDATION:
      return basePrompt + `For share consolidation/subdivision inquiries:
- Present timetables in a professional, clear tabular format
- Include all key regulatory dates and deadlines
- Detail the approval process including shareholder approvals
- Address the handling of odd lots resulting from the consolidation/subdivision
- For trading arrangements, clearly distinguish between last trading day for old shares and first trading day for new shares`;

    case FINANCIAL_EXPERTISES.BOARD_LOT_CHANGE:
      return basePrompt + `For board lot size change inquiries:
- Describe parallel trading arrangements with clear dates
- Present timetables in a professional, clear tabular format
- Detail the odd lot arrangements and matching services
- Explain the free exchange period for share certificates
- For trading arrangements, clearly specify when parallel trading begins and ends`;

    case FINANCIAL_EXPERTISES.COMPANY_NAME_CHANGE:
      return basePrompt + `For company name change inquiries:
- Present timetables in a professional, clear tabular format
- Detail the approval process including shareholder approvals
- Explain that existing share certificates remain valid
- Specify when trading under the new stock short name begins
- For trading arrangements, clearly explain the continuity of trading during the name change process`;

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

    default:
      return basePrompt + `Provide comprehensive, technically precise analysis with specific regulatory citations. Format your response professionally with clear structure, headings, and bullet points where appropriate. For any trading arrangements, include detailed timetables with key dates and market implications.`;
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
