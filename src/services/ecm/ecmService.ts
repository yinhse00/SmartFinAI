
import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { 
  EcmIssuer, 
  EcmInvestor, 
  EcmDeal, 
  DealStructuringRequest, 
  DealStructuringRecommendation,
  InvestorMatchingRequest,
  InvestorMatchingResult
} from '@/types/ecm';

class EcmService {
  
  /**
   * Get market intelligence and current conditions
   */
  async getMarketIntelligence() {
    try {
      const marketPrompt = `
        Provide current Hong Kong equity capital markets intelligence including:
        1. Market sentiment and conditions
        2. ECM activity levels
        3. Key recommendations for issuers
        4. Current risk factors
        
        Return as structured analysis focusing on Hong Kong secondary fundraising market.
      `;

      const response = await grokService.generateResponse({
        prompt: marketPrompt,
        temperature: 0.3,
        metadata: {
          queryType: 'market_intelligence'
        }
      });

      // Parse the response into structured format
      const content = response.text || '';
      
      return {
        marketConditions: this.extractSection(content, 'market sentiment') || 'Neutral market conditions',
        ecmActivity: this.extractSection(content, 'ECM activity') || 'Moderate activity levels',
        recommendations: this.extractRecommendations(content),
        riskFactors: this.extractRiskFactors(content),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting market intelligence:', error);
      return {
        marketConditions: 'Unable to retrieve current market conditions',
        ecmActivity: 'Market data temporarily unavailable',
        recommendations: ['Monitor market conditions', 'Consider timing flexibility'],
        riskFactors: ['Market volatility', 'Regulatory changes'],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Structure a deal based on requirements
   */
  async structureDeal(request: DealStructuringRequest): Promise<DealStructuringRecommendation> {
    try {
      // Get issuer information
      const { data: issuer } = await supabase
        .from('ecm_issuers')
        .select('*')
        .eq('id', request.issuer_id)
        .single();

      const structuringPrompt = `
        As a Hong Kong ECM expert, structure an optimal deal for:
        
        Company: ${issuer?.company_name || 'Listed Company'}
        Sector: ${issuer?.sector || 'Not specified'}
        Funding Amount: ${request.currency || 'HKD'} ${request.funding_amount.toLocaleString()}
        Use of Proceeds: ${request.use_of_proceeds}
        Timeline: ${request.timeline || 'Standard'}
        ESG Requirements: ${request.esg_requirements ? 'Yes' : 'No'}
        
        Provide comprehensive deal structuring recommendation including:
        1. Optimal deal structure and type
        2. Pricing strategy and methodology
        3. Execution timeline with milestones
        4. Regulatory requirements and approvals
        5. Market conditions analysis
        6. Risk factors and mitigation
        7. Investor targeting strategy
        8. ESG considerations if applicable
        
        Focus on Hong Kong market specifics and regulatory compliance.
      `;

      const response = await grokService.generateResponse({
        prompt: structuringPrompt,
        regulatoryContext: 'Hong Kong ECM deal structuring',
        temperature: 0.2,
        metadata: {
          queryType: 'deal_structuring',
          dealSize: request.funding_amount,
          sector: issuer?.sector
        }
      });

      const content = response.text || '';

      return {
        recommended_structure: this.extractSection(content, 'deal structure') || 'Private placement recommended',
        deal_type: this.determineDealType(content, request.funding_amount),
        pricing_strategy: this.extractSection(content, 'pricing') || 'Book building approach',
        timeline_estimate: this.extractSection(content, 'timeline') || '4-6 weeks execution',
        regulatory_requirements: this.extractList(content, 'regulatory'),
        market_conditions_analysis: this.extractSection(content, 'market conditions') || 'Favorable conditions',
        risk_factors: this.extractList(content, 'risk'),
        investor_targeting_strategy: this.extractSection(content, 'investor targeting') || 'Institutional focus',
        esg_considerations: request.esg_requirements ? this.extractSection(content, 'ESG') : undefined,
        confidence_score: 0.85
      };
    } catch (error) {
      console.error('Error structuring deal:', error);
      throw new Error('Failed to structure deal');
    }
  }

  /**
   * Match investors for a specific deal
   */
  async matchInvestors(request: InvestorMatchingRequest): Promise<InvestorMatchingResult[]> {
    try {
      // Get investors from database
      const { data: investors } = await supabase
        .from('ecm_investors')
        .select('*')
        .order('total_investment_amount', { ascending: false });

      if (!investors || investors.length === 0) {
        return [];
      }

      const matches: InvestorMatchingResult[] = [];

      // Simple matching algorithm based on deal characteristics
      for (const investor of investors.slice(0, 10)) {
        const matchScore = this.calculateMatchScore(investor as EcmInvestor, request);
        const compatibilityFactors = this.getCompatibilityFactors(investor as EcmInvestor, request);
        
        if (matchScore > 0.3) { // Only include reasonable matches
          matches.push({
            investor: investor as EcmInvestor,
            match_score: matchScore,
            compatibility_factors: compatibilityFactors,
            recommended_allocation: this.calculateAllocation(investor as EcmInvestor, request.deal_size),
            contact_priority: matchScore > 0.7 ? 'high' : matchScore > 0.5 ? 'medium' : 'low',
            engagement_strategy: this.getEngagementStrategy(investor as EcmInvestor, matchScore)
          });
        }
      }

      return matches.sort((a, b) => b.match_score - a.match_score);
    } catch (error) {
      console.error('Error matching investors:', error);
      return [];
    }
  }

  // Helper methods for parsing AI responses
  private extractSection(content: string, keyword: string): string | undefined {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        // Return the next few lines as the section content
        return lines.slice(i, i + 3).join(' ').trim();
      }
    }
    return undefined;
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('•') || line.includes('-')) {
        const cleaned = line.replace(/[•\-]/g, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      }
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private extractRiskFactors(content: string): string[] {
    const risks = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('challenge')) {
        const cleaned = line.replace(/[•\-]/g, '').trim();
        if (cleaned.length > 10) {
          risks.push(cleaned);
        }
      }
    }
    
    return risks.slice(0, 5); // Limit to 5 risk factors
  }

  private extractList(content: string, keyword: string): string[] {
    const items = [];
    const lines = content.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        inSection = true;
        continue;
      }
      
      if (inSection && (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.'))) {
        const cleaned = line.replace(/[•\-\d\.]/g, '').trim();
        if (cleaned.length > 5) {
          items.push(cleaned);
        }
      }
      
      if (inSection && line.trim() === '') {
        break; // End of section
      }
    }
    
    return items.slice(0, 5);
  }

