
import { Node, Edge } from '@xyflow/react';

export interface TransactionEntity {
  id: string;
  name: string;
  type: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'newco' | 'consideration' | 'parent'; // Added 'parent'
  value?: number;
  percentage?: number;
  description?: string;
  currency?: string;
}

export interface TransactionFlow {
  before: {
    entities: TransactionEntity[];
    relationships: Array<{
      source: string;
      target: string;
      type: 'ownership' | 'control' | 'subsidiary';
      percentage?: number;
    }>;
  };
  after: {
    entities: TransactionEntity[];
    relationships: Array<{
      source: string;
      target: string;
      type: 'ownership' | 'control' | 'subsidiary' | 'consideration';
      percentage?: number;
      value?: number;
    }>;
  };
  transactionSteps: Array<{
    id: string;
    title: string;
    description: string;
    entities: string[];
  }>;
  // Enhanced transaction context with optimization data
  transactionContext?: {
    type: string;
    amount: number;
    currency: string;
    targetName: string;
    buyerName: string;
    description: string;
    optimizationInsights?: string[];
    recommendedStructure?: string;
    optimizationScore?: number;
  };
}

export interface FlowDiagramNode extends Node {
  data: {
    label: string;
    entityType: TransactionEntity['type'];
    value?: number;
    percentage?: number;
    description?: string;
  };
}

export interface FlowDiagramEdge extends Edge {
  data?: {
    type: 'ownership' | 'control' | 'subsidiary' | 'consideration';
    percentage?: number;
    value?: number;
  };
}
