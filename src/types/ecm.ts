
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
  investor_type: string; // Allow any string from database
  regulatory_classification?: string;
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
  risk_appetite: string;
  created_at: string;
  updated_at: string;
}

export interface EcmDeal {
  id: string;
  issuer_id?: string;
  deal_name: string;
  deal_type: string; // Allow any string from database
  deal_status: string;
  target_amount?: number;
  final_amount?: number;
  currency: string;
  pricing_method?: string;
  launch_date?: string;
  completion_date?: string;
  book_runner?: string;
  co_managers?: string[];
  use_of_proceeds?: string;
  esg_classification?: string;
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
  investment_interest_level?: string; // Allow any string from database
  indicative_amount?: number;
  status: string;
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
  market_sentiment?: string; // Allow any string from database
  regulatory_environment_score: number;
  created_at: string;
}

export interface EcmDealDocument {
  id: string;
  deal_id?: string;
  document_type: string;
  document_name: string;
  document_status: string;
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
  deal_type: string;
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
  deal_type: string;
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
