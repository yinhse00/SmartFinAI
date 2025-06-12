
import { Edge } from '@xyflow/react';
import { EdgeFactory } from '../factories/EdgeFactory';
import { TransactionFlow } from '@/types/transactionFlow';

export class EdgeBuilder {
  private edgeFactory: EdgeFactory;
  private transactionData?: TransactionFlow;

  constructor(edgeFactory: EdgeFactory, transactionData?: TransactionFlow) {
    this.edgeFactory = edgeFactory;
    this.transactionData = transactionData;
  }

  buildAllEdges(): Edge[] {
    const edges: Edge[] = [];

    // Before section ownership edges
    edges.push(...this.buildBeforeOwnershipEdges());
    
    // After section ownership edges
    edges.push(...this.buildAfterOwnershipEdges());
    
    // Bidirectional transaction flow edges
    edges.push(...this.buildBidirectionalTransactionEdges());
    
    // Other transaction flow edges
    edges.push(...this.buildOtherTransactionFlowEdges());

    return edges;
  }

  private buildBeforeOwnershipEdges(): Edge[] {
    // Extract dynamic data from transaction if available
    const beforeData = this.transactionData?.before;
    
    return [
      this.edgeFactory.createOwnershipEdge(
        'controlling-to-acquirer',
        'controlling-shareholder',
        'acquiring-company',
        this.getShareholderPercentage(beforeData, 'controlling') || '70%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'public-to-acquirer',
        'public-shareholders',
        'acquiring-company',
        this.getShareholderPercentage(beforeData, 'public') || '30%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'target-shareholders-to-target',
        'target-existing-shareholders',
        'target-company',
        '100%',
        '#f59e0b'
      )
    ];
  }

  private buildAfterOwnershipEdges(): Edge[] {
    // Extract dynamic data from transaction if available
    const afterData = this.transactionData?.after;
    const acquisitionPercentage = this.getAcquisitionPercentage();
    const remainingPercentage = 100 - acquisitionPercentage;
    
    return [
      this.edgeFactory.createOwnershipEdge(
        'after-controlling-to-acquirer',
        'after-controlling-shareholder',
        'after-acquiring-company',
        this.getShareholderPercentage(afterData, 'controlling') || '70%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'after-public-to-acquirer',
        'after-public-shareholders',
        'after-acquiring-company',
        this.getShareholderPercentage(afterData, 'public') || '30%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'after-acquirer-to-target',
        'after-acquiring-company',
        'after-target-company',
        `${acquisitionPercentage}%`,
        '#2563eb',
        4
      ),
      this.edgeFactory.createOwnershipEdge(
        'remaining-to-target',
        'remaining-target-shareholders',
        'after-target-company',
        `${remainingPercentage}%`,
        '#f59e0b'
      )
    ];
  }

  private buildBidirectionalTransactionEdges(): Edge[] {
    return this.edgeFactory.createBidirectionalTransactionEdges();
  }

  private buildOtherTransactionFlowEdges(): Edge[] {
    const acquisitionPercentage = this.getAcquisitionPercentage();
    
    return [
      this.edgeFactory.createTransactionFlowEdge(
        'transaction-flow',
        'acquiring-company',
        'transaction-details',
        `Acquires ${acquisitionPercentage}%`
      ),
      this.edgeFactory.createTransactionFlowEdge(
        'transaction-result',
        'transaction-details',
        'after-target-company',
        'Result',
        '#7c3aed'
      )
    ];
  }

  // Helper methods to extract dynamic data
  private getShareholderPercentage(sectionData: any, shareholderType: string): string | null {
    if (!sectionData?.relationships) return null;
    
    const relationship = sectionData.relationships.find((rel: any) => 
      rel.type === 'ownership' && 
      rel.source?.toLowerCase().includes(shareholderType.toLowerCase())
    );
    
    return relationship?.percentage ? `${relationship.percentage}%` : null;
  }

  private getAcquisitionPercentage(): number {
    if (this.transactionData?.after?.relationships) {
      const acquisitionRelationship = this.transactionData.after.relationships.find(
        rel => rel.type === 'ownership' && rel.percentage
      );
      return acquisitionRelationship?.percentage || 70;
    }
    return 70; // Default fallback
  }
}
