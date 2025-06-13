import { grokService } from '../grokService';
import { fileProcessingService } from '../documents/fileProcessingService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

export interface TransactionAnalysisRequest {
  transactionType: string;
  description: string;
  amount?: number;
  currency?: string;
  documents?: File[];
  additionalContext?: string;
}

export interface AnalysisContext {
  originalRequest: TransactionAnalysisRequest;
  analysisTimestamp: Date;
}

/**
 * Service for AI-powered transaction analysis
 */
export const aiAnalysisService = {
  /**
   * Analyze transaction requirements and generate comprehensive advisory
   */
  analyzeTransaction: async (request: TransactionAnalysisRequest): Promise<AnalysisResults> => {
    try {
      console.log('Starting AI transaction analysis...');
      
      // Extract content from uploaded documents
      let documentContent = '';
      if (request.documents?.length > 0) {
        console.log(`Processing ${request.documents.length} uploaded documents...`);
        const extractionPromises = request.documents.map(file => 
          fileProcessingService.processFile(file)
        );
        
        const extractions = await Promise.all(extractionPromises);
        documentContent = extractions
          .map(result => `${result.source}:\n${result.content}`)
          .join('\n\n');
      }
      
      // Construct comprehensive analysis prompt
      const analysisPrompt = buildAnalysisPrompt(request.description, documentContent);
      
      // Get AI analysis from Grok
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          hasDocuments: request.documents?.length > 0
        }
      });
      
      // Parse and structure the response
      const analysisResults = parseAnalysisResponse(response.text);
      
      console.log('AI transaction analysis completed');
      return analysisResults;
    } catch (error) {
      console.error('Error in AI transaction analysis:', error);
      throw new Error('Failed to analyze transaction. Please try again.');
    }
  },

  /**
   * Store analysis context for follow-up processing
   */
  storeAnalysisContext: (request: TransactionAnalysisRequest, results: AnalysisResults): AnalysisContext => {
    return {
      originalRequest: request,
      analysisTimestamp: new Date()
    };
  },

  /**
   * Enhanced analysis method that returns both results and context
   */
  analyzeTransactionWithContext: async (request: TransactionAnalysisRequest): Promise<{
    results: AnalysisResults;
    context: AnalysisContext;
  }> => {
    const results = await aiAnalysisService.analyzeTransaction(request);
    const context = aiAnalysisService.storeAnalysisContext(request, results);
    
    return { results, context };
  }
};

/**
 * Build enhanced analysis prompt focused on major deal terms with market intelligence
 */
function buildAnalysisPrompt(description: string, documentContent: string): string {
  return `
As a Hong Kong investment banking advisor and financial regulatory expert with access to real-time market intelligence, analyze the following transaction and provide professional-grade structuring advice focused on MAJOR DEAL TERMS, commercial considerations, and market-optimized recommendations.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS CONTENT:\n${documentContent}\n` : ''}

Perform a comprehensive analysis that incorporates MARKET INTELLIGENCE and OPTIMIZATION PRINCIPLES. Focus your analysis on MAJOR COMMERCIAL AND STRUCTURAL TERMS that impact deal economics and execution, considering current market conditions and precedent transactions.

Your analysis should include OPTIMIZATION-FOCUSED recommendations covering:

1. RECOMMENDED TRANSACTION STRUCTURE & MAJOR TERMS (OPTIMIZED):
   - Optimal structure with clear commercial rationale based on market conditions
   - KEY PRICING MECHANISM (fixed price, formula-based, collar, earn-out) with market benchmarks
   - TARGET PERCENTAGE being acquired or affected by the transaction (specify exact percentage)
   - STRATEGIC CONSIDERATIONS and deal optimization suggestions based on current market trends
   - MAJOR PAYMENT TERMS (cash/stock mix, payment schedule, escrow arrangements) aligned with market standards
   - CRITICAL CONDITIONS PRECEDENT that affect deal completion and market acceptance
   - KEY STRUCTURAL DECISIONS (merger vs acquisition, tax optimization) considering regulatory environment
   - Alternative structures with material trade-offs and market viability assessment
   - MARKET-TESTED APPROACHES based on successful precedent transactions

2. MARKET-INFORMED COST ANALYSIS (Focus on current market rates):
   - Key regulatory fees (HKEX, SFC, government stamps) at current rates
   - Major professional fees by category based on current market pricing
   - Material timing-related costs considering market conditions
   - Cost optimization opportunities using market intelligence
   - Total estimated range with key drivers and market benchmarks
   - COMPARATIVE ANALYSIS with recent similar transactions

