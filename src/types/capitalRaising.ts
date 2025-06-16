
export interface CapitalRaisingContext {
  type: 'rights_issue' | 'open_offer' | 'placement' | 'subscription' | 'ipo';
  issuingCompany: string;
  offerRatio?: string; // e.g., "1 for 2", "2 for 5"
  subscriptionPrice?: number;
  discount?: number; // percentage
  proceedsAmount: number;
  currency: string;
  recordDate?: string;
  closingDate?: string;
  tradingPeriod?: string;
}

export interface CapitalRaisingParameters {
  sharesBeforeIssue: number;
  newSharesIssued: number;
  subscriptionRate?: number; // percentage of rights taken up
  excessApplications?: boolean;
  scalingBack?: boolean;
  underwritingArrangements?: {
    isUnderwritten: boolean;
    underwriters: string[];
    underwritingPercentage?: number;
  };
}

export interface ShareholderAnalysis {
  controllingShareholderName?: string;
  controllingPercentage?: number;
  publicShareholders: Array<{
    name: string;
    percentage: number;
    type: 'institutional' | 'individual' | 'fund';
  }>;
  isControllingShareholderUnderwriter?: boolean;
}
