
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
 * Build enhanced analysis prompt focused on major deal terms
 */
function buildAnalysisPrompt(description: string, documentContent: string): string {
  return `
As a Hong Kong investment banking advisor and financial regulatory expert, analyze the following transaction and provide professional-grade structuring advice focused on MAJOR DEAL TERMS and commercial considerations.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS CONTENT:\n${documentContent}\n` : ''}

Focus your analysis on MAJOR COMMERCIAL AND STRUCTURAL TERMS that impact deal economics and execution. Provide investment banking-quality recommendations covering:

1. RECOMMENDED TRANSACTION STRUCTURE & MAJOR TERMS:
   - Optimal structure with clear commercial rationale
   - KEY PRICING MECHANISM (fixed price, formula-based, collar, earn-out)
   - MAJOR PAYMENT TERMS (cash/stock mix, payment schedule, escrow arrangements)
   - CRITICAL CONDITIONS PRECEDENT that affect deal completion
   - KEY STRUCTURAL DECISIONS (merger vs acquisition, tax optimization)
   - Alternative structures with material trade-offs

2. MAJOR COST ANALYSIS (Focus on decision-impacting amounts):
   - Key regulatory fees (HKEX, SFC, government stamps)
   - Major professional fees by category (legal, accounting, financial advisory)
   - Material timing-related costs
   - Cost optimization opportunities
   - Total estimated range with key drivers

3. CRITICAL PATH EXECUTION TIMETABLE:
   - DEAL-CRITICAL MILESTONES with impact on timing/cost
   - Key regulatory approvals that affect structure
   - Critical dependencies and resource requirements
   - Material timing risks and mitigation strategies
   - Overall execution timeline with key decision points

4. MAJOR SHAREHOLDING IMPACT:
   - Key ownership changes and control implications
   - Material dilution analysis for existing shareholders
   - Voting control and governance implications
   - Impact on connected persons and disclosure requirements

5. KEY REGULATORY REQUIREMENTS:
   - Material Listing Rules requirements (Chapter 14/14A thresholds)
   - Takeovers Code implications if applicable
   - Critical regulatory approvals and timeline impact
   - Key compliance risks that affect structure
   - Actionable regulatory strategy recommendations

6. MAJOR RISKS & MITIGATION:
   - Material execution risks with probability assessment
   - Key market/timing risks
   - Regulatory and approval risks
   - Structural risk mitigation strategies

7. TRANSACTION FLOW DATA (for visualization):
   - Before/after entity structures with major ownership changes
   - Key consideration flows and payment mechanisms
   - Material control and ownership relationships
   - Transaction steps focusing on critical milestones

FORMAT your response as a structured JSON object with enhanced major terms data:
{
  "transactionType": "string",
  "structure": {
    "recommended": "string with clear commercial rationale",
    "majorTerms": {
      "pricingMechanism": "fixed|formula|collar|earnout|hybrid",
      "paymentStructure": {
        "cashPercentage": number,
        "stockPercentage": number,
        "paymentSchedule": "string",
        "escrowArrangements": "string"
      },
      "keyConditions": ["string"],
      "structuralDecisions": ["string"]
    },
    "alternatives": [{"structure": "string", "tradeOffs": "string"}],
    "rationale": "string focusing on commercial benefits"
  },
  "costs": {
    "regulatory": number,
    "professional": number,
    "timing": number,
    "total": number,
    "majorDrivers": ["string"],
    "optimizationOpportunities": ["string"],
    "breakdown": [{"category": "string", "amount": number, "description": "string", "impact": "high|medium|low"}]
  },
  "timetable": {
    "totalDuration": "string",
    "criticalPath": [{"date": "string", "milestone": "string", "description": "string", "impact": "high|medium|low"}],
    "keyDependencies": ["string"],
    "timingRisks": ["string"]
  },
  "shareholding": {
    "before": [{"name": "string", "percentage": number}],
    "after": [{"name": "string", "percentage": number}],
    "majorChanges": ["string"],
    "controlImplications": ["string"],
    "dilutionImpact": "string"
  },
  "compliance": {
    "keyListingRules": ["string with rule numbers"],
    "materialApprovals": ["string"],
    "criticalRisks": ["string"],
    "actionableRecommendations": ["string"]
  },
  "risks": {
    "executionRisks": [{"risk": "string", "probability": "high|medium|low", "mitigation": "string"}],
    "marketRisks": ["string"],
    "regulatoryRisks": ["string"]
  },
  "confidence": number,
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

CRITICAL REQUIREMENTS:
- Focus on MAJOR TERMS that impact deal economics and execution
- Provide clear commercial rationale for all recommendations
- Include realistic financial projections and cost estimates in HKD
- Ensure all regulatory references are accurate for Hong Kong
- Generate comprehensive but focused diagram data for proper visualization
- Emphasize actionable insights for deal structuring decisions

Ensure your analysis is comprehensive yet focused on major commercial terms, providing investment banking-quality insights that enable informed deal structuring decisions.
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
