
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

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
  keyMilestones: Array<{
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

export interface AnalysisResults {
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
  };
  compliance: {
    listingRules: string[];
    takeoversCode: string[];
    risks: string[];
    recommendations: string[];
    actionableRecommendations?: string[];
  };
  confidence: number;
  shareholdingChanges: ShareholdingChanges;
  corporateStructure: CorporateStructure;
  transactionFlow?: any;
}