  private determineDealType(content: string, amount: number): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('rights issue') || contentLower.includes('rights offering')) {
      return 'rights_issue';
    } else if (contentLower.includes('private placement')) {
      return 'private_placement';
    } else if (contentLower.includes('convertible')) {
      return 'convertible_bond';
    } else if (contentLower.includes('follow-on') || contentLower.includes('follow on')) {
      return 'follow_on';
    } else if (amount > 1000000000) { // > 1B, likely institutional
      return 'private_placement';
    } else {
      return 'private_placement'; // Default
    }
  }

  private calculateMatchScore(investor: EcmInvestor, request: InvestorMatchingRequest): number {
    let score = 0.5; // Base score
    
    // Deal size fit
    if (investor.deal_size_min && investor.deal_size_max) {
      if (request.deal_size >= investor.deal_size_min && request.deal_size <= investor.deal_size_max) {
        score += 0.3;
      }
    }
    
    // ESG alignment
    if (request.esg_focused && investor.esg_focused) {
      score += 0.2;
    }
    
    // Sector preferences
    if (investor.sector_preferences && request.sector && investor.sector_preferences.includes(request.sector)) {
      score += 0.2;
    }
    
    // Investment capacity
    if (investor.total_investment_amount > request.deal_size * 0.1) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private getCompatibilityFactors(investor: EcmInvestor, request: InvestorMatchingRequest): string[] {
    const factors = [];
    
    if (investor.deal_size_min && investor.deal_size_max && 
        request.deal_size >= investor.deal_size_min && request.deal_size <= investor.deal_size_max) {
      factors.push('Deal size fit');
    }
    
    if (request.esg_focused && investor.esg_focused) {
      factors.push('ESG alignment');
    }
    
    if (investor.sector_preferences && request.sector && investor.sector_preferences.includes(request.sector)) {
      factors.push('Sector preference match');
    }
    
    if (investor.stock_connect_eligible) {
      factors.push('Stock Connect eligible');
    }
    
    return factors;
  }

  private calculateAllocation(investor: EcmInvestor, dealSize: number): number {
    const maxAllocation = Math.min(
      dealSize * 0.25, // Max 25% of deal
      investor.deal_size_max || dealSize * 0.1 // Or investor's max
    );
    
    return Math.max(
      dealSize * 0.05, // Min 5% of deal
      maxAllocation
    );
  }

  private getEngagementStrategy(investor: EcmInvestor, matchScore: number): string {
    if (matchScore > 0.8) {
      return 'Priority engagement with senior management presentation';
    } else if (matchScore > 0.6) {
      return 'Direct approach with comprehensive deal materials';
    } else {
      return 'Standard marketing approach with deal summary';
    }
  }
}

export const ecmService = new EcmService();
