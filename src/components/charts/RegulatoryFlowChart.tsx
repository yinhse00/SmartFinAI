
import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface FlowChartData {
  nodes: Node[];
  edges: Edge[];
  title?: string;
}

interface RegulatoryFlowChartProps {
  data: FlowChartData;
  className?: string;
}

const RegulatoryFlowChart: React.FC<RegulatoryFlowChartProps> = ({ 
  data, 
  className = "" 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  return (
    <div className={`w-full h-96 border rounded-lg ${className}`}>
      {data.title && (
        <h3 className="text-lg font-semibold p-4 border-b">{data.title}</h3>
      )}
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <Background />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
};

export default RegulatoryFlowChart;
