import { CorporateEntity } from './dealStructuring';

export interface TransactionEntity {
  id: string;
  name: string;
  type:
    | 'shareholder'
    | 'stockholder'
    | 'target'
    | 'buyer'
    | 'parent'
    | 'subsidiary'
    | 'intermediary'
    | 'investor'
    | 'lender'
    | 'spv' // Special Purpose Vehicle
    | 'jv' // Joint Venture
    | 'escrow'
    | 'consideration' // For cash/asset payments
    | 'debt' // For debt instruments
    | 'equity_instrument' // For specific equity like preferred shares
    | 'other_stakeholder'
    | 'newco'; // Added 'newco'
  description?: string;
  percentage?: number; // e.g. ownership percentage for shareholders
  value?: number; // e.g. for consideration nodes
  currency?: string;
  metadata?: Record<string, any>; // For additional specific data
  corporateEntityInfo?: CorporateEntity; // Link back to detailed corporate entity if applicable
}

interface TransactionRelationshipBase {
  source: string;
  target: string;
  type: 'subsidiary' | 'consideration' | 'ownership' | 'control' | 'funding' | 'security' | 'merger_into' | 'receives_from' | 'provides_to' | 'other';
  description?: string;
  label?: string;
}

export interface OwnershipRelationship extends TransactionRelationshipBase {
  type: 'ownership' | 'control';
  percentage?: number;
}

export interface ConsiderationRelationship extends TransactionRelationshipBase {
  type: 'consideration' | 'funding';
  value?: number;
  currency?: string;
  form?: 'cash' | 'stock' | 'debt' | 'asset' | 'other';
}

export interface OperationalRelationship extends TransactionRelationshipBase {
  type: 'subsidiary' | 'merger_into' | 'receives_from' | 'provides_to' | 'security' | 'other';
}

export type AnyTransactionRelationship = OwnershipRelationship | ConsiderationRelationship | OperationalRelationship;


export interface TransactionFlowSection {
  entities: TransactionEntity[];
  relationships: AnyTransactionRelationship[];
}

export interface TransactionStep {
  stepNumber: number;
  title: string;
  description: string;
  actors: string[]; // IDs or names of entities involved
  type: 'legal' | 'financial' | 'regulatory' | 'operational' | 'approval';
  durationEstimate?: string; // e.g., "1-2 weeks"
  keyDocuments?: string[];
  details?: Record<string, any>;
}

export interface TransactionFlow {
  before: TransactionFlowSection;
  after: TransactionFlowSection;
  transactionSteps: TransactionStep[];
  transactionContext: {
    type: string;
    description: string;
    amount: number;
    currency: string;
    targetName: string;
    buyerName: string;
    recommendedStructure?: string;
    optimizationInsights?: string[];
    optimizationScore?: number;
  };
}
