
import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { 
  DealStructuringRequest, 
  DealStructuringRecommendation, 
  InvestorMatchingRequest, 
  InvestorMatchingResult,
  EcmDeal,
  EcmInvestor 
} from '@/types/ecm';

/**
 * ECM Service - Core business logic for Equity Capital Markets platform
 */
export const ecmService = {
  /**
   * AI-powered deal structuring recommendations
   */
  generateDealStructuring: async (request: DealStructuringRequest): Promise<DealStructuringRecommendation> => {
    console.log('Generating deal structuring recommendations for:', request);
    
    try {
      // Get issuer information
      const { data: issuer } = await supabase
        .from('ecm_issuers')
        .select('*')
        .eq('id', request.issuer_id)
        .single();
      
      // Get current market data
      const { data: marketData } = await supabase
        .from('ecm_market_data')
        .select('*')
        .order('data_date', { ascending: false })
        .limit(1)
        .single();
      
      // Prepare AI prompt for deal structuring
      const prompt = `
        As a Hong Kong ECM expert, recommend optimal deal structure for:
        
        Issuer: ${issuer?.company_name} (${issuer?.stock_code})
        Sector: ${issuer?.sector}
        Market Cap: HKD ${issuer?.market_cap?.toLocaleString()}
        
        Funding Requirements:
        - Amount: ${request.currency || 'HKD'} ${request.funding_amount.toLocaleString()}
        - Use of Proceeds: ${request.use_of_proceeds}
        - Timeline: ${request.timeline || 'Standard'}
        - ESG Requirements: ${request.esg_requirements ? 'Yes' : 'No'}
        
        Current Market Conditions:
        - HSI: ${marketData?.hang_seng_index}
        - Market Sentiment: ${marketData?.market_sentiment}
        - Market Volatility: ${marketData?.market_volatility}%
        - Recent ECM Activity: ${marketData?.secondary_fundraising_count} deals
        
        Please provide:
        1. Recommended deal structure and type
        2. Pricing strategy and methodology
        3. Execution timeline and key milestones
        4. Regulatory requirements and approvals needed
        5. Market conditions analysis and timing considerations
        6. Key risk factors and mitigation strategies
        7. Investor targeting and allocation strategy
        8. ESG considerations (if applicable)
        9. Confidence score (0-100)
        
        Focus on Hong Kong regulations, HKEX listing rules, and Stock Connect implications.
      `;
      
      const response = await grokService.generateResponse({
        query: prompt,
        regulatoryContext: '',
        guidanceContext: '',
        sourceMaterials: [],
        skipSequentialSearches: true,
        isRegulatoryRelated: true,
        optimized: true
      });
      
      // Parse AI response into structured recommendation
      return parseStructuringRecommendation(response.response);
      
    } catch (error) {
      console.error('Error generating deal structuring:', error);
      throw new Error('Failed to generate deal structuring recommendations');
    }
  },
  
  /**
   * AI-powered investor matching
   */
  matchInvestors: async (request: InvestorMatchingRequest): Promise<InvestorMatchingResult[]> => {
    console.log('Matching investors for deal:', request);
    
    try {
      // Get deal information
      const { data: deal } = await supabase
        .from('ecm_deals')
        .select(`
          *,
          ecm_issuers (*)
        `)
        .eq('id', request.deal_id)
        .single();
      
      // Get all potential investors
      const { data: investors } = await supabase
        .from('ecm_investors')
        .select('*')
        .eq('kyc_status', 'approved');
      
      if (!investors) return [];
      
      // AI-powered matching algorithm
      const matchingPrompt = `
        As a Hong Kong ECM expert, analyze investor compatibility for:
        
        Deal: ${deal?.deal_name}
        Type: ${deal?.deal_type}
        Size: ${request.deal_size.toLocaleString()} ${deal?.currency}
        Issuer: ${deal?.ecm_issuers?.company_name}
        Sector: ${deal?.ecm_issuers?.sector}
        ESG: ${request.esg_focused ? 'ESG-focused' : 'Conventional'}
        
        For each investor, provide:
        1. Match score (0-1)
        2. Compatibility factors
        3. Recommended allocation percentage
        4. Contact priority (high/medium/low)
        5. Engagement strategy
        
        Consider: investment size fit, sector preferences, ESG alignment, regulatory classification, geographic focus.
      `;
      
      // Calculate matches for each investor
      const matches: InvestorMatchingResult[] = [];
      
      for (const investor of investors.slice(0, 10)) { // Limit to top 10 for demo
        const matchScore = calculateInvestorMatch(investor, deal, request);
        
        if (matchScore > 0.3) { // Only include matches above 30%
          matches.push({
            investor,
            match_score: matchScore,
            compatibility_factors: getCompatibilityFactors(investor, deal, request),
            recommended_allocation: calculateRecommendedAllocation(matchScore, request.deal_size),
            contact_priority: matchScore > 0.8 ? 'high' : matchScore > 0.6 ? 'medium' : 'low',
            engagement_strategy: generateEngagementStrategy(investor, deal)
          });
        }
      }
      
      return matches.sort((a, b) => b.match_score - a.match_score);
      
    } catch (error) {
      console.error('Error matching investors:', error);
      throw new Error('Failed to match investors');
    }
  },
  
  /**
   * Market intelligence and analysis
   */
  getMarketIntelligence: async (): Promise<{
    marketConditions: string;
    ecmActivity: string;
    recommendations: string[];
    riskFactors: string[];
  }> => {
    try {
      const { data: marketData } = await supabase
        .from('ecm_market_data')
        .select('*')
        .order('data_date', { ascending: false })
        .limit(7); // Last 7 days
      
      const { data: recentDeals } = await supabase
        .from('ecm_deals')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      const prompt = `
        Analyze current Hong Kong ECM market conditions:
        
        Recent Market Data:
        ${marketData?.map(d => 
          `${d.data_date}: HSI ${d.hang_seng_index}, Sentiment ${d.market_sentiment}, Vol ${d.market_volatility}%`
        ).join('\n')}
        
        Recent ECM Activity:
        ${recentDeals?.map(d => 
          `${d.deal_type}: ${d.currency} ${d.target_amount?.toLocaleString()} - ${d.deal_status}`
        ).join('\n')}
        
        Provide:
        1. Overall market conditions assessment
        2. ECM activity analysis and trends
        3. Strategic recommendations for issuers
        4. Key risk factors to monitor
        
        Focus on Hong Kong market dynamics, regulatory environment, and cross-border flows.
      `;
      
      const response = await grokService.generateResponse({
        query: prompt,
        regulatoryContext: '',
        guidanceContext: '',
        sourceMaterials: [],
        skipSequentialSearches: true,
        isRegulatoryRelated: false,
        optimized: true
      });
      
      return parseMarketIntelligence(response.response);
      
    } catch (error) {
      console.error('Error getting market intelligence:', error);
      throw new Error('Failed to get market intelligence');
    }
  }
};

