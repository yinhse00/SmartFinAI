
import { FINANCIAL_QUERY_TYPES } from './queryTypeUtils';

/**
 * Get optimal token setting based on query type and content
 * With adjusted maximum token limit and safety checks
 */
export const getOptimalTokens = (queryType: string, query: string): number => {
  // Check for explicit trading arrangement query with guide reference requirements
  const isGuideBasedTradingArrangement = 
    [FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE, 
     FINANCIAL_QUERY_TYPES.OPEN_OFFER,
     FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
     FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
     FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) &&
    (query.toLowerCase().includes('timetable') || 
     query.toLowerCase().includes('trading arrangement') || 
     query.toLowerCase().includes('schedule'));
     
  if (isGuideBasedTradingArrangement) {
    console.log("Using enhanced token limits for HKEX guide-based trading arrangement query");
    return 30000; // Increased from previous limits for comprehensive guide compliance
  }
  
  // Rights issue and complex timetable queries now get up to 24000 tokens (3x the previous 8000)
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule')) &&
      (query.toLowerCase().includes('detailed') || 
       query.toLowerCase().includes('comprehensive'))) {
    return 24000; // Increased from 8000
  }
  
  // Rights issue comparison queries now get up to 21000 tokens
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE) {
    if (query.toLowerCase().includes('difference between') || 
        query.toLowerCase().includes('compare') || 
        query.toLowerCase().includes('versus') || 
        query.toLowerCase().includes('vs')) {
      return 21000; // Increased from 7000
    }
    return 18000; // Increased from 6000
  }
  
  // Complex corporate actions now get up to 18000 tokens
  if ([
    FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
    FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
    FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE
  ].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 18000; // Increased from 6000
  }
  
  // Comparison queries now get up to 18000 tokens
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 18000; // Increased from 6000
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
    return 15000; // Increased from 5000
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 12000; // Increased from 4000
  }
  
  return 9000; // Increased from 3000
};

/**
 * Determine if response needs enhanced token settings
 */
export const needsEnhancedTokenSettings = (queryType: string, query: string): boolean => {
  // Check for trading arrangement guide compliance queries
  const isGuideCoveredAction = [
    FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE,
    FINANCIAL_QUERY_TYPES.OPEN_OFFER,
    FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
    FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
    FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE
  ].includes(queryType);
  
  const isTradingArrangementQuery = 
    query.toLowerCase().includes('timetable') || 
    query.toLowerCase().includes('trading arrangement') || 
    query.toLowerCase().includes('trading schedule');
  
  if (isGuideCoveredAction && isTradingArrangementQuery) {
    return true;
  }

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
  // For guide-based trading arrangement queries, use extremely low temperature
  const isGuideBasedTradingArrangement = 
    [FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE, 
     FINANCIAL_QUERY_TYPES.OPEN_OFFER,
     FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
     FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
     FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) &&
    (query.toLowerCase().includes('timetable') || 
     query.toLowerCase().includes('trading arrangement'));
     
  if (isGuideBasedTradingArrangement) {
    return 0.01; // Very low temperature for strict guide compliance
  }

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
