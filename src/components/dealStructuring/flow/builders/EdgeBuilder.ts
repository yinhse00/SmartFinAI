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
    const edges: Edge[] = [];
    
    if (!this.transactionData?.before) return edges;

    const beforeEntities = this.transactionData.before.entities;
    const beforeRelationships = this.transactionData.before.relationships;
    
    // Find buyer entity
    const buyerEntity = beforeEntities.find(entity => entity.type === 'buyer');
    if (!buyerEntity) return edges;

    // Create edges from shareholders to acquiring company
    const stockholderEntities = beforeEntities.filter(entity => entity.type === 'stockholder');
    
    stockholderEntities.forEach(shareholder => {
      const relationship = beforeRelationships.find(
        rel => rel.source === shareholder.id && rel.target === buyerEntity.id && rel.type === 'ownership'
      );
      
      if (relationship?.percentage) {
        edges.push(this.edgeFactory.createOwnershipEdge(
          `before-ownership-${shareholder.id}`,
          `shareholder-${shareholder.id}`,
          'acquiring-company',
          `${relationship.percentage}%`
        ));
      }
    });

    // Target company ownership edges
    const targetEntity = beforeEntities.find(entity => entity.type === 'target');
    if (targetEntity) {
      const targetShareholders = beforeEntities.filter(entity => 
        beforeRelationships.some(rel => 
          rel.source === entity.id && 
          rel.target === targetEntity.id && 
          rel.type === 'ownership'
        )
      );

      targetShareholders.forEach(shareholder => {
        const relationship = beforeRelationships.find(
          rel => rel.source === shareholder.id && rel.target === targetEntity.id
        );
        
        if (relationship?.percentage) {
          edges.push(this.edgeFactory.createOwnershipEdge(
            `target-ownership-${shareholder.id}`,
            `target-shareholder-${shareholder.id}`,
            'target-company',
            `${relationship.percentage}%`,
            '#f59e0b'
          ));
        }
      });

      // If no specific target shareholders, create a fallback edge
      if (targetShareholders.length === 0) {
        edges.push(this.edgeFactory.createOwnershipEdge(
          'target-shareholders-to-target',
          'target-existing-shareholders',
          'target-company',
          '100%',
          '#f59e0b'
        ));
      }
    }

    return edges;
  }

  private buildAfterOwnershipEdges(): Edge[] {
    const edges: Edge[] = [];
    
    if (!this.transactionData?.after) return edges;

    const afterEntities = this.transactionData.after.entities;
    const afterRelationships = this.transactionData.after.relationships;
    
    // Find buyer and target entities
    const buyerEntity = afterEntities.find(entity => entity.type === 'buyer');
    const targetEntity = afterEntities.find(entity => entity.type === 'target');
    
    if (!buyerEntity || !targetEntity) return edges;

    // Create edges from shareholders to acquiring company
    const buyerShareholders = afterEntities.filter(entity => 
      entity.type === 'stockholder' && 
      afterRelationships.some(rel => 
        rel.source === entity.id && 
        rel.target === buyerEntity.id && 
        rel.type === 'ownership'
      )
    );

    buyerShareholders.forEach(shareholder => {
      const relationship = afterRelationships.find(
        rel => rel.source === shareholder.id && rel.target === buyerEntity.id
      );
      
      if (relationship?.percentage) {
        edges.push(this.edgeFactory.createOwnershipEdge(
          `after-ownership-${shareholder.id}`,
          `after-shareholder-${shareholder.id}`,
          'after-acquiring-company',
          `${relationship.percentage}%`
        ));
      }
    });

    // Acquisition relationship - acquiring company to target
    const acquisitionRelationship = afterRelationships.find(
      rel => rel.source === buyerEntity.id && rel.target === targetEntity.id && rel.type === 'ownership'
    );
    
    if (acquisitionRelationship?.percentage) {
      edges.push(this.edgeFactory.createOwnershipEdge(
        'after-acquirer-to-target',
        'after-acquiring-company',
        'after-target-company',
        `${acquisitionRelationship.percentage}%`,
        '#2563eb',
        4
      ));
    }

    // Remaining target shareholders
    const remainingTargetShareholders = afterEntities.filter(entity => 
      entity.type === 'stockholder' && 
      afterRelationships.some(rel => 
        rel.source === entity.id && 
        rel.target === targetEntity.id && 
        rel.type === 'ownership' &&
        rel.source !== buyerEntity.id
      )
    );

    remainingTargetShareholders.forEach(shareholder => {
      const relationship = afterRelationships.find(
        rel => rel.source === shareholder.id && rel.target === targetEntity.id
      );
      
      if (relationship?.percentage) {
        edges.push(this.edgeFactory.createOwnershipEdge(
          `remaining-ownership-${shareholder.id}`,
          `remaining-shareholder-${shareholder.id}`,
          'after-target-company',
          `${relationship.percentage}%`,
          '#f59e0b'
        ));
      }
    });

    return edges;
  }

  private buildBidirectionalTransactionEdges(): Edge[] {
    if (!this.transactionData?.before) return [];

    const beforeEntities = this.transactionData.before.entities;
    const targetEntity = beforeEntities.find(entity => entity.type === 'target');
    
    // Find target shareholders to connect bidirectional edges
    const targetShareholders = beforeEntities.filter(entity => 
      this.transactionData?.before?.relationships.some(rel => 
        rel.source === entity.id && 
        rel.target === targetEntity?.id && 
        rel.type === 'ownership'
      )
    );

    // Use the first target shareholder or fallback to generic node
    const targetShareholderNodeId = targetShareholders.length > 0 
      ? `target-shareholder-${targetShareholders[0].id}`
      : 'target-existing-shareholders';

    return this.edgeFactory.createBidirectionalTransactionEdges(
      'acquiring-company',
      targetShareholderNodeId
    );
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

  // Helper method to extract dynamic data
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
