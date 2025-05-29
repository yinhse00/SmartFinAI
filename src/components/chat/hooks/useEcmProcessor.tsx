
import { useToast } from '@/hooks/use-toast';
import { ecmService } from '@/services/ecm/ecmService';
import { grokService } from '@/services/grokService';

/**
 * Enhanced chat processor for ECM-specific queries
 */
export const useEcmProcessor = () => {
  const { toast } = useToast();

  const processEcmQuery = async (query: string): Promise<string> => {
    console.log('Processing ECM query:', query);

    try {
      // Detect ECM query type
      const queryType = detectEcmQueryType(query);
      
      switch (queryType) {
        case 'deal_structuring':
          return await processDealStructuringQuery(query);
        
        case 'investor_matching':
          return await processInvestorMatchingQuery(query);
        
        case 'market_intelligence':
          return await processMarketIntelligenceQuery(query);
        
        case 'regulatory_compliance':
          return await processRegulatoryComplianceQuery(query);
        
        case 'pricing_guidance':
          return await processPricingGuidanceQuery(query);
        
        default:
          return await processGeneralEcmQuery(query);
      }
    } catch (error) {
      console.error('Error processing ECM query:', error);
      throw new Error('Failed to process ECM query');
    }
  };

  const detectEcmQueryType = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('deal structure') || lowerQuery.includes('fundraising structure')) {
      return 'deal_structuring';
    }
    
    if (lowerQuery.includes('investor match') || lowerQuery.includes('find investors')) {
      return 'investor_matching';
    }
    
    if (lowerQuery.includes('market condition') || lowerQuery.includes('market intelligence')) {
      return 'market_intelligence';
    }
    
    if (lowerQuery.includes('compliance') || lowerQuery.includes('regulatory')) {
      return 'regulatory_compliance';
    }
    
    if (lowerQuery.includes('pricing') || lowerQuery.includes('valuation')) {
      return 'pricing_guidance';
    }
    
    return 'general_ecm';
  };

  const processDealStructuringQuery = async (query: string): Promise<string> => {
    // Enhanced prompt for deal structuring
    const ecmPrompt = `
      As a Hong Kong ECM expert, provide comprehensive deal structuring advice for: ${query}
      
      Consider:
      1. Hong Kong regulatory requirements (SFC, HKEX)
      2. Market conditions and timing
      3. Investor preferences and capacity
      4. Deal execution complexity
      5. Cross-border considerations (Stock Connect)
      6. ESG factors and sustainability
      7. Cost optimization and pricing strategies
      
      Provide specific recommendations for:
      - Optimal deal structure and type
      - Regulatory pathway and approvals
      - Investor targeting strategy
      - Execution timeline and milestones
      - Risk mitigation strategies
      
      Focus on practical, actionable advice for Hong Kong secondary fundraising.
    `;

    const response = await grokService.generateResponse(ecmPrompt, {
      regulatoryContext: '',
      guidanceContext: '',
      sourceMaterials: [],
      skipSequentialSearches: true,
      isRegulatoryRelated: true,
      optimized: true
    });

    return response.content;
  };

  const processInvestorMatchingQuery = async (query: string): Promise<string> => {
    const ecmPrompt = `
      As a Hong Kong ECM expert, provide investor matching and targeting advice for: ${query}
      
      Analyze:
      1. Institutional investor landscape in Hong Kong
      2. Mainland Chinese investor appetite via Stock Connect
      3. International investor considerations
      4. ESG-focused investor requirements
      5. Sector-specific investor preferences
      6. Deal size and structure fit
      
      Recommend:
      - Target investor categories and profiles
      - Engagement strategies and approaches
      - Allocation strategies and pricing
      - Regulatory considerations for different investor types
      - Cross-border compliance requirements
      
      Provide practical guidance for Hong Kong ECM investor targeting.
    `;

    const response = await grokService.generateResponse(ecmPrompt, {
      regulatoryContext: '',
      guidanceContext: '',
      sourceMaterials: [],
      skipSequentialSearches: true,
      isRegulatoryRelated: false,
      optimized: true
    });

    return response.content;
  };

  const processMarketIntelligenceQuery = async (query: string): Promise<string> => {
    try {
      const marketIntelligence = await ecmService.getMarketIntelligence();
      
      const ecmPrompt = `
        As a Hong Kong ECM expert, provide market intelligence analysis for: ${query}
        
        Current Market Conditions:
        - Market Conditions: ${marketIntelligence.marketConditions}
        - ECM Activity: ${marketIntelligence.ecmActivity}
        - Recommendations: ${marketIntelligence.recommendations.join(', ')}
        - Risk Factors: ${marketIntelligence.riskFactors.join(', ')}
        
        Analyze:
        1. Current Hong Kong market sentiment and conditions
        2. ECM activity trends and pipeline
        3. Cross-border capital flows (Stock Connect)
        4. Regulatory environment and policy changes
        5. Sector-specific market dynamics
        6. Optimal timing considerations
        
        Provide actionable insights for ECM execution in Hong Kong.
      `;

      const response = await grokService.generateResponse(ecmPrompt, {
        regulatoryContext: '',
        guidanceContext: '',
        sourceMaterials: [],
        skipSequentialSearches: true,
        isRegulatoryRelated: false,
        optimized: true
      });

      return response.content;
    } catch (error) {
      return await processGeneralEcmQuery(query);
    }
  };

  const processRegulatoryComplianceQuery = async (query: string): Promise<string> => {
    const ecmPrompt = `
      As a Hong Kong ECM regulatory expert, provide compliance guidance for: ${query}
      
      Focus on:
      1. HKEX Listing Rules compliance for secondary fundraising
      2. SFC regulatory requirements and approvals
      3. Connected party and disclosure requirements
      4. Cross-border regulatory considerations
      5. Stock Connect compliance requirements
      6. ESG disclosure and sustainability reporting
      7. Timing and procedural requirements
      
      Provide:
      - Step-by-step compliance roadmap
      - Key regulatory milestones and deadlines
      - Required approvals and filings
      - Risk areas and mitigation strategies
      - Best practices for Hong Kong ECM compliance
      
      Ensure accuracy with current Hong Kong financial regulations.
    `;

    const response = await grokService.generateResponse(ecmPrompt, {
      regulatoryContext: '',
      guidanceContext: '',
      sourceMaterials: [],
      skipSequentialSearches: true,
      isRegulatoryRelated: true,
      optimized: true
    });

    return response.content;
  };

  const processPricingGuidanceQuery = async (query: string): Promise<string> => {
    const ecmPrompt = `
      As a Hong Kong ECM pricing expert, provide valuation and pricing guidance for: ${query}
      
      Consider:
      1. Hong Kong market valuation methodologies
      2. Comparable company analysis (Hong Kong listed)
      3. Market conditions and timing impact
      4. Deal structure impact on pricing
      5. Investor demand and allocation strategies
      6. Cross-border valuation considerations
      7. ESG premium/discount factors
      
      Analyze:
      - Appropriate pricing methodologies
      - Market conditions impact on valuation
      - Discount/premium considerations
      - Comparable transactions analysis
      - Investor demand assessment
      - Optimal pricing strategy
      
      Provide practical pricing recommendations for Hong Kong ECM transactions.
    `;

    const response = await grokService.generateResponse(ecmPrompt, {
      regulatoryContext: '',
      guidanceContext: '',
      sourceMaterials: [],
      skipSequentialSearches: true,
      isRegulatoryRelated: false,
      optimized: true
    });

    return response.content;
  };

  const processGeneralEcmQuery = async (query: string): Promise<string> => {
    const ecmPrompt = `
      As a Hong Kong ECM expert, provide comprehensive guidance for: ${query}
      
      Apply expertise in:
      1. Hong Kong Equity Capital Markets
      2. Secondary fundraising strategies
      3. HKEX and SFC regulations
      4. Cross-border capital markets
      5. Stock Connect mechanisms
      6. ESG and sustainability factors
      7. Market intelligence and analysis
      
      Provide practical, actionable advice specific to the Hong Kong ECM market.
    `;

    const response = await grokService.generateResponse(ecmPrompt, {
      regulatoryContext: '',
      guidanceContext: '',
      sourceMaterials: [],
      skipSequentialSearches: true,
      isRegulatoryRelated: true,
      optimized: true
    });

    return response.content;
  };

  return {
    processEcmQuery,
    detectEcmQueryType
  };
};
