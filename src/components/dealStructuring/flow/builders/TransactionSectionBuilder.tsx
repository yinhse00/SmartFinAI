
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';
import { TransactionFlow } from '@/types/transactionFlow';

export class TransactionSectionBuilder {
  private nodeFactory: NodeFactory;
  private transactionData?: TransactionFlow;

  constructor(nodeFactory: NodeFactory, transactionData?: TransactionFlow) {
    this.nodeFactory = nodeFactory;
    this.transactionData = transactionData;
  }

  buildTransactionSection(): Node[] {
    const nodes: Node[] = [];
    const transactionY = LAYOUT_CONFIG.START_Y + 200;

    // Transaction Header
    nodes.push(this.nodeFactory.createHeaderNode(
      'transaction-header',
      LAYOUT_CONFIG.TRANSACTION_X,
      LAYOUT_CONFIG.START_Y,
      'DEAL STRUCTURE'
    ));

    // Extract actual transaction data
    const afterEntities = this.transactionData?.after?.entities || [];
    const afterRelationships = this.transactionData?.after?.relationships || [];
    const transactionSteps = this.transactionData?.transactionSteps || [];

    // Find key entities and relationships
    const buyerEntity = afterEntities.find(entity => entity.type === 'buyer');
    const targetEntity = afterEntities.find(entity => entity.type === 'target');
    const considerationEntity = afterEntities.find(entity => entity.type === 'consideration');
    
    const acquisitionRelationship = afterRelationships.find(
      rel => rel.source === buyerEntity?.id && rel.target === targetEntity?.id && rel.type === 'ownership'
    );
    
    const considerationRelationship = afterRelationships.find(
      rel => rel.type === 'consideration'
    );

    // Extract actual values
    const acquisitionPercentage = acquisitionRelationship?.percentage || 70;
    const considerationAmount = considerationRelationship?.value || considerationEntity?.value || 1000;
    const buyerName = buyerEntity?.name || 'Acquiring Company';
    const targetName = targetEntity?.name || 'Target Company';

    console.log('Transaction details:', {
      acquisitionPercentage,
      considerationAmount,
      buyerName,
      targetName,
      transactionSteps: transactionSteps.length
    });

    // Create dynamic transaction details node
    nodes.push(this.nodeFactory.createDynamicTransactionDetailsNode(
      'transaction-details',
      LAYOUT_CONFIG.TRANSACTION_X,
      transactionY,
      {
        buyerName,
        targetName,
        acquisitionPercentage,
        considerationAmount,
        transactionSteps
      }
    ));

    return nodes;
  }
}
