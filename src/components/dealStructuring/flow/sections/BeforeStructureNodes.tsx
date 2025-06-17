
import React from 'react';
import { Node } from '@xyflow/react';
import { TransactionEntity } from '@/types/transactionFlow';
import { getNodeColors } from '../utils/nodeStyleUtils';
import { POSITIONS, Y_POSITIONS } from '../utils/layoutConstants';

interface BeforeStructureNodesProps {
  entities: TransactionEntity[];
}

export const createBeforeStructureNodes = (entities: TransactionEntity[]): Node[] => {
  const nodes: Node[] = [];

  // Section headers
  nodes.push({
    id: 'before-header',
    type: 'default',
    position: { x: POSITIONS.BEFORE_X, y: Y_POSITIONS.SECTION_HEADER_Y },
    data: { 
      label: (
        <div className="text-lg font-bold text-gray-800">
          BEFORE TRANSACTION
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
    id: 'acquiring-section-header',
    type: 'default',
    position: { x: POSITIONS.BEFORE_X, y: Y_POSITIONS.ACQUIRING_HEADER_Y },
    data: { 
      label: (
        <div className="text-sm font-semibold text-blue-700">
          ACQUIRING COMPANY STRUCTURE
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

  // Controlling shareholder
  const controllingEntity = entities.find(e => e.id === 'before-controlling-shareholder');
  if (controllingEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'before-controlling-shareholder',
      type: 'default',
      position: { x: POSITIONS.BEFORE_X, y: Y_POSITIONS.CONTROLLING_SHAREHOLDER_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{controllingEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '150px',
        height: '60px'
      }
    });
  }

  // Public shareholders
  const publicEntity = entities.find(e => e.id === 'before-public-shareholders');
  if (publicEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'before-public-shareholders',
      type: 'default',
      position: { x: POSITIONS.BEFORE_X + 200, y: Y_POSITIONS.CONTROLLING_SHAREHOLDER_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{publicEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '150px',
        height: '60px'
      }
    });
  }

  // Acquiring company
  const acquiringEntity = entities.find(e => e.id === 'before-acquiring-company');
  if (acquiringEntity) {
    const colors = getNodeColors('buyer');
    nodes.push({
      id: 'before-acquiring-company',
      type: 'default',
      position: { x: POSITIONS.BEFORE_X + 100, y: Y_POSITIONS.ACQUIRING_COMPANY_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{acquiringEntity.name}</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
            {acquiringEntity.description && (
              <div className="text-xs text-gray-500">{acquiringEntity.description}</div>
            )}
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '180px',
        height: '80px'
      }
    });
  }

  // Target section header
  nodes.push({
    id: 'target-section-header',
    type: 'default',
    position: { x: POSITIONS.BEFORE_X, y: Y_POSITIONS.TARGET_HEADER_Y },
    data: { 
      label: (
        <div className="text-sm font-semibold text-orange-700">
          TARGET COMPANY STRUCTURE
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

  // Target shareholders
  const targetShareholdersEntity = entities.find(e => e.id === 'before-target-shareholders');
  if (targetShareholdersEntity) {
    const colors = getNodeColors('stockholder');
    nodes.push({
      id: 'before-target-shareholders',
      type: 'default',
      position: { x: POSITIONS.BEFORE_X + 100, y: Y_POSITIONS.TARGET_SHAREHOLDERS_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">{targetShareholdersEntity.name}</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '60px'
      }
    });
  }

  // Target company
  const targetEntity = entities.find(e => e.id === 'before-target-company');
  if (targetEntity) {
    const colors = getNodeColors('target');
    nodes.push({
      id: 'before-target-company',
      type: 'default',
      position: { x: POSITIONS.BEFORE_X + 100, y: Y_POSITIONS.TARGET_COMPANY_Y },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{targetEntity.name}</div>
            <div className="text-xs text-gray-600">Target Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `2px solid ${colors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '70px'
      }
    });
  }

  return nodes;
};
