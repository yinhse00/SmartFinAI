
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
        return { 
          stroke: '#2563eb', 
          strokeWidth: Math.max(2, Math.min(6, (rel.percentage || 20) / 10)),
          strokeOpacity: 0.8
        };
      case 'consideration':
        return { 
          stroke: '#eab308', 
          strokeWidth: 4, 
          strokeDasharray: '8,4',
          strokeOpacity: 0.9
        };
      case 'control':
        return { 
          stroke: '#dc2626', 
          strokeWidth: 3,
          strokeDasharray: '12,3',
          strokeOpacity: 0.8
        };
      case 'management':
        return { 
          stroke: '#7c3aed', 
          strokeWidth: 2,
          strokeDasharray: '6,6',
          strokeOpacity: 0.7
        };
      case 'voting':
        return { 
          stroke: '#059669', 
          strokeWidth: 2,
          strokeDasharray: '4,4,12,4',
          strokeOpacity: 0.8
        };
      default:
        return { stroke: '#6b7280', strokeWidth: 2, strokeOpacity: 0.6 };
    }
  };

  const getLabel = () => {
    if (!data?.relationship) return '';

    const rel = data.relationship;
    const parts = [];

    if (rel.percentage) {
      parts.push(`${rel.percentage.toFixed(1)}%`);
    }

    if (rel.value && rel.currency) {
      parts.push(`${rel.currency} ${(rel.value / 1000000).toFixed(0)}M`);
    }

    if (rel.terms && rel.type === 'consideration') {
      parts.push(rel.paymentMethod || 'Cash');
    }

    return parts.join(' • ');
  };

  const getLabelStyle = () => {
    if (!data?.relationship) return {};

    const rel = data.relationship;
    
    switch (rel.type) {
      case 'ownership':
        return {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderColor: '#2563eb'
        };
      case 'consideration':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          borderColor: '#eab308'
        };
      case 'control':
        return {
          backgroundColor: '#fecaca',
          color: '#991b1b',
          borderColor: '#dc2626'
        };
      case 'management':
        return {
          backgroundColor: '#e0e7ff',
          color: '#5b21b6',
          borderColor: '#7c3aed'
        };
      case 'voting':
        return {
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderColor: '#059669'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          borderColor: '#6b7280'
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
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              border: `1px solid ${labelStyle.borderColor}`,
              ...labelStyle,
              maxWidth: '120px',
              textAlign: 'center',
              lineHeight: '1.2',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            className="nodrag nopan"
          >
            {label}
            {data?.relationship.timing && (
              <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
                {data.relationship.timing}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default EnhancedTransactionEdge;
