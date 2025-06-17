
import React from 'react';
import { Node } from '@xyflow/react';
import { TransactionEntity } from '@/types/transactionFlow';
import { getNodeColors } from '../utils/nodeStyleUtils';
import { POSITIONS, Y_POSITIONS } from '../utils/layoutConstants';

export const createAfterStructureNodes = (entities: TransactionEntity[]): Node[] => {
  const nodes: Node[] = [];

  // Section headers
  nodes.push({
    id: 'after-header',
    type: 'default',
    position: { x: POSITIONS.AFTER_X, y: Y_POSITIONS.SECTION_HEADER_Y },
    data: { 
      label: (
        <div className="text-lg font-bold text-gray-800">
          AFTER TRANSACTION
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

  nodes.push({
    id: 'after-acquiring-header',
    type: 'default',
    position: { x: POSITIONS.AFTER_X, y: Y_POSITIONS.ACQUIRING_HEADER_Y },
    data: { 
      label: (
        <div className="text-sm font-semibold text-blue-700">
          ACQUIRING COMPANY STRUCTURE (MAINTAINED)
        </div>
      )
    },
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      width: '350px',
      height: '30px'
    },
    draggable: false,
    selectable: false
  });

  // After controlling shareholder
  const afterControllingEntity = entities.find(e => e.id === 'after-controlling-shareholder');
  if (afterControllingEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'after-controlling-shareholder',
      type: 'default',
      position: { x: POSITIONS.AFTER_X, y: Y_POSITIONS.CONTROLLING_SHAREHOLDER_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{afterControllingEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '60px'
      }
    });
  }

  // After public shareholders
  const afterPublicEntity = entities.find(e => e.id === 'after-public-shareholders');
  if (afterPublicEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'after-public-shareholders',
      type: 'default',
      position: { x: POSITIONS.AFTER_X + 180, y: Y_POSITIONS.CONTROLLING_SHAREHOLDER_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{afterPublicEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '60px'
      }
    });
  }

  // After acquiring company
  const afterAcquiringEntity = entities.find(e => e.id === 'after-acquiring-company');
  if (afterAcquiringEntity) {
    const colors = getNodeColors('buyer');
    nodes.push({
      id: 'after-acquiring-company',
      type: 'default',
      position: { x: POSITIONS.AFTER_X + 90, y: Y_POSITIONS.ACQUIRING_COMPANY_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{afterAcquiringEntity.name}</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '80px'
      }
    });
  }

  // Target section header
  nodes.push({
    id: 'after-target-header',
    type: 'default',
    position: { x: POSITIONS.AFTER_X, y: Y_POSITIONS.TARGET_HEADER_Y },
    data: { 
      label: (
        <div className="text-sm font-semibold text-orange-700">
          TARGET COMPANY - NEW OWNERSHIP
        </div>
      )
    },
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      width: '350px',
      height: '30px'
    },
    draggable: false,
    selectable: false
  });

  // Remaining shareholders
  const remainingEntity = entities.find(e => e.id === 'after-remaining-shareholders');
  if (remainingEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'after-remaining-shareholders',
      type: 'default',
      position: { x: POSITIONS.AFTER_X + 180, y: Y_POSITIONS.TARGET_SHAREHOLDERS_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{remainingEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '60px'
      }
    });
  }

  // Acquiring company as new shareholder
  if (afterAcquiringEntity) {
    const colors = getNodeColors('buyer');
    nodes.push({
      id: 'after-acquiring-as-shareholder',
      type: 'default',
      position: { x: POSITIONS.AFTER_X, y: Y_POSITIONS.TARGET_SHAREHOLDERS_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{afterAcquiringEntity.name}</div>
            <div className="text-xs text-gray-500">New Owner</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '60px'
      }
    });
  }

  // After target company
  const afterTargetEntity = entities.find(e => e.id === 'after-target-company');
  if (afterTargetEntity) {
    const colors = getNodeColors('target');
    nodes.push({
      id: 'after-target-company',
      type: 'default',
      position: { x: POSITIONS.AFTER_X + 90, y: Y_POSITIONS.TARGET_COMPANY_Y },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="font-semibold text-sm">{afterTargetEntity.name}</div>
            <div className="text-xs text-gray-600">Post-Transaction</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `3px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '80px'
      }
    });
  }

  return nodes;
};