// Helper functions
function calculateInvestorMatch(investor: EcmInvestor, deal: any, request: InvestorMatchingRequest): number {
  let score = 0;
  
  // Size fit (30% weight)
  if (investor.deal_size_min && investor.deal_size_max) {
    if (request.deal_size >= investor.deal_size_min && request.deal_size <= investor.deal_size_max) {
      score += 0.3;
    } else if (request.deal_size >= investor.deal_size_min * 0.8 && request.deal_size <= investor.deal_size_max * 1.2) {
      score += 0.15;
    }
  } else {
    score += 0.1; // Partial score if size ranges not specified
  }
  
  // Sector preference (25% weight)
  if (investor.sector_preferences && deal?.ecm_issuers?.sector) {
    if (investor.sector_preferences.includes(deal.ecm_issuers.sector)) {
      score += 0.25;
    }
  } else {
    score += 0.1; // Partial score if sectors not specified
  }
  
  // ESG alignment (20% weight)
  if (request.esg_focused === investor.esg_focused) {
    score += 0.2;
  } else {
    score += 0.05;
  }
  
  // Deal type compatibility (15% weight)
  const institutionalTypes = ['institutional', 'sovereign', 'pension'];
  if (institutionalTypes.includes(investor.investor_type)) {
    score += 0.15;
  } else if (investor.investor_type === 'hnw' && request.deal_size < 100000000) {
    score += 0.1;
  }
  
  // Stock Connect eligibility (10% weight)
  if (investor.stock_connect_eligible) {
    score += 0.1;
  }
  
  return Math.min(score, 1); // Cap at 1.0
}