3. MARKET-CALIBRATED EXECUTION TIMETABLE:
   - DEAL-CRITICAL MILESTONES considering current regulatory processing times
   - Key regulatory approvals timeline based on recent market experience
   - Critical dependencies and resource requirements in current market
   - Material timing risks and mitigation strategies considering market volatility
   - Overall execution timeline with market-tested decision points
   - PRECEDENT-BASED timeline optimization recommendations

4. OPTIMIZED SHAREHOLDING IMPACT ANALYSIS:
   - Key ownership changes and control implications optimized for market acceptance
   - Material dilution analysis for existing shareholders with market comparables
   - Voting control and governance implications considering market best practices
   - Impact on connected persons and disclosure requirements
   - MARKET BENCHMARKS for similar shareholding structures

5. MARKET-AWARE REGULATORY REQUIREMENTS:
   - Material Listing Rules requirements with recent regulatory guidance
   - Takeovers Code implications considering recent precedents
   - Critical regulatory approvals and timeline impact based on current processing
   - Key compliance risks considering recent regulatory changes
   - Actionable regulatory strategy recommendations using market intelligence

6. MARKET-INFORMED RISK ANALYSIS & OPTIMIZATION:
   - Material execution risks with market-calibrated probability assessment
   - Key market/timing risks based on current market conditions
   - Regulatory and approval risks considering recent market trends
   - OPTIMIZATION STRATEGIES for risk mitigation based on successful market practices
   - Market condition sensitivity analysis

7. COMPREHENSIVE TRANSACTION FLOW DATA (optimized for market conditions):
   - Before/after entity structures with market-standard ownership patterns
   - Key consideration flows and payment mechanisms aligned with market practice
   - Material control and ownership relationships considering regulatory trends
   - Transaction steps focusing on market-tested critical milestones
   - OPTIMIZATION INSIGHTS for structure efficiency

8. MARKET INTELLIGENCE INTEGRATION:
   - Analysis of PRECEDENT TRANSACTIONS and their outcomes
   - Current MARKET TRENDS affecting transaction structuring
   - REGULATORY ENVIRONMENT assessment based on recent developments
   - OPTIMIZATION OPPORTUNITIES identified from market analysis
   - Success probability calibration based on market data

FORMAT your response as a structured JSON object with enhanced market intelligence and optimization data:

{
  "transactionType": "string",
  "structure": {
    "recommended": "string with clear commercial rationale and market context",
    "majorTerms": {
      "pricingMechanism": "fixed|formula|collar|earnout|hybrid",
      "targetPercentage": number (REQUIRED - exact percentage of target being acquired/affected),
      "suggestionConsideration": "string with strategic considerations, deal optimization suggestions, and market intelligence insights",
      "paymentStructure": {
        "cashPercentage": number,
        "stockPercentage": number,
        "paymentSchedule": "string with market-standard timing",
        "escrowArrangements": "string based on market practice"
      },
      "keyConditions": ["string with market-informed conditions"],
      "structuralDecisions": ["string with optimization rationale"],
      "marketBenchmarks": {
        "similarDeals": number,
        "averagePricingMultiple": number,
        "marketSuccessRate": number
      }
    },
    "alternatives": [{"structure": "string", "tradeOffs": "string", "marketViability": "string"}],
    "rationale": "string focusing on commercial benefits and market optimization",
    "optimizationInsights": ["string with market-informed optimization recommendations"]
  },
  "costs": {
    "regulatory": number,
    "professional": number,
    "timing": number,
    "total": number,
    "majorDrivers": ["string"],
    "optimizationOpportunities": ["string with market-based cost savings"],
    "marketBenchmarks": {
      "averageCostSimilarDeals": number,
      "costEfficiencyRating": "high|medium|low"
    },
    "breakdown": [{"category": "string", "amount": number, "description": "string", "impact": "high|medium|low", "marketRate": "above|at|below"}]
  },
  "timetable": {
    "totalDuration": "string",
    "criticalPath": [{"date": "string", "milestone": "string", "description": "string", "impact": "high|medium|low", "marketStandard": boolean}],
    "keyDependencies": ["string"],
    "timingRisks": ["string"],
    "marketOptimization": {
      "fastestMarketPrecedent": "string",
      "averageMarketTiming": "string",
      "optimizationPotential": "string"
    }
  },
  "shareholding": {
    "before": [{"name": "string", "percentage": number}],
    "after": [{"name": "string", "percentage": number}],
    "majorChanges": ["string"],
    "controlImplications": ["string"],
    "dilutionImpact": "string",
    "marketComparables": {
      "typicalOwnershipStructure": "string",
      "marketAcceptance": "high|medium|low"
    }
  },
  "compliance": {
    "keyListingRules": ["string with rule numbers"],
    "materialApprovals": ["string"],
    "criticalRisks": ["string"],
    "actionableRecommendations": ["string"],
    "marketIntelligence": {
      "recentRegulatoryChanges": ["string"],
      "processingTimesTrends": "string",
      "successFactors": ["string"]
    }
  },
  "risks": {
    "executionRisks": [{"risk": "string", "probability": "high|medium|low", "mitigation": "string", "marketPrecedent": "string"}],
    "marketRisks": ["string with current market conditions"],
    "regulatoryRisks": ["string considering recent regulatory environment"],
    "optimizationStrategies": ["string with market-tested mitigation approaches"]
  },
  "confidence": number,
  "marketIntelligence": {
    "precedentAnalysis": "string analyzing relevant precedent transactions",
    "marketConditions": "string assessing current market environment",
    "regulatoryEnvironment": "string evaluating current regulatory landscape",
    "optimizationPotential": "string identifying optimization opportunities",
    "successProbability": number
  },
  "shareholdingChanges": {
    "before": [{"name": "string", "percentage": number, "type": "individual|institutional|connected|public|fund", "isConnected": false}],
    "after": [{"name": "string", "percentage": number, "type": "individual|institutional|connected|public|fund", "isConnected": false}],
    "keyChanges": [{"shareholder": "string", "change": number, "type": "increase|decrease|new|exit", "impact": "material|minor"}],
    "controlImplications": ["string"]
  },
  "corporateStructure": {
    "entities": [{"id": "string", "name": "string", "type": "parent|subsidiary|target|issuer", "ownership": number, "role": "string"}],
    "relationships": [{"parent": "string", "child": "string", "ownershipPercentage": number, "controlType": "majority|minority|joint"}],
    "mainIssuer": "string",
    "targetEntities": ["string"],
    "keyStructuralFeatures": ["string"]
  },
  "transactionFlow": {
    "before": {
      "entities": [{"id": "string", "name": "string", "type": "target|buyer|stockholder|subsidiary|newco|consideration", "value": number, "percentage": number, "description": "string", "role": "string"}],
      "relationships": [{"source": "string", "target": "string", "type": "ownership|control|subsidiary", "percentage": number, "nature": "string"}]
    },
    "after": {
      "entities": [{"id": "string", "name": "string", "type": "target|buyer|stockholder|subsidiary|newco|consideration", "value": number, "percentage": number, "description": "string", "role": "string"}],
      "relationships": [{"source": "string", "target": "string", "type": "ownership|control|subsidiary|consideration", "percentage": number, "value": number, "nature": "string"}]
    },
    "majorTransactionSteps": [{"id": "string", "title": "string", "description": "string", "entities": ["string"], "criticalPath": boolean}],
    "paymentFlows": [{"from": "string", "to": "string", "amount": number, "mechanism": "string", "timing": "string"}]
  }
}

CRITICAL REQUIREMENTS FOR OPTIMIZATION:
- MANDATORY: Include specific TARGET PERCENTAGE being acquired or affected (not optional)
- MANDATORY: Provide STRATEGIC CONSIDERATIONS with specific deal optimization suggestions
- Incorporate MARKET INTELLIGENCE from recent transactions and current conditions
- Provide OPTIMIZATION-BASED recommendations for all major deal terms
- Include MARKET BENCHMARKS and comparative analysis where relevant
- Focus on ACTIONABLE OPTIMIZATION insights that improve deal outcomes
- Ensure all recommendations are MARKET-TESTED and commercially viable
- Provide clear commercial rationale for all structural and optimization decisions
- Include realistic financial projections calibrated to current market rates
- Emphasize OPTIMIZATION OPPORTUNITIES that create additional value
- Generate comprehensive market intelligence for proper optimization analysis

