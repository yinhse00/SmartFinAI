
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
    type: 'ownership' | 'control' | 'subsidiary' | 'consideration' | 'receives_from' | 'funding';
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
        return { 
          stroke: '#3b82f6', 
          strokeWidth: 2,
          strokeDasharray: undefined // Solid line for ownership
        };
      case 'control':
        return { 
          stroke: '#dc2626', 
          strokeWidth: 2,
          strokeDasharray: undefined // Solid line for control
        };
      case 'consideration':
        return { 
          stroke: '#16a34a', 
          strokeWidth: 2.5, 
          strokeDasharray: '8,4' // Dashed line for consideration/payment
        };
      case 'receives_from':
        return { 
          stroke: '#059669', 
          strokeWidth: 2, 
          strokeDasharray: '4,2' // Dotted line for payment receipts
        };
      case 'funding':
        return { 
          stroke: '#eab308', 
          strokeWidth: 2, 
          strokeDasharray: '6,3' // Dashed line for funding
        };
      case 'subsidiary':
        return { 
          stroke: '#6b7280', 
          strokeWidth: 1.5,
          strokeDasharray: undefined // Solid line for subsidiaries
        };
      default:
        return { 
          stroke: '#6b7280', 
          strokeWidth: 1.5,
          strokeDasharray: undefined
        };
    }
  };

  const getLabel = () => {
    if (data?.percentage) {
      return `${data.percentage.toFixed(1)}%`;
    }
    if (data?.value) {
      return `HK$${(data.value / 1000000).toFixed(0)}M`;
    }
    // Return more descriptive labels for different relationship types
    switch (data?.type) {
      case 'consideration':
        return 'Payment';
      case 'receives_from':
        return 'Receives';
      case 'funding':
        return 'Funding';
      case 'ownership':
        return 'Owns';
      case 'control':
        return 'Controls';
      case 'subsidiary':
        return 'Subsidiary';
      default:
        return data?.type || '';
    }
  };

  const getLabelStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
      fontSize: 10,
      fontWeight: 600,
      backgroundColor: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      border: '1px solid #e5e7eb',
    };

    // Add special styling for payment flows
    if (data?.type === 'consideration' || data?.type === 'receives_from') {
      return {
        ...baseStyle,
        backgroundColor: '#f0fdf4', // Light green background for payment flows
        borderColor: '#16a34a',
        color: '#15803d',
      };
    }

    return baseStyle;
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
          style={getLabelStyle()}
          className="nodrag nopan"
        >
          {getLabel()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default TransactionFlowEdge;
