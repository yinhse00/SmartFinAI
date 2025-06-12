
import { Edge } from '@xyflow/react';
import { EdgeFactory } from '../factories/EdgeFactory';

export class EdgeBuilder {
  private edgeFactory: EdgeFactory;

  constructor(edgeFactory: EdgeFactory) {
    this.edgeFactory = edgeFactory;
  }

  buildAllEdges(): Edge[] {
    const edges: Edge[] = [];

    // Before section ownership edges
    edges.push(...this.buildBeforeOwnershipEdges());
    
    // After section ownership edges
    edges.push(...this.buildAfterOwnershipEdges());
    
    // Transaction flow edges
    edges.push(...this.buildTransactionFlowEdges());

    return edges;
  }

  private buildBeforeOwnershipEdges(): Edge[] {
    return [
      this.edgeFactory.createOwnershipEdge(
        'controlling-to-acquirer',
        'controlling-shareholder',
        'acquiring-company',
        '70%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'public-to-acquirer',
        'public-shareholders',
        'acquiring-company',
        '30%'
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
    return [
      this.edgeFactory.createOwnershipEdge(
        'after-controlling-to-acquirer',
        'after-controlling-shareholder',
        'after-acquiring-company',
        '70%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'after-public-to-acquirer',
        'after-public-shareholders',
        'after-acquiring-company',
        '30%'
      ),
      this.edgeFactory.createOwnershipEdge(
        'after-acquirer-to-target',
        'after-acquiring-company',
        'after-target-company',
        '70%',
        '#2563eb',
        4
      ),
      this.edgeFactory.createOwnershipEdge(
        'remaining-to-target',
        'remaining-target-shareholders',
        'after-target-company',
        '30%',
        '#f59e0b'
      )
    ];
  }

  private buildTransactionFlowEdges(): Edge[] {
    return [
      this.edgeFactory.createTransactionFlowEdge(
        'transaction-flow',
        'acquiring-company',
        'transaction-details',
        'Acquires 70%'
      ),
      this.edgeFactory.createConsiderationEdge(
        'consideration-flow',
        'acquiring-company',
        'target-company'
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
}
