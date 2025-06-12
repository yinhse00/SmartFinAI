
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';

export class BeforeSectionBuilder {
  private nodeFactory: NodeFactory;

  constructor(nodeFactory: NodeFactory) {
    this.nodeFactory = nodeFactory;
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

    // Acquiring Company Section
    nodes.push(this.nodeFactory.createSectionHeaderNode(
      'acquirer-section-header',
      LAYOUT_CONFIG.BEFORE_X,
      currentY,
      'ACQUIRING COMPANY STRUCTURE',
      'text-blue-700'
    ));

    currentY += 60;

    // Controlling Shareholder
    nodes.push(this.nodeFactory.createEntityNode(
      'controlling-shareholder',
      LAYOUT_CONFIG.BEFORE_X,
      currentY,
      'Controlling Shareholder',
      null,
      'stockholder',
      'acquirer'
    ));

    // Public Shareholders
    nodes.push(this.nodeFactory.createEntityNode(
      'public-shareholders',
      LAYOUT_CONFIG.BEFORE_X + 180,
      currentY,
      'Public Shareholders',
      null,
      'stockholder',
      'acquirer'
    ));

    currentY += 110;

    // Acquiring Company
    nodes.push(this.nodeFactory.createEntityNode(
      'acquiring-company',
      LAYOUT_CONFIG.BEFORE_X + 90,
      currentY,
      'Acquiring Company',
      'Listed Entity',
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

    // Target Existing Shareholders
    nodes.push(this.nodeFactory.createEntityNode(
      'target-existing-shareholders',
      LAYOUT_CONFIG.BEFORE_X + 90,
      currentY,
      'Existing Shareholders',
      null,
      'stockholder',
      'target'
    ));

    currentY += 110;

    // Target Company
    nodes.push(this.nodeFactory.createEntityNode(
      'target-company',
      LAYOUT_CONFIG.BEFORE_X + 90,
      currentY,
      'Target Company',
      'Listed Entity',
      'target',
      'target',
      '180px',
      '80px'
    ));

    return nodes;
  }
}
