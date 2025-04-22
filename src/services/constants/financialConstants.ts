
/**
 * Financial expertise areas for specialized handling
 */
export const FINANCIAL_EXPERTISES = {
  RIGHTS_ISSUE: 'rights_issue',
  OPEN_OFFER: 'open_offer', // Governed by Listing Rules (Chapter 7), for capital raising
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  CONNECTED_TRANSACTIONS: 'connected_transaction',
  TAKEOVERS: 'takeovers_code',
  TAKEOVER_OFFER: 'takeover_offer', // Governed by Takeovers Code, for company acquisition
  PROSPECTUS: 'prospectus',
  DISCLOSURE: 'disclosure',
  CIRCULAR: 'circular',
  WAIVER: 'waiver',
  LISTING_RULES: 'listing_rules',
  CONVERSATIONAL: 'conversational',
  GENERAL: 'general'
};

/**
 * Mapping of query types to document categories with enhanced specificity
 */
export const QUERY_TYPE_TO_CATEGORY = {
  'rights_issue': 'listing_rules',
  'open_offer': 'listing_rules',  // Explicitly under Listing Rules (Chapter 7)
  'share_consolidation': 'listing_rules',
  'board_lot_change': 'listing_rules',
  'company_name_change': 'listing_rules',
  'connected_transaction': 'listing_rules',
  'takeovers_code': 'takeovers',
  'takeover_offer': 'takeovers',  // Explicitly under Takeovers Code
  'prospectus': 'listing_rules',
  'disclosure': 'listing_rules',
  'circular': 'listing_rules',
  'waiver': 'listing_rules',
  'listing_rules': 'listing_rules',
  'conversational': 'all',
  'general': 'all'
};

// Enhanced descriptive comments for regulatory context
export const REGULATORY_DESCRIPTIONS = {
  OPEN_OFFER: 'A capital-raising mechanism under Listing Rules Chapter 7, allowing listed companies to issue new shares to existing shareholders',
  TAKEOVER_OFFER: 'An acquisition mechanism governed by the Takeovers Code, involving mandatory or voluntary offers to acquire company shares'
};
