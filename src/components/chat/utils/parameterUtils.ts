
import { FINANCIAL_QUERY_TYPES } from './queryTypeUtils';

/**
 * Get optimal token setting based on query type and content
 * With adjusted maximum token limit and safety checks
 */
export const getOptimalTokens = (queryType: string, query: string): number => {
  // Extremely complex rights issue timetables with specific dates
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule')) &&
      (query.toLowerCase().includes('detailed') || 
       query.toLowerCase().includes('comprehensive'))) {
    return 2000000; // Doubled from 1,000,000 to 2,000,000 for extremely detailed queries
  }
  
  // Rights issue general queries including comparison queries (difference between, vs, etc)
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE) {
    if (query.toLowerCase().includes('difference between') || 
        query.toLowerCase().includes('compare') || 
        query.toLowerCase().includes('versus') || 
        query.toLowerCase().includes('vs')) {
      return 1500000; // Increased from 800,000 to 1,500,000 for comparison queries
    }
    return 1200000; // Doubled from 600,000 to 1,200,000 for all rights issue queries
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
    return 1000000; // Doubled from 500,000 to 1,000,000 for trading arrangements
  }
  
  // Comparison queries (like "what is the difference between X and Y")
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 1000000; // Doubled from 500,000 to 1,000,000 for comparison queries
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
    return 600000; // Doubled from 300,000 to 600,000 for explanations
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 400000; // Doubled from 200,000 to 400,000 for complex topics
  }
  
  return 300000; // Doubled default tokens from 150,000 to 300,000
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
    return 0.05; // Reduced from 0.1 to 0.05 for maximum precision in comparisons
  }

  // Rights issue timetable queries need very low temperature for consistency
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.01; // Keep existing very low temperature for maximum consistency with structured data
  }
  
  if ([FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
       FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
       FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
       FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.05; // Lower temperature for consistent structured outputs
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
