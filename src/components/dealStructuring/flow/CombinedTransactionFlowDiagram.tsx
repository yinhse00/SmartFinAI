import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, Users, DollarSign } from 'lucide-react';
import { TransactionFlow } from '@/types/transactionFlow';

interface CombinedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const CombinedTransactionFlowDiagram: React.FC<CombinedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Fixed layout configuration
    const SECTION_WIDTH = 350;
    const SECTION_SPACING = 50;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;

    // Section positions
    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    // Color schemes for different entity types
    const getNodeColors = (type: string, entityGroup: 'acquirer' | 'target' | 'neutral') => {
      switch (type) {
        case 'target':
          return {
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b'
          };
        case 'buyer':
          return {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb'
          };
        case 'stockholder':
          if (entityGroup === 'acquirer') {
            return {
              backgroundColor: '#e0f2fe',
              borderColor: '#0284c7'
            };
          } else {
            return {
              backgroundColor: '#fef3c7',
              borderColor: '#f59e0b'
            };
          }
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a'
          };
        case 'subsidiary':
          return {
            backgroundColor: '#f3e8ff',
            borderColor: '#9333ea'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
      }
    };

    // BEFORE SECTION
    let currentY = START_Y;

    // Before Section Header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
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
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 60;

    // Acquiring Company Section
    nodes.push({
      id: 'acquirer-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
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
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Controlling Shareholder of Acquiring Company
    const controllingColors = getNodeColors('stockholder', 'acquirer');
    nodes.push({
      id: 'controlling-shareholder',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-xs">Controlling Shareholder</div>
            <div className="text-xs text-gray-600 font-medium">70%</div>
          </div>
        )
      },
      style: {
        backgroundColor: controllingColors.backgroundColor,
        border: `2px solid ${controllingColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    // Public Shareholders of Acquiring Company
    nodes.push({
      id: 'public-shareholders',
      type: 'default',
      position: { x: BEFORE_X + 160, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-xs">Public Shareholders</div>
            <div className="text-xs text-gray-600 font-medium">30%</div>
          </div>
        )
      },
      style: {
        backgroundColor: controllingColors.backgroundColor,
        border: `2px solid ${controllingColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    currentY += 100;

    // Acquiring Company
    const acquirerColors = getNodeColors('buyer', 'acquirer');
    nodes.push({
      id: 'acquiring-company',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `2px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '90px'
      }
    });

    currentY += 120;

    // Target Company Section
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
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
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Target Company Existing Shareholders
    const targetShareholderColors = getNodeColors('stockholder', 'target');
    nodes.push({
      id: 'target-existing-shareholders',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div className="font-semibold text-xs">Existing Shareholders</div>
            <div className="text-xs text-gray-600 font-medium">100%</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetShareholderColors.backgroundColor,
        border: `2px solid ${targetShareholderColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    currentY += 100;

    // Target Company
    const targetColors = getNodeColors('target', 'target');
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `2px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '90px'
      }
    });

    // TRANSACTION SECTION
    const transactionY = START_Y + 150;

    // Transaction Header
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: TRANSACTION_X, y: START_Y },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-800">
            DEAL STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Transaction Details
    nodes.push({
      id: 'transaction-details',
      type: 'default',
      position: { x: TRANSACTION_X, y: transactionY },
      data: {
        label: (
          <div className="text-center p-4">
            <div className="text-lg font-bold mb-3 text-blue-900">
              Share Acquisition
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Transaction:</strong>
                <div className="text-blue-700">Acquiring Company purchases 70% of Target Company shares</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">HK$1,000M cash payment</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Result:</strong>
                <div className="text-orange-700">
                  Acquiring Company gains control of Target Company
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

    // AFTER SECTION
    currentY = START_Y;

    // After Section Header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
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
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 60;

    // After Acquiring Company Section
    nodes.push({
      id: 'after-acquirer-section-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-blue-700">
            ACQUIRING COMPANY SHAREHOLDERS
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // After Controlling Shareholder (unchanged)
    nodes.push({
      id: 'after-controlling-shareholder',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-xs">Controlling Shareholder</div>
            <div className="text-xs text-gray-600 font-medium">70%</div>
          </div>
        )
      },
      style: {
        backgroundColor: controllingColors.backgroundColor,
        border: `2px solid ${controllingColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    // After Public Shareholders (unchanged)
    nodes.push({
      id: 'after-public-shareholders',
      type: 'default',
      position: { x: AFTER_X + 160, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-xs">Public Shareholders</div>
            <div className="text-xs text-gray-600 font-medium">30%</div>
          </div>
        )
      },
      style: {
        backgroundColor: controllingColors.backgroundColor,
        border: `2px solid ${controllingColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    currentY += 100;

    // After Acquiring Company (now controls target)
    nodes.push({
      id: 'after-acquiring-company',
      type: 'default',
      position: { x: AFTER_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-blue-700 font-medium">Now controls Target</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `3px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '90px'
      }
    });

    currentY += 120;

    // Target Ownership Section
    nodes.push({
      id: 'target-ownership-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            TARGET COMPANY OWNERSHIP
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Acquiring Company's 70% stake
    nodes.push({
      id: 'acquirer-stake',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-xs">Acquiring Company</div>
            <div className="text-xs text-blue-700 font-medium">70% ownership</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `2px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    // Remaining Target Shareholders' 30% stake
    nodes.push({
      id: 'remaining-target-shareholders',
      type: 'default',
      position: { x: AFTER_X + 160, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div className="font-semibold text-xs">Remaining Shareholders</div>
            <div className="text-xs text-orange-700 font-medium">30% ownership</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetShareholderColors.backgroundColor,
        border: `2px solid ${targetShareholderColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '80px'
      }
    });

    currentY += 100;

    // After Target Company (now controlled)
    nodes.push({
      id: 'after-target-company',
      type: 'default',
      position: { x: AFTER_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-blue-700 font-medium">Controlled by Acquirer</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `3px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '90px'
      }
    });

    // EDGES - Ownership relationships
    
    // Before: Shareholders own Acquiring Company
    edges.push({
      id: 'controlling-to-acquirer',
      source: 'controlling-shareholder',
      target: 'acquiring-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '70%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'public-to-acquirer',
      source: 'public-shareholders',
      target: 'acquiring-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    // Before: Target shareholders own Target Company
    edges.push({
      id: 'target-shareholders-to-target',
      source: 'target-existing-shareholders',
      target: 'target-company',
      type: 'straight',
      style: {
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: '100%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#f59e0b'
      }
    });

    // After: Shareholders still own Acquiring Company
    edges.push({
      id: 'after-controlling-to-acquirer',
      source: 'after-controlling-shareholder',
      target: 'after-acquiring-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '70%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'after-public-to-acquirer',
      source: 'after-public-shareholders',
      target: 'after-acquiring-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    // After: Acquiring Company controls Target Company
    edges.push({
      id: 'after-acquirer-controls-target',
      source: 'after-acquiring-company',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3
      },
      label: 'Controls',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    // After: Ownership stakes in Target Company
    edges.push({
      id: 'acquirer-stake-to-target',
      source: 'acquirer-stake',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '70%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'remaining-to-target',
      source: 'remaining-target-shareholders',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#f59e0b'
      }
    });

    // Transaction flow arrows
    edges.push({
      id: 'transaction-flow',
      source: 'acquiring-company',
      target: 'transaction-details',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Acquires 70%',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    edges.push({
      id: 'transaction-result',
      source: 'transaction-details',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#7c3aed',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Result',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#7c3aed'
      }
    });

    return { nodes, edges };
  }, [transactionFlow]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default CombinedTransactionFlowDiagram;
