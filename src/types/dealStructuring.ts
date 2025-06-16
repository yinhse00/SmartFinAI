
export interface TransactionData {
  type: string;
  subtype: string;
  amount: number;
  currency: string;
  currentShares: number;
  marketCap: number;
  objectives: string[];
  timeline: string;
  shareholderStructure: Array<{
    name: string;
    percentage: number;
    type: 'individual' | 'institutional' | 'connected';
  }>;
  regulatoryConstraints: string[];
  jurisdiction: string;
}

export interface ShareholderData {
  name: string;
  percentage: number;
  type: 'individual' | 'institutional' | 'connected' | 'public' | 'fund' | 'new_equity_recipient';
  isConnected?: boolean;
}

export interface CorporateEntity {
  id: string;
  name: string;
  type: 'parent' | 'subsidiary' | 'target' | 'issuer';
  ownership?: number;
  parentId?: string;
  description?: string; // Added missing property
}

export type Shareholder = ShareholderData; // Alias for ShareholderData

export interface PaymentStructure { // Added PaymentStructure interface
  cashPercentage?: number;
  stockPercentage?: number;
  otherConsideration?: string;
  details?: string;
}

export interface DealEconomics { // Added DealEconomics interface
  purchasePrice?: number;
  currency?: string;
  targetPercentage?: number;
  valuationMetrics?: Record<string, string | number>;
  synergies?: {
    description: string;
    estimatedValue: number;
  }[];
}

export interface ShareholdingChanges {
  before: ShareholderData[];
  after: ShareholderData[];
  keyChanges: Array<{
    shareholder: string;
    before: number;
    after: number;
    change: number;
    // type: 'increase' | 'decrease' | 'new' | 'exit'; // Type is inferred
  }>;
  controlImplications: string[];
}

export interface CorporateStructure {
  entities: CorporateEntity[];
  relationships: Array<{
    parent: string;
    child: string;
    ownershipPercentage: number;
  }>;
  mainIssuer: string;
  targetEntities?: string[];
}
