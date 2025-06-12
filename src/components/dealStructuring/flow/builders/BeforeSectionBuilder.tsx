
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';
import { TransactionFlow } from '@/types/transactionFlow';

export class BeforeSectionBuilder {
  private nodeFactory: NodeFactory;
  private transactionData?: TransactionFlow;

  constructor(nodeFactory: NodeFactory, transactionData?: TransactionFlow) {
    this.nodeFactory = nodeFactory;
    this.transactionData = transactionData;
  }

  buildBeforeSection(): Node[] {
    const nodes: Node[] = [];
    let currentY = LAYOUT_CONFIG.START_Y;

    // Before Section Header
    nodes.push(this.nodeFactory.createHeaderNode(
      'before-header',
      LAYOUT_CONFIG.BEFORE_X,
      currentY,
      'BEFORE TRANSACTION'
    ));

    currentY += 80;

    // Extract actual shareholder data
    const beforeEntities = this.transactionData?.before?.entities || [];
    const beforeRelationships = this.transactionData?.before?.relationships || [];
    
    // Find acquiring company and its shareholders
    const buyerEntity = beforeEntities.find(entity => entity.type === 'buyer');
    const stockholderEntities = beforeEntities.filter(entity => entity.type === 'stockholder');
    const targetEntity = beforeEntities.find(entity => entity.type === 'target');

    console.log('Before entities:', beforeEntities);
    console.log('Buyer entity:', buyerEntity);
    console.log('Stockholder entities:', stockholderEntities);
    console.log('Target entity:', targetEntity);

    // Acquiring Company Section
    nodes.push(this.nodeFactory.createSectionHeaderNode(
      'acquirer-section-header',
      LAYOUT_CONFIG.BEFORE_X,
      currentY,
      'ACQUIRING COMPANY STRUCTURE',
      'text-blue-700'
    ));

    currentY += 60;

    // Create shareholder nodes with actual data
    let shareholderX = LAYOUT_CONFIG.BEFORE_X;
    stockholderEntities.forEach((shareholder, index) => {
      const shareholderRelationship = beforeRelationships.find(
        rel => rel.source === shareholder.id && rel.type === 'ownership'
      );
      
      const shareholderName = shareholder.name || `Shareholder ${index + 1}`;
      const percentage = shareholderRelationship?.percentage || shareholder.percentage;
      
      nodes.push(this.nodeFactory.createEntityNode(
        `shareholder-${shareholder.id}`,
        shareholderX,
        currentY,
        shareholderName,
        percentage ? `${percentage}%` : null,
        'stockholder',
        'acquirer'
      ));
      
      shareholderX += 180; // Space out shareholders horizontally
    });

    currentY += 110;

    // Acquiring Company with actual name
    const buyerName = buyerEntity?.name || 'Acquiring Company';
    nodes.push(this.nodeFactory.createEntityNode(
      'acquiring-company',
      LAYOUT_CONFIG.BEFORE_X + 90,
      currentY,
      buyerName,
      buyerEntity?.description || 'Listed Entity',
      'buyer',
      'acquirer',
      '180px',
      '80px'
    ));

    currentY += 140;

    // Target Company Section
    nodes.push(this.nodeFactory.createSectionHeaderNode(
      'target-section-header',
      LAYOUT_CONFIG.BEFORE_X,
      currentY,
      'TARGET COMPANY STRUCTURE',
      'text-orange-700'
    ));

    currentY += 60;

    // Target shareholders with actual data
    const targetShareholders = beforeEntities.filter(entity => 
      beforeRelationships.some(rel => 
        rel.source === entity.id && 
        rel.target === targetEntity?.id && 
        rel.type === 'ownership'
      )
    );

    if (targetShareholders.length > 0) {
      targetShareholders.forEach((shareholder, index) => {
        const shareholderRelationship = beforeRelationships.find(
          rel => rel.source === shareholder.id && rel.target === targetEntity?.id
        );
        
        nodes.push(this.nodeFactory.createEntityNode(
          `target-shareholder-${shareholder.id}`,
          LAYOUT_CONFIG.BEFORE_X + 90 + (index * 100),
          currentY,
          shareholder.name || 'Existing Shareholders',
          shareholderRelationship?.percentage ? `${shareholderRelationship.percentage}%` : null,
          'stockholder',
          'target'
        ));
      });
    } else {
      // Fallback if no specific target shareholders found
      nodes.push(this.nodeFactory.createEntityNode(
        'target-existing-shareholders',
        LAYOUT_CONFIG.BEFORE_X + 90,
        currentY,
        'Existing Shareholders',
        '100%',
        'stockholder',
        'target'
      ));
    }

    currentY += 110;

    // Target Company with actual name
    const targetName = targetEntity?.name || 'Target Company';
    nodes.push(this.nodeFactory.createEntityNode(
      'target-company',
      LAYOUT_CONFIG.BEFORE_X + 90,
      currentY,
      targetName,
      targetEntity?.description || 'Listed Entity',
      'target',
      'target',
      '180px',
      '80px'
    ));

    return nodes;
  }
}
