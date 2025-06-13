
export interface EnhancedTransactionEntity {
  id: string;
  name: string;
  type: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'holdingco' | 'spv' | 'consideration' | 'management';
  entityClass: 'corporate' | 'individual' | 'institutional' | 'fund' | 'connected' | 'public';
  value?: number;
  percentage?: number;
  description?: string;
  currency?: string;
  jurisdiction?: string;
  listingStatus?: 'listed' | 'private' | 'unlisted';
  isControlling?: boolean;
  votingRights?: number;
  boardSeats?: number;
}

export interface EnhancedTransactionRelationship {
  id: string;
  source: string;
  target: string;
  type: 'ownership' | 'control' | 'management' | 'consideration' | 'voting' | 'subsidiary';
  percentage?: number;
  value?: number;
  currency?: string;
  terms?: string;
  conditions?: string[];
  timing?: string;
  paymentMethod?: 'cash' | 'shares' | 'mixed' | 'contingent';
  isPreTransaction?: boolean;
  isPostTransaction?: boolean;
}

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  timing: string;
  entities: string[];
  relationships: string[];
  considerations?: {
    amount: number;
    currency: string;
    method: string;
  }[];
}

export interface EnhancedTransactionFlow {
  transactionId: string;
  title: string;
  description: string;
  transactionType: string;
  before: {
    entities: EnhancedTransactionEntity[];
    relationships: EnhancedTransactionRelationship[];
    corporateStructure: {
      rootEntity: string;
      hierarchy: Array<{
        parent: string;
        children: string[];
        level: number;
      }>;
    };
  };
  after: {
    entities: EnhancedTransactionEntity[];
    relationships: EnhancedTransactionRelationship[];
    corporateStructure: {
      rootEntity: string;
      hierarchy: Array<{
        parent: string;
        children: string[];
        level: number;
      }>;
    };
  };
  transactionSteps: TransactionStep[];
  keyMetrics: {
    totalConsideration: number;
    currency: string;
    acquisitionPercentage: number;
    controlChange: boolean;
    listingImpact: string;
  };
  validationResults: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    dataCompleteness: number;
  };
}

export interface VisualLayout {
  sections: {
    before: { x: number; y: number; width: number; height: number };
    transaction: { x: number; y: number; width: number; height: number };
    after: { x: number; y: number; width: number; height: number };
  };
  entityPositions: Map<string, { x: number; y: number }>;
  hierarchyLevels: Map<string, number>;
}
