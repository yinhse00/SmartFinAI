
import { Edge, MarkerType } from '@xyflow/react';
import { TransactionFlow } from '@/types/transactionFlow';

export class EdgeFactory {
  private edges: Edge[] = [];
  private transactionData?: TransactionFlow;

  constructor(transactionData?: TransactionFlow) {
    this.transactionData = transactionData;
  }

  createOwnershipEdge(
    id: string,
    source: string,
    target: string,
    percentage: string,
    color: string = '#2563eb',
    strokeWidth: number = 3
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'straight',
      style: {
        stroke: color,
        strokeWidth
      },
      label: percentage,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: color,
        backgroundColor: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb'
      }
    };
  }

  createTransactionFlowEdge(
    id: string,
    source: string,
    target: string,
    label: string,
    color: string = '#16a34a',
    strokeWidth: number = 4,
    dashed: boolean = true
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'straight',
      style: {
        stroke: color,
        strokeWidth,
        ...(dashed && { strokeDasharray: '8,4' })
      },
      label,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: color,
        backgroundColor: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        border: `1px solid ${color}`
      }
    };
  }

  createBidirectionalTransactionEdges(): Edge[] {
    // Extract dynamic values from transaction data
    const sharePercentage = this.getAcquisitionPercentage();
    const considerationAmount = this.getConsiderationAmount();
    
    return [
      // Share transfer: from target shareholders to acquiring company
      {
        id: 'share-transfer',
        source: 'target-existing-shareholders',
        target: 'acquiring-company',
        type: 'smoothstep',
        style: {
          stroke: '#2563eb',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: `${sharePercentage}% Shares`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#2563eb',
          backgroundColor: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #2563eb'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563eb'
        }
      },
      // Cash consideration: from acquiring company to target shareholders
      {
        id: 'cash-consideration',
        source: 'acquiring-company',
        target: 'target-existing-shareholders',
        type: 'smoothstep',
        style: {
          stroke: '#16a34a',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: considerationAmount,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#16a34a',
          backgroundColor: '#f0fdf4',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #16a34a'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#16a34a'
        }
      }
    ];
  }

  createConsiderationEdge(
    id: string,
    source: string,
    target: string,
    label: string = 'HK$1,000M'
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'smoothstep',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      label,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a',
        backgroundColor: '#f0fdf4',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid #16a34a'
      },
      labelBgBorderRadius: 4,
      labelBgPadding: [2, 6]
    };
  }

  // Helper methods to extract dynamic data
  private getAcquisitionPercentage(): number {
    // Try to find acquisition percentage from transaction data
    if (this.transactionData?.after?.relationships) {
      const acquisitionRelationship = this.transactionData.after.relationships.find(
        rel => rel.type === 'ownership' && rel.percentage
      );
      return acquisitionRelationship?.percentage || 70;
    }
    return 70; // Default fallback
  }

  private getConsiderationAmount(): string {
    // Try to find consideration amount from transaction data
    if (this.transactionData?.after?.relationships) {
      const considerationRelationship = this.transactionData.after.relationships.find(
        rel => rel.type === 'consideration' && rel.value
      );
      if (considerationRelationship?.value) {
        return `HK$${considerationRelationship.value.toLocaleString()}M`;
      }
    }
    return 'HK$1,000M'; // Default fallback
  }

  getEdges(): Edge[] {
    return this.edges;
  }

  addEdge(edge: Edge): void {
    this.edges.push(edge);
  }

  clearEdges(): void {
    this.edges = [];
  }
}
