
import { Node } from '@xyflow/react';
import { NodeFactory } from '../factories/NodeFactory';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';

export class TransactionSectionBuilder {
  private nodeFactory: NodeFactory;

  constructor(nodeFactory: NodeFactory) {
    this.nodeFactory = nodeFactory;
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

    // Transaction Details
    nodes.push(this.nodeFactory.createTransactionDetailsNode(
      'transaction-details',
      LAYOUT_CONFIG.TRANSACTION_X,
      transactionY
    ));

    return nodes;
  }
}
