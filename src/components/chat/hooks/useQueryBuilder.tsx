
export const useQueryBuilder = () => {
  const buildResponseParams = (
    queryText: string, 
    temperature: number, 
    maxTokens: number
  ) => {
    // Check if this is a simple conversational query
    const isSimpleQuery = isSimpleConversationalQuery(queryText);
    
    // Check if this is a trading arrangement query requiring guide reference
    const isTradingArrangementQuery = checkForTradingArrangementQuery(queryText);
    
    // For simple queries, don't add as much enhancement
    let enhancedQuery = isSimpleQuery
      ? `${queryText.trim()}. Please provide a complete and concise response.`
      : `${queryText.trim()}. Please ensure to include a clear conclusion or summary section at the end of your response that ties everything together. Your response must be complete and well-structured.`;
    
    // Add specific instruction for trading arrangement queries
    if (isTradingArrangementQuery) {
      enhancedQuery += " IMPORTANT: You MUST follow the HKEX Guide on Trading Arrangements for Selected Types of Corporate Actions. Include explicit reference to this guide in your response. Include all required elements from the guide including proper timetable format and all key dates.";
    }
    
    const responseParams: any = {
      prompt: isSimpleQuery ? enhancedQuery : enhanceQueryWithKeyTerms(enhancedQuery),
      temperature: temperature,
      maxTokens: maxTokens
    };
    
    return responseParams;
  };

  const enhanceQueryWithKeyTerms = (queryText: string): string => {
    const normalizedQuery = queryText.toLowerCase();
    
    // Enhanced detection for trading arrangement queries
    if (isTradeArrangementQuery(normalizedQuery)) {
      return enhanceWithTradeArrangementInstructions(queryText);
    }
    
    // For prospectus/IPO related queries, ensure we get complete responses
    if (normalizedQuery.includes('ipo') || normalizedQuery.includes('prospectus') || 
        normalizedQuery.includes('listing')) {
      let enhancedQuery = queryText;
      
      // Add specific requirements for structure and completeness
      if (!normalizedQuery.includes('conclusion') && !normalizedQuery.includes('summary')) {
        enhancedQuery += " Please structure your response with: 1) A clear explanation of the requirements, 2) Analysis of the specific situation, 3) A conclusion that directly addresses whether the requirements are met. Ensure completeness without truncation.";
      }
      
      // Ensure key aspects are covered for management continuity
      if (normalizedQuery.includes('management continuity')) {
        enhancedQuery += " In your response, address: the minimum required period of management continuity, the acceptable number of management members, and specifically conclude whether the situation meets the requirements.";
      }
      
      return enhancedQuery;
    }
    
    // For all other queries, ensure we get complete responses
    return `${queryText} Please provide a comprehensive response with a clear conclusion section that summarizes all key points.`;
  };
  
  /**
   * Check if this is a trading arrangement query
   */
  const checkForTradingArrangementQuery = (query: string): boolean => {
    const normalizedQuery = query.toLowerCase();
    
    // Check for specific corporate actions that follow the HKEX guide
    const hasCorporateAction = 
      normalizedQuery.includes('rights issue') ||
      normalizedQuery.includes('open offer') ||
      normalizedQuery.includes('share consolidation') ||
      normalizedQuery.includes('sub-division') ||
      normalizedQuery.includes('board lot') ||
      normalizedQuery.includes('company name change');
    
    // Check for timetable/trading arrangement terms
    const hasTradingTerms =
      normalizedQuery.includes('timetable') ||
      normalizedQuery.includes('trading arrangement') ||
      normalizedQuery.includes('trading schedule') ||
      normalizedQuery.includes('trading period');
    
    return hasCorporateAction && hasTradingTerms;
  };
  
  /**
   * Check if query is about trading arrangements
   */
  const isTradeArrangementQuery = (normalizedQuery: string): boolean => {
    // Check for guide-covered corporate actions
    const corporateActionTypes = ['rights issue', 'open offer', 'share consolidation', 
                                'sub-division', 'board lot', 'company name'];
    
    const hasCorporateActionType = corporateActionTypes.some(type => 
      normalizedQuery.includes(type)
    );
    
    // Check for timetable/trading arrangement terms
    const hasTradingTerm = normalizedQuery.includes('timetable') || 
                          normalizedQuery.includes('trading arrangement') ||
                          normalizedQuery.includes('schedule');
    
    return hasCorporateActionType && hasTradingTerm;
  };
  
  /**
   * Enhance query with special instructions for trading arrangements
   */
  const enhanceWithTradeArrangementInstructions = (query: string): string => {
    let enhancedQuery = query;
    
    // Add specific guide reference requirement
    enhancedQuery += " IMPORTANT INSTRUCTION: Your response MUST follow the HKEX Guide on Trading Arrangements for Selected Types of Corporate Actions. Include a reference to this guide in your response. Your timetable MUST include all key dates in proper table format as specified in the guide.";
    
    // Add corporate action specific requirements
    if (query.toLowerCase().includes('rights issue')) {
      enhancedQuery += " For rights issues, include: ex-rights date, nil-paid rights trading period, record date, latest time for acceptance, and payment date.";
    } else if (query.toLowerCase().includes('open offer')) {
      enhancedQuery += " For open offers, specifically clarify that unlike rights issues, open offers DO NOT have tradable nil-paid rights. Include ex-entitlement date, record date, and acceptance period.";
    } else if (query.toLowerCase().includes('share consolidation') || query.toLowerCase().includes('sub-division')) {
      enhancedQuery += " Include parallel trading period and free exchange period in your timetable.";
    }
    
    enhancedQuery += " Present the timetable in a clear table format showing each date and corresponding event.";
    
    return enhancedQuery;
  };
  
  return {
    buildResponseParams
  };
};

// Import the isSimpleConversationalQuery function
import { isSimpleConversationalQuery } from '@/services/financial/expertiseDetection';
