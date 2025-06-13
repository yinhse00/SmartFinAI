
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { EnhancedTransactionRelationship } from '@/types/enhancedTransactionFlow';

interface EnhancedTransactionEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    relationship: EnhancedTransactionRelationship;
  };
}

const EnhancedTransactionEdge: React.FC<EnhancedTransactionEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeStyle = () => {
    if (!data?.relationship) return { stroke: '#6b7280', strokeWidth: 2 };

    const rel = data.relationship;
    
    switch (rel.type) {
      case 'ownership':
        // Solid lines for ownership
        return { 
          stroke: '#1f2937', 
          strokeWidth: Math.max(2, Math.min(4, (rel.percentage || 20) / 15)),
          strokeOpacity: 1
        };
      case 'consideration':
        // Dotted lines for transaction terms
        return { 
          stroke: '#dc2626', 
          strokeWidth: 3, 
          strokeDasharray: '6,6',
          strokeOpacity: 0.8
        };
      case 'control':
        return { 
          stroke: '#7c2d12', 
          strokeWidth: 2,
          strokeDasharray: '8,4',
          strokeOpacity: 0.8
        };
      default:
        return { stroke: '#6b7280', strokeWidth: 2, strokeOpacity: 0.6 };
    }
  };

  const getLabel = () => {
    if (!data?.relationship) return '';

    const rel = data.relationship;

    if (rel.type === 'ownership' && rel.percentage) {
      // Show percentage on ownership lines
      return `${rel.percentage.toFixed(1)}%`;
    }

    if (rel.type === 'consideration') {
      // Show consideration amount and terms on dotted lines
      const parts = [];
      if (rel.value && rel.currency) {
        parts.push(`${rel.currency} ${(rel.value / 1000000).toFixed(0)}M`);
      }
      if (rel.paymentMethod) {
        parts.push(rel.paymentMethod);
      }
      return parts.join(' • ');
    }

    return '';
  };

  const getLabelStyle = () => {
    if (!data?.relationship) return {};

    const rel = data.relationship;
    
    switch (rel.type) {
      case 'ownership':
        return {
          backgroundColor: '#f8fafc',
          color: '#1f2937',
          borderColor: '#e2e8f0',
          fontWeight: '600',
          fontSize: '12px'
        };
      case 'consideration':
        return {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          borderColor: '#dc2626',
          fontWeight: '500',
          fontSize: '11px'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          borderColor: '#6b7280',
          fontSize: '11px'
        };
    }
  };

  const label = getLabel();
  const labelStyle = getLabelStyle();

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, ...getEdgeStyle() }} 
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${labelStyle.borderColor}`,
              ...labelStyle,
              textAlign: 'center',
              lineHeight: '1.2',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default EnhancedTransactionEdge;
