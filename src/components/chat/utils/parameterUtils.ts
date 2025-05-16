
import { FINANCIAL_QUERY_TYPES } from './queryTypeUtils';

/**
 * Get optimal token setting based on query type and content
 * With enhanced maximum token limit for quality responses
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
    return 30000; // Maintained at high level for comprehensive guide compliance
  }
  
  // Rights issue and complex timetable queries get high token limits
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule')) &&
      (query.toLowerCase().includes('detailed') || 
       query.toLowerCase().includes('comprehensive'))) {
    return 24000; // Maintained at high level
  }
  
  // Rights issue comparison queries 
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE) {
    if (query.toLowerCase().includes('difference between') || 
        query.toLowerCase().includes('compare') || 
        query.toLowerCase().includes('versus') || 
        query.toLowerCase().includes('vs')) {
      return 21000; // Maintained at high level
    }
    return 18000; // Maintained at high level
  }
  
  // Complex corporate actions
  if ([
    FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
    FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
    FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE
  ].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 18000; // Maintained at high level
  }
  
  // Comparison queries
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 18000; // Maintained at high level
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
    return 15000; // Maintained at high level
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 12000; // Maintained at high level
  }
  
  return 9000; // Maintained at high level
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
  // For guide-based trading arrangement queries, use lower temperature
  const isGuideBasedTradingArrangement = 
    [FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE, 
     FINANCIAL_QUERY_TYPES.OPEN_OFFER,
     FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
     FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
     FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) &&
    (query.toLowerCase().includes('timetable') || 
     query.toLowerCase().includes('trading arrangement'));
     
  if (isGuideBasedTradingArrangement) {
    return 0.3; // Lower temperature for guide compliance
  }

  // For comparison queries, use balanced temperature
  if (query.toLowerCase().includes('difference between') || 
      query.toLowerCase().includes('compare') || 
      query.toLowerCase().includes('versus') || 
      query.toLowerCase().includes('vs')) {
    return 0.4; // Balanced temperature for comparisons
  }

  // Rights issue timetable queries need lower temperature for consistency
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.3; // Lower temperature for structured data
  }
  
  if ([FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
       FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
       FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE,
       FINANCIAL_QUERY_TYPES.COMPANY_NAME_CHANGE].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.3; // Lower temperature for consistent structured outputs
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 0.4; // Balanced temperature
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('analysis')) {
    return 0.5; // Medium temperature for explanations
  }
  
  if (query.toLowerCase().includes('example') || query.toLowerCase().includes('case study')) {
    return 0.6; // Higher temperature for examples
  }
  
  return 0.5; // Balanced default temperature
};
