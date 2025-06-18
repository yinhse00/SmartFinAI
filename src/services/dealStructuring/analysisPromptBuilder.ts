
/**
 * Build enhanced analysis prompt focused on major deal terms with market intelligence
 */
export function buildAnalysisPrompt(
  description: string, 
  documentContent: string, 
  userInputs?: ExtractedUserInputs
): string {
  // Add critical user input constraints when userInputs are provided
  let userInputConstraints = '';
  if (userInputs?.amount && userInputs.amount > 0) {
    const formattedAmount = userInputs.amount.toLocaleString();
    const currency = userInputs.currency || 'HKD';
    
    userInputConstraints = `
CRITICAL USER INPUT CONSTRAINTS - MUST BE STRICTLY FOLLOWED:

The transaction consideration amount is EXACTLY ${currency} ${formattedAmount}
DO NOT modify, estimate, infer, or use any other monetary value for the transaction consideration
Use this exact amount (${userInputs.amount}) in all calculations and JSON outputs including:
- dealEconomics.purchasePrice is set to exactly ${userInputs.amount}
- valuation.transactionValue.amount is set to exactly ${userInputs.amount}  
- transactionFlow.paymentFlows.amount is set to exactly ${userInputs.amount}
DO NOT use market comparables or precedent transactions to override this user-specified amount
ALL MONETARY FIELDS must use the exact user-provided amount of ${userInputs.amount}
`;
  }

  return `
${userInputConstraints}

As a Hong Kong investment banking advisor and financial regulatory expert with access to real-time market intelligence, analyze the following transaction and provide professional-grade structuring advice focused on MAJOR DEAL TERMS, commercial considerations, and market-optimized recommendations.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS CONTENT:\n${documentContent}\n` : ''}

Perform a comprehensive analysis that incorporates MARKET INTELLIGENCE and OPTIMIZATION PRINCIPLES. Focus your analysis on MAJOR COMMERCIAL AND STRUCTURAL TERMS that impact deal economics and execution, considering current market conditions and precedent transactions.

Your analysis should include OPTIMIZATION-FOCUSED recommendations covering:

1. EXECUTIVE NARRATIVE SUMMARY (NEW REQUIREMENT):
   - Create a professional, context-aware executive summary paragraph (150-200 words)
   - Include specific transaction details: parties, consideration amount, structure type
   - Highlight key commercial terms, strategic rationale, and market positioning
   - Incorporate timing, risk factors, and unique structural features
   - Write in professional advisory tone suitable for executive presentation
   - Focus on value creation, strategic objectives, and execution excellence

2. RECOMMENDED TRANSACTION STRUCTURE & MAJOR TERMS (OPTIMIZED):
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
   - SUCCESS PROBABILITY calibration based on market data

FORMAT your response as a structured JSON object with enhanced market intelligence and optimization data:

{
  "executiveSummary": {
    "narrative": "string - Professional executive summary paragraph incorporating specific deal details, strategic rationale, market context, and key structural features",
    "keyHighlights": ["string array of 3-4 key transaction highlights"],
    "strategicRationale": "string - Core strategic reasoning for the transaction structure",
    "marketContext": "string - Current market conditions and positioning"
  },
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
    "listingRules": ["string with rule numbers like 'Rule 14.07'"],
    "takeoversCode": ["string with relevant Takeovers Code rules like 'Rule 26.1'"],
    "risks": ["string describing a critical compliance risk"],
    "recommendations": ["string with an actionable recommendation to mitigate risks"],
    "materialApprovals": ["string identifying key regulatory approvals needed"],
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
    "after": [{"name": "string", "percentage": number, "type": "individual|institutional|connected|public|fund", "isConnected": false}], // IMPORTANT: If stock consideration is used, this 'after' state MUST reflect the dilution of existing shareholders and the addition of new shareholders receiving stock, based on deal value and estimated acquirer valuation.
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
- MANDATORY: Include comprehensive EXECUTIVE SUMMARY with professional narrative content
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

// Keep existing interface imports at top
interface ExtractedUserInputs {
  amount?: number;
  currency?: string;
  targetCompanyName?: string;
  acquiringCompanyName?: string;
  acquisitionPercentage?: number;
}