Your analysis should demonstrate how MARKET INTELLIGENCE and OPTIMIZATION PRINCIPLES lead to superior deal structuring decisions that maximize value while minimizing risk and cost in the current market environment.
`;
}

/**
 * Parse AI response into structured analysis results
 */
function parseAnalysisResponse(responseText: string): AnalysisResults {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure diagram data exists with fallback
      if (!parsed.shareholdingChanges) {
        parsed.shareholdingChanges = createFallbackShareholdingChanges();
      }
      if (!parsed.corporateStructure) {
        parsed.corporateStructure = createFallbackCorporateStructure();
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error);
  }
  
  // Fallback: create structured response from text
  return createFallbackAnalysis(responseText);
}

function createFallbackShareholdingChanges(): ShareholdingChanges {
  return {
    before: [
      { name: "Existing Shareholders", percentage: 100, type: "institutional" as const, isConnected: false }
    ],
    after: [
      { name: "Existing Shareholders", percentage: 80, type: "institutional" as const, isConnected: false },
      { name: "New Investors", percentage: 20, type: "institutional" as const, isConnected: false }
    ],
    keyChanges: [
      { shareholder: "Existing Shareholders", change: -20, type: "decrease" as const },
      { shareholder: "New Investors", change: 20, type: "new" as const }
    ],
    controlImplications: ["Dilution of existing shareholders", "Introduction of new institutional investors"]
  };
}

function createFallbackCorporateStructure(): CorporateStructure {
  return {
    entities: [
      { id: "issuer", name: "Main Company", type: "issuer" as const, ownership: 100 },
      { id: "target", name: "Target Entity", type: "target" as const, ownership: 0 }
    ],
    relationships: [
      { parent: "issuer", child: "target", ownershipPercentage: 100 }
    ],
    mainIssuer: "issuer",
    targetEntities: ["target"]
  };
}

function createFallbackTransactionFlow() {
  return {
    before: {
      entities: [
        { id: "target-1", name: "Target Company", type: "target" as const, percentage: 100, description: "Listed company to be acquired" },
        { id: "shareholders-1", name: "Existing Shareholders", type: "stockholder" as const, percentage: 100, description: "Current shareholders of target" }
      ],
      relationships: [
        { source: "shareholders-1", target: "target-1", type: "ownership" as const, percentage: 100 }
      ]
    },
    after: {
      entities: [
        { id: "target-1", name: "Target Company", type: "target" as const, percentage: 100, description: "Listed company acquired" },
        { id: "shareholders-1", name: "Existing Shareholders", type: "stockholder" as const, percentage: 30, description: "Remaining shareholders" },
        { id: "buyer-1", name: "Acquiring Company", type: "buyer" as const, percentage: 70, description: "New controlling shareholder" },
        { id: "consideration-1", name: "Cash Consideration", type: "consideration" as const, value: 1000, description: "Payment to selling shareholders" }
      ],
      relationships: [
        { source: "buyer-1", target: "target-1", type: "ownership" as const, percentage: 70 },
        { source: "shareholders-1", target: "target-1", type: "ownership" as const, percentage: 30 },
        { source: "buyer-1", target: "consideration-1", type: "consideration" as const, value: 1000 }
      ]
    },
    transactionSteps: [
      { id: "step-1", title: "Due Diligence", description: "Buyer conducts comprehensive due diligence", entities: ["buyer-1", "target-1"] },
      { id: "step-2", title: "Share Purchase Agreement", description: "Execution of binding agreement", entities: ["buyer-1", "shareholders-1"] },
      { id: "step-3", title: "Regulatory Approvals", description: "Obtain necessary regulatory clearances", entities: ["buyer-1", "target-1"] },
      { id: "step-4", title: "Completion", description: "Transfer of shares and payment", entities: ["buyer-1", "shareholders-1", "consideration-1"] }
    ]
  };
}

function createFallbackAnalysis(responseText: string): AnalysisResults {
  return {
    transactionType: "Transaction Analysis",
    structure: {
      recommended: "Please review the detailed analysis below",
      alternatives: [],
      rationale: responseText.substring(0, 500) + "..."
    },
    costs: {
      regulatory: 0,
      professional: 0,
      timing: 0,
      total: 0,
      breakdown: [{
        category: "Analysis",
        amount: 0,
        description: "Detailed cost analysis available in full response"
      }]
    },
    timetable: {
      totalDuration: "To be determined",
      keyMilestones: [{
        date: "TBD",
        event: "Analysis Review",
        description: "Review comprehensive analysis provided"
      }]
    },
    shareholding: {
      before: [],
      after: [],
      impact: "Shareholding impact analysis included in detailed response"
    },
    compliance: {
      listingRules: ["Review required"],
      takeoversCode: ["Assessment needed"],
      risks: ["Detailed risk analysis in response"],
      recommendations: ["See comprehensive recommendations"]
    },
    confidence: 0.7,
    shareholdingChanges: createFallbackShareholdingChanges(),
    corporateStructure: createFallbackCorporateStructure(),
    transactionFlow: createFallbackTransactionFlow()
  };
}
