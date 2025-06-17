
import React from 'react';
import { Node } from '@xyflow/react';
import { TransactionFlow } from '@/types/transactionFlow';
import { formatConsiderationAmount } from '../utils/nodeStyleUtils';
import { POSITIONS, Y_POSITIONS, LAYOUT_CONFIG } from '../utils/layoutConstants';

export const createTransactionSectionNodes = (transactionContext: TransactionFlow['transactionContext']): Node[] => {
  const nodes: Node[] = [];
  const transactionY = LAYOUT_CONFIG.START_Y + 200;

  // Transaction header
  nodes.push({
    id: 'transaction-header',
    type: 'default',
    position: { x: POSITIONS.TRANSACTION_X, y: Y_POSITIONS.SECTION_HEADER_Y },
    data: { 
      label: (
        <div className="text-lg font-bold text-blue-800">
          TRANSACTION
        </div>
      )
    },
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      width: '350px',
      height: '40px'
    },
    draggable: false,
    selectable: false
  });

  // Transaction details
  nodes.push({
    id: 'transaction-details',
    type: 'default',
    position: { x: POSITIONS.TRANSACTION_X, y: transactionY },
    data: {
      label: (
        <div className="text-center p-4">
          <div className="text-lg font-bold mb-3 text-blue-900">
            {transactionContext?.type || 'Transaction'}
          </div>
          <div className="space-y-2 text-xs text-left">
            <div className="bg-blue-50 p-2 rounded">
              <strong className="text-blue-800">Type:</strong>
              <div className="text-blue-700">
                {transactionContext?.description || `${transactionContext?.type || 'Transaction'} transaction`}
              </div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <strong className="text-green-800">Consideration:</strong>
              <div className="text-green-700">
                {formatConsiderationAmount(transactionContext?.amount || 0, transactionContext?.currency || 'HKD')}
              </div>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <strong className="text-orange-800">Structure:</strong>
              <div className="text-orange-700">
                {transactionContext?.recommendedStructure || 'Standard structure'}
              </div>
            </div>
          </div>
        </div>
      )
    },
    style: {
      backgroundColor: '#f8fafc',
      border: '3px solid #2563eb',
      borderRadius: '12px',
      width: '320px',
      height: '200px'
    },
    draggable: false,
    selectable: false
  });

  return nodes;
};
