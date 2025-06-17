
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

interface TransactionFlowEdgeProps {
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
    type: 'ownership' | 'control' | 'subsidiary' | 'consideration';
    percentage?: number;
    value?: number;
  };
}

const TransactionFlowEdge: React.FC<TransactionFlowEdgeProps> = ({
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
    switch (data?.type) {
      case 'ownership':
        return { stroke: '#3b82f6', strokeWidth: 2 };
      case 'consideration':
        return { stroke: '#eab308', strokeWidth: 3, strokeDasharray: '5,5' };
      case 'control':
        return { stroke: '#dc2626', strokeWidth: 2 };
      default:
        return { stroke: '#6b7280', strokeWidth: 1 };
    }
  };

  const getLabel = () => {
    if (data?.percentage) {
      return `${data.percentage.toFixed(1)}%`;
    }
    if (data?.value) {
      return `HK$${data.value}M`;
    }
    return data?.type || '';
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, ...getEdgeStyle() }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
          }}
          className="nodrag nopan"
        >
          {getLabel()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default TransactionFlowEdge;
