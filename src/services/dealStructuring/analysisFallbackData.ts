import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

// Fallback for shareholding changes
export function createFallbackShareholdingChanges(): ShareholdingChanges {
  return {
    before: [
      { name: "Existing Shareholders", percentage: 100, type: "institutional" as const, isConnected: false }
    ],
    after: [
      { name: "Existing Shareholders", percentage: 80, type: "institutional" as const, isConnected: false },
      { name: "New Investors", percentage: 20, type: "institutional" as const, isConnected: false }
    ],
    keyChanges: [
      { shareholder: "Existing Shareholders", before: 100, after: 80, change: -20 },
      { shareholder: "New Investors", before: 0, after: 20, change: 20 }
    ],
    controlImplications: ["Dilution of existing shareholders", "Introduction of new institutional investors"]
  };
}

// Fallback for corporate structure
export function createFallbackCorporateStructure(): CorporateStructure {
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

// Fallback for transaction flow (simplified as it's complex)
export function createFallbackTransactionFlow(): AnalysisResults['transactionFlow'] {
  return {
    before: {
      entities: [
        { id: "target-1", name: "Target Company", type: "target", percentage: 100, description: "Listed company to be acquired", role: "target" },
        { id: "shareholders-1", name: "Existing Shareholders", type: "stockholder", percentage: 100, description: "Current shareholders of target", role: "shareholder" }
      ],
      relationships: [
        { source: "shareholders-1", target: "target-1", type: "ownership", percentage: 100, nature: "direct ownership" }
      ]
    },
    after: {
      entities: [
        { id: "target-1", name: "Target Company", type: "target", percentage: 100, description: "Listed company acquired", role: "target" },
        { id: "shareholders-1", name: "Existing Shareholders", type: "stockholder", percentage: 30, description: "Remaining shareholders", role: "shareholder" },
        { id: "buyer-1", name: "Acquiring Company", type: "buyer", percentage: 70, description: "New controlling shareholder", role: "acquirer" },
        { id: "consideration-1", name: "Cash Consideration", type: "consideration", value: 1000, description: "Payment to selling shareholders", role: "payment" }
      ],
      relationships: [
        { source: "buyer-1", target: "target-1", type: "ownership", percentage: 70, nature: "controlling interest" },
        { source: "shareholders-1", target: "target-1", type: "ownership", percentage: 30, nature: "minority interest" },
        { source: "buyer-1", target: "consideration-1", type: "consideration", value: 1000, nature: "cash payment" }
      ]
    },
    majorTransactionSteps: [ 
      { id: "step-1", title: "Due Diligence", description: "Buyer conducts comprehensive due diligence", entities: ["buyer-1", "target-1"], criticalPath: true },
      { id: "step-2", title: "Share Purchase Agreement", description: "Execution of binding agreement", entities: ["buyer-1", "shareholders-1"], criticalPath: true },
    ],
    paymentFlows: [
        { from: "buyer-1", to: "shareholders-1", amount: 1000, mechanism: "cash", timing: "on completion" }
    ]
  };
}

// Fallback for overall analysis if parsing fails
export function createFallbackAnalysis(responseText: string): AnalysisResults {
  return {
    transactionType: "Transaction Analysis",
    structure: {
      recommended: "Please review the detailed analysis below. Fallback data used.",
      majorTerms: { 
        pricingMechanism: "fixed",
        targetPercentage: 0,
        suggestionConsideration: "N/A for fallback",
        paymentStructure: { cashPercentage: 100, stockPercentage: 0, paymentSchedule: "N/A", escrowArrangements: "N/A" },
        keyConditions: ["N/A"],
        structuralDecisions: ["N/A"],
      },
      alternatives: [],
      rationale: responseText.substring(0, 500) + "..."
    },
    costs: {
      regulatory: 0,
      professional: 0,
      timing: 0,
      total: 0,
      majorDrivers: ["N/A"],
      optimizationOpportunities: ["N/A"], // Added to match type
      breakdown: [{
        category: "Analysis",
        amount: 0,
        description: "Detailed cost analysis available in full response (fallback)"
      }]
    },
    timetable: { 
      totalDuration: "To be determined",
      keyMilestones: [ // Added required keyMilestones
        { date: "TBD", event: "Initial Review", description: "Review fallback timetable milestone." }
      ],
      criticalPath: [{date: "TBD", milestone: "Analysis Review", description:"Review comprehensive analysis", impact: "high", marketStandard: false}],
      keyDependencies: ["N/A"],
      timingRisks: ["N/A"],
    },
    shareholding: { 
      before: [],
      after: [],
      impact: "Shareholding impact analysis included in detailed response (fallback)",
      majorChanges: ["N/A"], // Added to match type
    },
    compliance: {
      listingRules: ["Review required"], // Corrected from keyListingRules to listingRules
      takeoversCode: ["Assessment needed"],
      risks: ["Detailed risk analysis in response (fallback)"],
      recommendations: ["See comprehensive recommendations (fallback)"],
    },
    risks: { 
      executionRisks: [],
      marketRisks: [],
      regulatoryRisks: [],
      optimizationStrategies: []
    },
    confidence: 0.5, 
    marketIntelligence: { 
        precedentAnalysis: "N/A",
        marketConditions: "N/A",
        regulatoryEnvironment: "N/A",
        optimizationPotential: "N/A",
        successProbability: 0
    },
    shareholdingChanges: createFallbackShareholdingChanges(),
    corporateStructure: createFallbackCorporateStructure(),
    transactionFlow: createFallbackTransactionFlow()
  };
}
