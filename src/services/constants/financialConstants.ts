
/**
 * Financial expertise areas for specialized handling
 */
export const FINANCIAL_EXPERTISES = {
  RIGHTS_ISSUE: 'rights_issue',
  OPEN_OFFER: 'open_offer',  // CORPORATE ACTION under Listing Rules (Chapter 7)
  SHARE_CONSOLIDATION: 'share_consolidation',
  BOARD_LOT_CHANGE: 'board_lot_change',
  COMPANY_NAME_CHANGE: 'company_name_change',
  CONNECTED_TRANSACTIONS: 'connected_transaction',
  TAKEOVERS: 'takeovers_code',
  TAKEOVER_OFFER: 'takeover_offer',  // Under Takeovers Code, NOT Listing Rules
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
  'open_offer': 'listing_rules',  // CORPORATE ACTION under Listing Rules (Chapter 7)
  'share_consolidation': 'listing_rules',
  'board_lot_change': 'listing_rules',
  'company_name_change': 'listing_rules',
  'connected_transaction': 'listing_rules',
  'takeovers_code': 'takeovers',
  'takeover_offer': 'takeovers',  // Under Takeovers Code only
  'prospectus': 'listing_rules',
  'disclosure': 'listing_rules',
  'circular': 'listing_rules',
  'waiver': 'listing_rules',
  'listing_rules': 'listing_rules',
  'conversational': 'all',
  'general': 'all'
};

/**
 * Enhanced descriptive comments for regulatory context
 * These descriptions clarify the distinct regulatory frameworks for different types of offers
 */
export const REGULATORY_DESCRIPTIONS = {
  OPEN_OFFER: 'A CORPORATE ACTION under Listing Rules Chapter 7, allowing listed companies to issue new shares to existing shareholders for capital raising',
  TAKEOVER_OFFER: 'An acquisition mechanism governed by the Takeovers Code, involving mandatory or voluntary offers to acquire company shares',
  RIGHTS_ISSUE: 'A capital-raising corporate action under Listing Rules where existing shareholders are given the right to subscribe for new shares',
  WHITEWASH_WAIVER: 'A specific waiver under the Takeovers Code that exempts parties from making a mandatory general offer obligation',
  SHARE_CONSOLIDATION: 'A corporate action under Listing Rules where multiple shares are combined into fewer shares with higher value',
  BOARD_LOT_CHANGE: 'A corporate action under Listing Rules where the standard trading unit (board lot) of shares is changed',
  COMPANY_NAME_CHANGE: 'A corporate action under Listing Rules where a listed company changes its registered name'
};

/**
 * Clear distinctions between regulatory frameworks
 * This helps prevent misclassification between different types of "offers"
 */
export const REGULATORY_FRAMEWORKS = {
  LISTING_RULES: 'Hong Kong Listing Rules - governs listed companies including corporate actions like open offers and rights issues',
  TAKEOVERS_CODE: 'Hong Kong Codes on Takeovers and Mergers - governs acquisitions and takeovers including general offers',
};

/**
 * Framework-specific terminology to avoid confusion
 */
export const FRAMEWORK_TERMINOLOGY = {
  LISTING_RULES: ['open offer', 'rights issue', 'corporate action', 'capital raising', 'chapter 7', 'share consolidation', 'board lot change', 'company name change'],
  TAKEOVERS_CODE: ['general offer', 'takeover offer', 'mandatory offer', 'voluntary offer', 'rule 26']
};

/**
 * Execution process timelines by regulatory framework
 * These reflect the standard execution processes for different types of corporate actions
 */
export const EXECUTION_TIMELINES = {
  LISTING_RULES: {
    PRE_ANNOUNCEMENT: '2-3 days preparation + 2-10 business days HKEX vetting',
    CIRCULAR_PREPARATION: '3-10 days preparation + 5-20 business days HKEX vetting',
    SHAREHOLDER_APPROVAL: 'As required by Listing Rules, typically 14-21 days notice',
    IMPLEMENTATION: 'Varies by corporate action type'
  },
  TAKEOVERS_CODE: {
    PRE_ANNOUNCEMENT: '3 days preparation + 2-10 business days SFC vetting',
    OFFER_DOCUMENT: '3-10 days preparation + 5-20 business days SFC vetting',
    OFFER_TIMELINE: 'As specified in Takeovers Code (e.g., Day 21 first closing, Day 60 unconditional deadline)'
  }
};

/**
 * Regulatory bodies responsible for different frameworks
 */
export const REGULATORY_AUTHORITIES = {
  LISTING_RULES: 'Stock Exchange of Hong Kong Limited (HKEX)',
  TAKEOVERS_CODE: 'Securities and Futures Commission (SFC)'
};

/**
 * Corporate action trading arrangement guides
 * References to specific HKEX guides for different corporate actions
 */
export const CORPORATE_ACTION_GUIDES = {
  RIGHTS_ISSUE: 'Guide on Trading Arrangements for Selected Types of Corporate Actions (Rights Issue)',
  OPEN_OFFER: 'Guide on Trading Arrangements for Selected Types of Corporate Actions (Open Offer)',
  SHARE_CONSOLIDATION: 'Guide on Trading Arrangements for Selected Types of Corporate Actions (Share Consolidation/Sub-division)',
  BOARD_LOT_CHANGE: 'Guide on Trading Arrangements for Selected Types of Corporate Actions (Change in Board Lot Size)',
  COMPANY_NAME_CHANGE: 'Guide on Trading Arrangements for Selected Types of Corporate Actions (Change of Company Name)'
};

/**
 * Corporate action types covered by the trading arrangements guide
 */
export const GUIDE_COVERED_ACTIONS = [
  'rights_issue',
  'open_offer',
  'share_consolidation',
  'board_lot_change',
  'company_name_change'
];

