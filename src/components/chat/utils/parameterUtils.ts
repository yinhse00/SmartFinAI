
import { FINANCIAL_QUERY_TYPES } from './queryTypeUtils';

/**
 * Get optimal temperature setting based on query type and content
 */
export const getOptimalTemperature = (queryType: string, query: string): number => {
  // Rights issue timetable queries need very low temperature for consistency
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 0.01; // Even lower temperature for maximum consistency with structured data
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

/**
 * Get optimal token setting based on query type and content
 */
export const getOptimalTokens = (queryType: string, query: string): number => {
  // Rights issue timetable queries need more tokens to complete the response
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 6000; // Significantly increased for complete timetables without truncation
  }
  
  // Special handling for date-specific rights issue timetables
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      query.toLowerCase().includes('timetable') &&
      (query.toLowerCase().includes('june') || 
       query.toLowerCase().includes('july') || 
       query.toLowerCase().includes('jan'))) {
    return 8000; // Maximum tokens for date-specific timetables
  }
  
  if ([FINANCIAL_QUERY_TYPES.OPEN_OFFER, 
       FINANCIAL_QUERY_TYPES.SHARE_CONSOLIDATION,
       FINANCIAL_QUERY_TYPES.BOARD_LOT_CHANGE].includes(queryType) && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading arrangement') || 
       query.toLowerCase().includes('schedule'))) {
    return 4000; // Increased for other trading arrangements
  }
  
  if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('detail')) {
    return 3500; // Increased for explanations
  }
  
  if ([FINANCIAL_QUERY_TYPES.CONNECTED_TRANSACTION, FINANCIAL_QUERY_TYPES.TAKEOVERS].includes(queryType)) {
    return 3000; // Increased for complex topics
  }
  
  return 2500; // Increased default
};

/**
 * Determine if response needs enhanced token settings
 * (New helper function to detect complex queries)
 */
export const needsEnhancedTokenSettings = (queryType: string, query: string): boolean => {
  // Check for specific complex financial scenarios
  const complexTopicIndicators = [
    'detailed explanation', 'comprehensive guide', 'full timetable',
    'step by step', 'all requirements', 'complete process'
  ];
  
  // Check if query mentions any complex indicators
  const hasComplexIndicator = complexTopicIndicators.some(
    indicator => query.toLowerCase().includes(indicator)
  );
  
  // Always use enhanced settings for trading arrangements
  if (queryType === FINANCIAL_QUERY_TYPES.RIGHTS_ISSUE && 
      (query.toLowerCase().includes('timetable') || 
       query.toLowerCase().includes('trading'))) {
    return true;
  }
  
  return hasComplexIndicator;
};
