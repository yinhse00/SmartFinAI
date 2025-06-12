
import { Node, Edge } from '@xyflow/react';

export interface TransactionEntity {
  id: string;
  name: string;
  type: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'newco' | 'consideration';
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
  // Add transaction context for real data
  transactionContext?: {
    type: string;
    amount: number;
    currency: string;
    targetName: string;
    buyerName: string;
    description: string;
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
