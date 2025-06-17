
import { Edge, Node } from '@xyflow/react';
import { AnyTransactionRelationship, OwnershipRelationship, ConsiderationRelationship, TransactionFlow } from '@/types/transactionFlow';
import { formatConsiderationAmount } from '../utils/nodeStyleUtils';

export const createEdges = (
  beforeRelationships: AnyTransactionRelationship[],
  afterRelationships: AnyTransactionRelationship[],
  nodes: Node[],
  transactionContext: TransactionFlow['transactionContext']
): Edge[] => {
  const edges: Edge[] = [];

  // Before relationships edges
  beforeRelationships.forEach((rel, index) => {
    if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
      let labelText = '';
      if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
        labelText = `${(rel as OwnershipRelationship).percentage}%`;
      }

      edges.push({
        id: `before-edge-${index}`,
        source: rel.source,
        target: rel.target,
        type: 'straight',
        style: {
          stroke: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
          strokeWidth: 2
        },
        label: labelText,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: '3px'
        }
      });
    }
  });

  // After relationships edges
  afterRelationships.forEach((rel, index) => {
    if (rel.source === 'after-acquiring-company' && rel.target === 'after-target-company' && (rel.type === 'ownership' || rel.type === 'control')) {
      const percentage = (rel as OwnershipRelationship).percentage;
      edges.push({
        id: `after-target-ownership-${index}`,
        source: 'after-acquiring-as-shareholder',
        target: 'after-target-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 2
        },
        label: percentage !== undefined ? `${percentage}%` : '',
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#2563eb',
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: '3px'
        }
      });
      return;
    }
    
    if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
      let labelText = '';
      if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
        labelText = `${(rel as OwnershipRelationship).percentage}%`;
      } else if ((rel.type === 'consideration' || rel.type === 'funding') && (rel as ConsiderationRelationship).value !== undefined) {
        labelText = formatConsiderationAmount((rel as ConsiderationRelationship).value || 0, transactionContext?.currency || 'HKD');
      }

      edges.push({
        id: `after-edge-${index}`,
        source: rel.source,
        target: rel.target,
        type: 'straight',
        style: {
          stroke: rel.type === 'consideration' ? '#16a34a' : (rel.type === 'ownership' || rel.type === 'control') ? '#2563eb' : '#f59e0b',
          strokeWidth: rel.type === 'consideration' ? 3 : 2
        },
        label: labelText,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: rel.type === 'consideration' ? '#16a34a' : (rel.type === 'ownership' || rel.type === 'control') ? '#2563eb' : '#f59e0b',
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: '3px'
        }
      });
    }
  });

  // Transaction flow arrows
  edges.push({
    id: 'transaction-flow-in',
    source: 'before-acquiring-company',
    target: 'transaction-details',
    type: 'straight',
    style: {
      stroke: '#16a34a',
      strokeWidth: 3,
      strokeDasharray: '8,4'
    },
    label: 'Initiates',
    labelStyle: {
      fontSize: '11px',
      fontWeight: 'bold',
      fill: '#16a34a',
      backgroundColor: 'white',
      padding: '2px 4px',
      borderRadius: '3px'
    }
  });

  edges.push({
    id: 'transaction-flow-out',
    source: 'transaction-details',
    target: 'after-target-company',
    type: 'straight',
    style: {
      stroke: '#7c3aed',
      strokeWidth: 3,
      strokeDasharray: '8,4'
    },
    label: 'Results In',
    labelStyle: {
      fontSize: '11px',
      fontWeight: 'bold',
      fill: '#7c3aed',
      backgroundColor: 'white',
      padding: '2px 4px',
      borderRadius: '3px'
    }
  });

  return edges;
};
