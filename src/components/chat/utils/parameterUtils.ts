
import { FINANCIAL_QUERY_TYPES } from './queryTypeUtils';

/**
 * Get optimal token setting based on query type and content
 * With adjusted maximum token limit and safety checks
 */
export const getOptimalTokens = (queryType: string, query: string): number => {
  // Use reasonable token limits based on query complexity
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule')) &&
      (query.toLowerCase().includes('detailed') || 
       query.toLowerCase().includes('comprehensive'))) {
    return 8000; // Maximum allowed tokens for complex rights issue queries
  }
  
  // Rights issue general queries including comparison queries
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE) {
    if (query.toLowerCase().includes('difference between') || 
        query.toLowerCase().includes('compare') || 
        query.toLowerCase().includes('versus') || 
        query.toLowerCase().includes('vs')) {
      return 7000; // High token count for comparison queries
    }
    return 6000; // Standard rights issue queries
  }
  
  // Complex query handling for other corporate actions
  if ([
    FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
    FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
    FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE
  ].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 6000; // Complex corporate actions
  }
  
  // Comparison queries
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 6000; // Comparison queries
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
    return 5000; // Explanations
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 4000; // Connected transactions and takeovers
  }
  
  return 3000; // Default token count
};

/**
 * Determine if response needs enhanced token settings
 */
export const needsEnhancedTokenSettings = (queryType: string, query: string): boolean => {
  const complexTopicIndicators = [
    'detailed explanation', 'comprehensive guide', 'full timetable',
    'step by step', 'all requirements', 'complete process', 
    'exhaustive breakdown', 'in-depth analysis'
  ];
  
  // Add specific trading arrangement indicators
  const tradingArrangementIndicators = [
    'trading arrangement', 'timetable', 'schedule', 'ex-date', 'record date',
    'nil-paid rights', 'payment date', 'trading period', 'board lot'
  ];

  const hasComplexIndicator = complexTopicIndicators.some(
    indicator => query.toLowerCase().includes(indicator)
  );
  
  const hasTradingArrangementIndicator = tradingArrangementIndicators.some(
    indicator => query.toLowerCase().includes(indicator)
  );
  
  // Special cases for trading arrangements
  if ([
    FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE,
    FINANCIAL_QUERY_TYPES.OPEN_OFFER,
    FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
    FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
    FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE
  ].includes(queryType) && hasTradingArrangementIndicator) {
    return true;
  }
  
  return hasComplexIndicator;
};

export const getOptimalTemperature = (queryType: string, query: string): number => {
  // For comparison queries, use very low temperature for maximum consistency
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 0.05; // Low temperature for comparisons
  }

  // Rights issue timetable queries need very low temperature for consistency
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.01; // Very low temperature for structured data
  }
  
  if ([FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
       FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
       FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
       FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.05; // Low temperature for consistent structured outputs
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 0.2;
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('analysis')) {
    return 0.3;
  }
  
  if (query.toLowerCase().includes('example') || query.toLowerCase().includes('case study')) {
    return 0.4;
  }
  
  return 0.3;
};

