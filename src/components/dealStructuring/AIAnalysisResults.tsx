
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

export interface DealEconomics {
  purchasePrice: number;
  currency: string;
  paymentStructure: string;
  valuationBasis: string;
  targetPercentage: number;
}

export interface AnalysisResults {
  transactionType: string;
  dealEconomics?: DealEconomics;
  structure: {
    recommended: string;
    alternatives?: Array<{
      structure: string;
      tradeOffs: string;
    }>;
    rationale: string;
  };
  costs: {
    regulatory: number;
    professional: number;
    timing: number;
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description: string;
      impact?: 'high' | 'medium' | 'low';
    }>;
  };
  timetable: {
    totalDuration: string;
    keyMilestones: Array<{
      date: string;
      event: string;
      description: string;
    }>;
  };
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
  };
  confidence: number;
  shareholdingChanges: ShareholdingChanges;
  corporateStructure: CorporateStructure;
  transactionFlow?: any;
}
