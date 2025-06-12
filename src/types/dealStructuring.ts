
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
  type: 'individual' | 'institutional' | 'connected' | 'public' | 'fund';
  isConnected?: boolean;
}

export interface CorporateEntity {
  id: string;
  name: string;
  type: 'parent' | 'subsidiary' | 'target' | 'issuer';
  ownership?: number;
  parentId?: string;
}

export interface ShareholdingChanges {
  before: ShareholderData[];
  after: ShareholderData[];
  keyChanges: Array<{
    shareholder: string;
    change: number;
    type: 'increase' | 'decrease' | 'new' | 'exit';
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