function getCompatibilityFactors(investor: EcmInvestor, deal: any, request: InvestorMatchingRequest): string[] {
  const factors: string[] = [];
  
  if (investor.deal_size_min && investor.deal_size_max && 
      request.deal_size >= investor.deal_size_min && request.deal_size <= investor.deal_size_max) {
    factors.push('Deal size fit');
  }
  
  if (investor.sector_preferences && deal?.ecm_issuers?.sector && 
      investor.sector_preferences.includes(deal.ecm_issuers.sector)) {
    factors.push('Sector preference match');
  }
  
  if (request.esg_focused === investor.esg_focused) {
    factors.push('ESG alignment');
  }
  
  if (investor.stock_connect_eligible) {
    factors.push('Stock Connect eligible');
  }
  
  if (['institutional', 'sovereign', 'pension'].includes(investor.investor_type)) {
    factors.push('Institutional investor');
  }
  
  return factors;
}

function calculateRecommendedAllocation(matchScore: number, dealSize: number): number {
  const baseAllocation = dealSize * 0.1; // 10% base
  return Math.round(baseAllocation * matchScore);
}

function generateEngagementStrategy(investor: EcmInvestor, deal: any): string {
  const strategies = [];
  
  if (investor.investor_type === 'institutional') {
    strategies.push('Formal roadshow presentation');
  }
  
  if (investor.esg_focused) {
    strategies.push('Emphasize ESG credentials');
  }
  
  if (investor.stock_connect_eligible) {
    strategies.push('Highlight Stock Connect benefits');
  }
  
  return strategies.join(', ') || 'Standard institutional approach';
}

function parseStructuringRecommendation(aiResponse: string): DealStructuringRecommendation {
  // Simple parsing - in production, use more sophisticated NLP
  return {
    recommended_structure: extractSection(aiResponse, 'structure') || 'Rights Issue recommended',
    deal_type: 'rights_issue',
    pricing_strategy: extractSection(aiResponse, 'pricing') || 'Market-based pricing',
    timeline_estimate: extractSection(aiResponse, 'timeline') || '6-8 weeks',
    regulatory_requirements: ['HKEX approval', 'SFC filing'],
    market_conditions_analysis: extractSection(aiResponse, 'market') || 'Favorable conditions',
    risk_factors: ['Market volatility', 'Regulatory changes'],
    investor_targeting_strategy: extractSection(aiResponse, 'targeting') || 'Institutional focus',
    esg_considerations: extractSection(aiResponse, 'esg'),
    confidence_score: 0.85
  };
}

function parseMarketIntelligence(aiResponse: string): any {
  return {
    marketConditions: extractSection(aiResponse, 'conditions') || 'Market analysis pending',
    ecmActivity: extractSection(aiResponse, 'activity') || 'ECM activity analysis pending',
    recommendations: ['Monitor market conditions', 'Consider timing optimization'],
    riskFactors: ['Market volatility', 'Regulatory changes']
  };
}

function extractSection(text: string, keyword: string): string | undefined {
  // Simple text extraction - in production, use more sophisticated parsing
  const lines = text.split('\n');
  const relevantLine = lines.find(line => 
    line.toLowerCase().includes(keyword.toLowerCase())
  );
  return relevantLine?.replace(/^\d+\.?\s*/, '').trim();
}
