
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';
import { TransactionFlow } from '@/types/transactionFlow';

export class AfterSectionBuilder {
  private nodeFactory: NodeFactory;
  private transactionData?: TransactionFlow;

  constructor(nodeFactory: NodeFactory, transactionData?: TransactionFlow) {
    this.nodeFactory = nodeFactory;
    this.transactionData = transactionData;
  }

  buildAfterSection(): Node[] {
    const nodes: Node[] = [];
    let currentY = LAYOUT_CONFIG.START_Y;

    // After Section Header
    nodes.push(this.nodeFactory.createHeaderNode(
      'after-header',
      LAYOUT_CONFIG.AFTER_X,
      currentY,
      'AFTER TRANSACTION'
    ));

    currentY += 80;

    // Extract actual after-transaction data
    const afterEntities = this.transactionData?.after?.entities || [];
    const afterRelationships = this.transactionData?.after?.relationships || [];
    
    console.log('After entities:', afterEntities);
    console.log('After relationships:', afterRelationships);

    // Find entities by type
    const buyerEntity = afterEntities.find(entity => entity.type === 'buyer');
    const targetEntity = afterEntities.find(entity => entity.type === 'target');
    const stockholderEntities = afterEntities.filter(entity => entity.type === 'stockholder');

    // Get acquiring company shareholders (those who own the buyer)
    const buyerShareholders = stockholderEntities.filter(shareholder =>
      afterRelationships.some(rel => 
        rel.source === shareholder.id && 
        rel.target === buyerEntity?.id && 
        rel.type === 'ownership'
      )
    );

    // Create buyer shareholder nodes with actual data
    let shareholderX = LAYOUT_CONFIG.AFTER_X;
    buyerShareholders.forEach((shareholder, index) => {
      const shareholderRelationship = afterRelationships.find(
        rel => rel.source === shareholder.id && rel.target === buyerEntity?.id
      );
      
      nodes.push(this.nodeFactory.createEntityNode(
        `after-shareholder-${shareholder.id}`,
        shareholderX,
        currentY,
        shareholder.name || `Shareholder ${index + 1}`,
        shareholderRelationship?.percentage ? `${shareholderRelationship.percentage}%` : null,
        'stockholder',
        'acquirer'
      ));
      
      shareholderX += 180;
    });

    currentY += 110;

    // Acquiring Company (now controlling target)
    const buyerName = buyerEntity?.name || 'Acquiring Company';
    const acquisitionRelationship = afterRelationships.find(
      rel => rel.source === buyerEntity?.id && rel.target === targetEntity?.id && rel.type === 'ownership'
    );
    const acquisitionPercentage = acquisitionRelationship?.percentage;
    
    nodes.push(this.nodeFactory.createEntityNode(
      'after-acquiring-company',
      LAYOUT_CONFIG.AFTER_X + 90,
      currentY,
      buyerName,
      acquisitionPercentage ? `Controls ${acquisitionPercentage}% of Target` : 'Now controls Target',
      'buyer',
      'acquirer',
      '180px',
      '80px',
      '3px'
    ));

    currentY += 140;

    // Remaining target shareholders (those still owning target but not the buyer)
    const remainingTargetShareholders = stockholderEntities.filter(shareholder =>
      afterRelationships.some(rel => 
        rel.source === shareholder.id && 
        rel.target === targetEntity?.id && 
        rel.type === 'ownership' &&
        rel.source !== buyerEntity?.id // Not the acquiring company
      )
    );

    if (remainingTargetShareholders.length > 0) {
      let remainingX = LAYOUT_CONFIG.AFTER_X;
      remainingTargetShareholders.forEach((shareholder, index) => {
        const shareholderRelationship = afterRelationships.find(
          rel => rel.source === shareholder.id && rel.target === targetEntity?.id
        );
        
        nodes.push(this.nodeFactory.createEntityNode(
          `remaining-shareholder-${shareholder.id}`,
          remainingX,
          currentY,
          shareholder.name || 'Remaining Shareholders',
          shareholderRelationship?.percentage ? `${shareholderRelationship.percentage}%` : null,
          'stockholder',
          'target'
        ));
        
        remainingX += 180;
      });
    }

    currentY += 110;

    // Target Company with actual name and new status
    const targetName = targetEntity?.name || 'Target Company';
    const controlStatus = acquisitionPercentage 
      ? `${acquisitionPercentage}% owned by ${buyerName}`
      : 'Controlled by Acquirer';
    
    nodes.push(this.nodeFactory.createEntityNode(
      'after-target-company',
      LAYOUT_CONFIG.AFTER_X + 90,
      currentY,
      targetName,
      controlStatus,
      'target',
      'target',
      '180px',
      '80px',
      '3px'
    ));

    return nodes;
  }
}
