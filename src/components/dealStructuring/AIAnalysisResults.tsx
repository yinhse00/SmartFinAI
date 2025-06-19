import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

export interface ExecutiveSummary {
  narrative: string;
  keyHighlights: string[];
  strategicRationale: string;
  marketContext: string;
}

export interface DealEconomics {
  purchasePrice: number;
  currency: string;
  paymentStructure: string;
  valuationBasis: string;
  targetPercentage: number;
}

export interface MajorTerms {
  pricingMechanism: 'fixed' | 'formula' | 'collar' | 'earnout' | 'hybrid';
  targetPercentage?: number;
  suggestionConsideration?: string;
  paymentStructure: {
    cashPercentage: number;
    stockPercentage: number;
    paymentSchedule?: string;
    escrowArrangements?: string;
  };
  keyConditions: string[];
  structuralDecisions: string[];
  marketBenchmarks?: {
    similarDeals: number;
    averagePricingMultiple: number;
    marketSuccessRate: number;
  };
}

export interface EnhancedTimetable {
  totalDuration: string;
  keyMilestones: Array<{ // This is required
    date: string;
    event: string;
    description: string;
  }>;
  criticalPath?: Array<{
    date: string;
    milestone: string;
    description: string;
    impact?: 'high' | 'medium' | 'low';
    marketStandard?: boolean;
  }>;
  keyDependencies?: string[];
  timingRisks?: string[];
  marketOptimization?: {
    fastestMarketPrecedent: string;
    averageMarketTiming: string;
    optimizationPotential: string;
  };
}

export interface EnhancedStructure {
  recommended: string;
  alternatives?: Array<{
    structure: string;
    tradeOffs: string;
    marketViability?: string;
  }>;
  rationale: string;
  majorTerms?: MajorTerms;
  optimizationInsights?: string[];
}

// Define types for the AI's transactionFlow structure
interface AITransactionFlowStep {
  id: string;
  title: string;
  description: string;
  entities: string[];
  criticalPath?: boolean;
}

interface AITransactionFlowEntity {
  id: string;
  name: string;
  type: string; // Simplified for AI response flexibility
  value?: number;
  percentage?: number;
  description?: string;
  role?: string;
}

interface AITransactionFlowRelationship {
  source: string;
  target: string;
  type: string; // Simplified
  percentage?: number;
  value?: number;
  nature?: string;
}

interface AITransactionFlowSection {
  entities: AITransactionFlowEntity[];
  relationships: AITransactionFlowRelationship[];
}

interface AITransactionFlow {
  before?: AITransactionFlowSection;
  after?: AITransactionFlowSection;
  majorTransactionSteps?: AITransactionFlowStep[];
  paymentFlows?: Array<{
    from: string;
    to: string;
    amount: number;
    mechanism: string;
    timing: string;
  }>;
  transactionContext?: {
    amount?: number;
    currency?: string;
  };
}

export interface ValuationAnalysis {
  transactionValue: {
    amount: number;
    currency: string;
    pricePerShare?: number;
  };
  valuationMetrics: {
    peRatio?: number;
    pbRatio?: number;
    evEbitda?: number;
    priceToBook?: number;
  };
  marketComparables: Array<{
    company: string;
    metric: string;
    value: number;
  }>;
  fairnessAssessment: {
    conclusion: string;
    reasoning: string;
    premium?: number;
  };
  valuationRange: {
    low: number;
    high: number;
    midpoint: number;
  };
}

export interface DocumentPreparation {
  requiredDocuments: Array<{
    document: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    responsibleParty: string;
  }>;
  keyParties: Array<{
    party: string;
    role: string;
    involvement: string;
  }>;
  preparationTimeline: {
    totalDuration: string;
    criticalPath: string[];
  };
  regulatoryFilings: string[];
}

export interface AnalysisResults {
  executiveSummary?: ExecutiveSummary;
  transactionType: string;
  dealEconomics?: DealEconomics;
  structure: EnhancedStructure;
  costs: {
    regulatory: number;
    professional: number;
    timing: number;
    total: number;
    majorDrivers?: string[];
    breakdown: Array<{
      category: string;
      amount: number;
      description: string;
      impact?: 'high' | 'medium' | 'low';
    }>;
    optimizationOpportunities?: string[]; // Added
  };
  timetable: EnhancedTimetable;
  shareholding: {
    before: Array<{
      name: string;
      percentage: number;
    }>;
    after: Array<{
      name: string;
      percentage: number;
    }>;
    impact: string;
    majorChanges?: string[]; // Added
  };
  compliance: {
    listingRules: string[];
    takeoversCode: string[];
    risks: string[];
    recommendations: string[];
  };
  valuation: ValuationAnalysis;
  documentPreparation: DocumentPreparation;
  confidence: number;
  shareholdingChanges: ShareholdingChanges;
  corporateStructure: CorporateStructure;
  transactionFlow?: AITransactionFlow; // This was updated in the previous attempt and should remain
}
