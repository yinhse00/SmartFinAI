
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';

export class AfterSectionBuilder {
  private nodeFactory: NodeFactory;

  constructor(nodeFactory: NodeFactory) {
    this.nodeFactory = nodeFactory;
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

    // Acquiring Company Shareholders (Top Level)
    nodes.push(this.nodeFactory.createEntityNode(
      'after-controlling-shareholder',
      LAYOUT_CONFIG.AFTER_X,
      currentY,
      'Controlling Shareholder',
      null,
      'stockholder',
      'acquirer'
    ));

    nodes.push(this.nodeFactory.createEntityNode(
      'after-public-shareholders',
      LAYOUT_CONFIG.AFTER_X + 180,
      currentY,
      'Public Shareholders',
      null,
      'stockholder',
      'acquirer'
    ));

    currentY += 110;

    // Single Acquiring Company (Middle Level)
    nodes.push(this.nodeFactory.createEntityNode(
      'after-acquiring-company',
      LAYOUT_CONFIG.AFTER_X + 90,
      currentY,
      'Acquiring Company',
      'Now controls Target',
      'buyer',
      'acquirer',
      '180px',
      '80px',
      '3px'
    ));

    currentY += 140;

    // Target Company Shareholders (Bottom Level)
    nodes.push(this.nodeFactory.createEntityNode(
      'remaining-target-shareholders',
      LAYOUT_CONFIG.AFTER_X + 180,
      currentY,
      'Remaining Shareholders',
      null,
      'stockholder',
      'target'
    ));

    currentY += 110;

    // Target Company (Bottom Level)
    nodes.push(this.nodeFactory.createEntityNode(
      'after-target-company',
      LAYOUT_CONFIG.AFTER_X + 90,
      currentY,
      'Target Company',
      'Controlled by Acquirer',
      'target',
      'target',
      '180px',
      '80px',
      '3px'
    ));

    return nodes;
  }
}
