import React from 'react';
import { Node, Position } from '@xyflow/react';
import { TransactionEntity } from '@/types/transactionFlow';
import { ENTITY_WIDTH } from './diagramLayoutUtils';

export const getNodeColors = (type: TransactionEntity['type'], isAcquirer?: boolean) => {
  switch (type) {
    case 'target':
      return {
        backgroundColor: '#fef3c7', // Light yellow
        borderColor: '#f59e0b', // Amber
        textColor: '#92400e', // Dark amber
        borderWidth: '2px'
      };
    case 'buyer':
      return {
        backgroundColor: '#dbeafe', // Light blue
        borderColor: '#2563eb', // Blue
        textColor: '#1e40af', // Dark blue
        borderWidth: '2px'
      };
    case 'stockholder':
      return isAcquirer ? {
        backgroundColor: '#ecfdf5', // Light green for acquirer-like stockholders
        borderColor: '#10b981', // Green
        textColor: '#047857', // Dark green
        borderWidth: '2px'
      } : {
        backgroundColor: '#f3f4f6', // Light gray
        borderColor: '#6b7280', // Gray
        textColor: '#374151', // Dark gray
        borderWidth: '2px'
      };
    case 'parent':
         return {
            backgroundColor: '#e5e7eb', // Slightly different gray
            borderColor: '#4b5563', // Darker gray
            textColor: '#1f2937', // Very dark gray
            borderWidth: '2px'
        };
    case 'subsidiary':
       return {
        backgroundColor: '#e0f2fe', 
        borderColor: '#0ea5e9',   
        textColor: '#0c4a6e',   
        borderWidth: '1.5px'
      };
    case 'newco':
      return {
        backgroundColor: '#ede9fe', 
        borderColor: '#7c3aed', 
        textColor: '#5b21b6', 
        borderWidth: '2px'
      };
    case 'consideration':
      return {
        backgroundColor: '#f0fdf4', 
        borderColor: '#16a34a', 
        textColor: '#15803d', 
        borderWidth: '2px'
      };
    default: 
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#6b7280',
        textColor: '#374151',
        borderWidth: '2px'
      };
  }
};

export const createEntityNode = (entity: TransactionEntity, x: number, y: number, additionalDescription?: string): Node => {
  const colors = getNodeColors(entity.type, entity.type === 'buyer' || entity.name.toLowerCase().includes('acquir'));
  const labelContent = (
    <div className="text-center p-2">
      <div className="font-semibold text-sm" style={{ color: colors.textColor }}>
        {entity.name}
      </div>
      <div className="text-xs text-gray-500 italic">{entity.type}</div>
      {entity.description && <div className="text-xs text-gray-600 mt-1">{entity.description}</div>}
      {additionalDescription && <div className="text-xs text-gray-600 mt-1">{additionalDescription}</div>}
      {/* Percentage display removed from here to avoid duplication with edge label */}
      {entity.value !== undefined && (
        <div className="text-xs font-medium text-green-700 mt-1">
          {entity.currency || '...'} {(entity.value / 1000000).toFixed(1)}M
        </div>
      )}
    </div>
  );

  return {
    id: entity.id,
    type: 'default', 
    position: { x, y },
    data: { 
      label: labelContent,
      entityType: entity.type
    },
    style: {
      backgroundColor: colors.backgroundColor,
      border: `${colors.borderWidth} solid ${colors.borderColor}`,
      borderRadius: '8px',
      width: `${ENTITY_WIDTH}px`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center' as const,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };
};

export const addSectionHeaderNode = (id: string, label: string, x: number, y: number): Node => {
    return {
        id: id,
        type: 'default',
        position: { x, y },
        data: { label: <div className="text-lg font-bold text-gray-700">{label}</div> },
        style: {
            backgroundColor: 'transparent',
            border: 'none',
            width: ENTITY_WIDTH,
            pointerEvents: 'none',
        },
        draggable: false,
        selectable: false,
    };
};
