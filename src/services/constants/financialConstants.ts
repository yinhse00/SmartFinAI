
/**
 * Financial expertise areas for specialized handling
 */
export const FINANCIAL_EXPERTISES = {
  RIGHTS_ISSUE: 'rights_issue',
  OPEN_OFFER: 'open_offer',
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  CONNECTED_TRANSACTIONS: 'connected_transaction',
  TAKEOVERS: 'takeovers_code',
  PROSPECTUS: 'prospectus',
  DISCLOSURE: 'disclosure',
  CIRCULAR: 'circular',
  WAIVER: 'waiver',
  LISTING_RULES: 'listing_rules',
  CONVERSATIONAL: 'conversational', // Add this missing property
  GENERAL: 'general'
};

/**
 * Mapping of query types to document categories
 */
export const QUERY_TYPE_TO_CATEGORY = {
  'rights_issue': 'listing_rules',
  'open_offer': 'listing_rules',
  'share_consolidation': 'listing_rules',
  'board_lot_change': 'listing_rules',
  'company_name_change': 'listing_rules',
  'connected_transaction': 'listing_rules',
  'takeovers_code': 'takeovers',
  'prospectus': 'listing_rules',
  'disclosure': 'listing_rules',
  'circular': 'listing_rules',
  'waiver': 'listing_rules',
  'listing_rules': 'listing_rules',
  'conversational': 'all', // Add mapping for conversational type
  'general': 'all'
};
