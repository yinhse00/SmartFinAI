
// ECM Platform Type Definitions

export interface EcmIssuer {
  id: string;
  company_name: string;
  stock_code?: string;
  hkex_listing_date?: string;
  market_cap?: number;
  sector?: string;
  industry?: string;
  financial_year_end?: string;
  contact_email?: string;
  contact_phone?: string;
  esg_rating?: string;
  esg_score?: number;
  last_fundraising_date?: string;
  total_funds_raised?: number;
  regulatory_status: string;
  compliance_risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface EcmInvestor {
  id: string;
  investor_name: string;
  investor_type: 'institutional' | 'retail' | 'hnw' | 'sovereign' | 'pension';
  regulatory_classification?: 'professional' | 'retail' | 'connected';
  aum_range?: string;
  geographic_focus?: string[];
  sector_preferences?: string[];
  deal_size_min?: number;
  deal_size_max?: number;
  esg_focused: boolean;
  stock_connect_eligible: boolean;
  contact_email?: string;
  contact_phone?: string;
  kyc_status: string;
  last_activity_date?: string;
  total_investments_count: number;
  total_investment_amount: number;
  risk_appetite: 'conservative' | 'moderate' | 'aggressive';
  created_at: string;
  updated_at: string;
}

export interface EcmDeal {
  id: string;
  issuer_id?: string;
  deal_name: string;
  deal_type: 'rights_issue' | 'private_placement' | 'convertible_bond' | 'follow_on' | 'block_trade';
  deal_status: 'pipeline' | 'preparation' | 'marketing' | 'execution' | 'completed' | 'cancelled';
  target_amount?: number;
  final_amount?: number;
  currency: string;
  pricing_method?: 'fixed' | 'book_building' | 'market_price';
  launch_date?: string;
  completion_date?: string;
  book_runner?: string;
  co_managers?: string[];
  use_of_proceeds?: string;
  esg_classification?: 'green' | 'social' | 'sustainability' | 'conventional';
  regulatory_approvals_required?: string[];
  regulatory_status: string;
  market_conditions_score: number;
  execution_complexity_score: number;
  investor_interest_level: string;
  created_at: string;
  updated_at: string;
}

export interface EcmInvestorMatch {
  id: string;
  deal_id?: string;
  investor_id?: string;
  match_score?: number;
  compatibility_factors?: string[];
  investment_interest_level?: 'high' | 'medium' | 'low' | 'none';
  indicative_amount?: number;
  status: 'identified' | 'contacted' | 'interested' | 'committed' | 'declined';
  contact_date?: string;
  response_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EcmMarketData {
  id: string;
  data_date: string;
  hang_seng_index?: number;
  hang_seng_tech_index?: number;
  market_volatility?: number;
  stock_connect_northbound_flow?: number;
  stock_connect_southbound_flow?: number;
  ipo_activity_count: number;
  secondary_fundraising_count: number;
  average_deal_size?: number;
  market_sentiment?: 'bullish' | 'neutral' | 'bearish';
  regulatory_environment_score: number;
  created_at: string;
}

export interface EcmDealDocument {
  id: string;
  deal_id?: string;
  document_type: string;
  document_name: string;
  document_status: 'draft' | 'review' | 'approved' | 'filed';
  file_url?: string;
  file_path?: string;
  version: number;
  created_by?: string;
  approved_by?: string;
  approval_date?: string;
  filing_reference?: string;
  regulatory_filing_status?: string;
  created_at: string;
  updated_at: string;
}

export interface DealStructuringRequest {
  issuer_id: string;
  funding_amount: number;
  currency?: string;
  use_of_proceeds: string;
  timeline?: string;
  esg_requirements?: boolean;
  investor_preferences?: string[];
  regulatory_constraints?: string[];
}

export interface DealStructuringRecommendation {
  recommended_structure: string;
  deal_type: EcmDeal['deal_type'];
  pricing_strategy: string;
  timeline_estimate: string;
  regulatory_requirements: string[];
  market_conditions_analysis: string;
  risk_factors: string[];
  investor_targeting_strategy: string;
  esg_considerations?: string;
  confidence_score: number;
}

export interface InvestorMatchingRequest {
  deal_id: string;
  deal_type: EcmDeal['deal_type'];
  deal_size: number;
  sector?: string;
  esg_focused?: boolean;
  geographic_preferences?: string[];
}

export interface InvestorMatchingResult {
  investor: EcmInvestor;
  match_score: number;
  compatibility_factors: string[];
  recommended_allocation?: number;
  contact_priority: 'high' | 'medium' | 'low';
  engagement_strategy: string;
}
