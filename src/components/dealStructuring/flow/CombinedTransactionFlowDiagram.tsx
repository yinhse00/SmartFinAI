
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

    // Grid-based positioning to prevent overlaps
    const GRID_SIZE = 180;
    const HEADER_HEIGHT = 60;
    const SECTION_MARGIN = 40;

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'target': return '#fef3c7';
        case 'buyer': return '#dbeafe';
        case 'stockholder': return '#dcfce7';
        case 'consideration': return '#fde68a';
        case 'subsidiary': return '#f3e8ff';
        default: return '#f3f4f6';
      }
    };

    const getNodeBorder = (type: string) => {
      switch (type) {
        case 'target': return '#f59e0b';
        case 'buyer': return '#2563eb';
        case 'stockholder': return '#16a34a';
        case 'consideration': return '#d97706';
        case 'subsidiary': return '#9333ea';
        default: return '#6b7280';
      }
    };

    // Extract shareholder data from analysis results
    const getShareholderData = () => {
      // Try to get detailed shareholder breakdown from results
      if (transactionFlow.before?.entities) {
        const shareholders = transactionFlow.before.entities.filter(e => e.type === 'stockholder');
        return shareholders.length > 0 ? shareholders : [
          { id: 'default-acquirer-shareholders', name: 'Acquirer Shareholders', type: 'stockholder' as const, percentage: 100 },
          { id: 'default-target-shareholders', name: 'Target Shareholders', type: 'stockholder' as const, percentage: 100 }
        ];
      }
      return [
        { id: 'default-acquirer-shareholders', name: 'Acquirer Shareholders', type: 'stockholder' as const, percentage: 100 },
        { id: 'default-target-shareholders', name: 'Target Shareholders', type: 'stockholder' as const, percentage: 100 }
      ];
    };

    const shareholderData = getShareholderData();
    const acquirerShareholders = shareholderData.filter(s => s.name.toLowerCase().includes('acquirer') || s.name.toLowerCase().includes('acquiring'));
    const targetShareholders = shareholderData.filter(s => s.name.toLowerCase().includes('target'));

    // If no specific breakdown available, create default groups
    const finalAcquirerShareholders = acquirerShareholders.length > 0 ? acquirerShareholders : [
      { id: 'acquirer-shareholders', name: 'Acquirer Shareholders', type: 'stockholder' as const, percentage: 100 }
    ];
    const finalTargetShareholders = targetShareholders.length > 0 ? targetShareholders : [
      { id: 'target-shareholders', name: 'Target Shareholders', type: 'stockholder' as const, percentage: 100 }
    ];

    // Get subsidiary data
    const targetSubsidiaries = transactionFlow.before?.entities?.filter(e => e.type === 'subsidiary') || [];

    // BEFORE section header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: 50, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-700">
            BEFORE TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '300px'
      },
      draggable: false,
      selectable: false
    });

    // ACQUIRER SECTION (Top Left)
    let yOffset = HEADER_HEIGHT + 20;
    
    nodes.push({
      id: 'acquirer-header',
      type: 'default',
      position: { x: 50, y: yOffset },
      data: { 
        label: (
          <div className="text-md font-semibold text-blue-700">
            ACQUIRING COMPANY
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    yOffset += 50;

    // Acquirer shareholders with proper spacing
    finalAcquirerShareholders.forEach((shareholder, index) => {
      const xPos = 50 + (index * GRID_SIZE);
      nodes.push({
        id: `acquirer-shareholder-${index}`,
        type: 'default',
        position: { x: xPos, y: yOffset },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600">{shareholder.percentage || 100}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('stockholder'),
          border: `2px solid ${getNodeBorder('stockholder')}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          minHeight: '80px'
        }
      });
    });

    yOffset += 120;

    // Acquirer company
    nodes.push({
      id: 'acquirer-company',
      type: 'default',
      position: { x: 50, y: yOffset },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-gray-600">Buyer Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('buyer'),
        border: `2px solid ${getNodeBorder('buyer')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // TARGET SECTION (Bottom Left)
    yOffset += 140;
    
    nodes.push({
      id: 'target-header',
      type: 'default',
      position: { x: 50, y: yOffset },
      data: { 
        label: (
          <div className="text-md font-semibold text-yellow-700">
            TARGET COMPANY
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    yOffset += 50;

    // Target shareholders with proper spacing
    finalTargetShareholders.forEach((shareholder, index) => {
      const xPos = 50 + (index * GRID_SIZE);
      nodes.push({
        id: `target-shareholder-${index}`,
        type: 'default',
        position: { x: xPos, y: yOffset },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600">{shareholder.percentage || 100}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('stockholder'),
          border: `2px solid ${getNodeBorder('stockholder')}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          minHeight: '80px'
        }
      });
    });

    yOffset += 120;

    // Target company
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: { x: 50, y: yOffset },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-gray-600">Listed Company</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('target'),
        border: `2px solid ${getNodeBorder('target')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Target subsidiaries with proper spacing
    targetSubsidiaries.forEach((subsidiary, index) => {
      const xPos = 220 + (index * (GRID_SIZE - 40));
      nodes.push({
        id: `target-subsidiary-${index}`,
        type: 'default',
        position: { x: xPos, y: yOffset },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('subsidiary'),
          border: `2px solid ${getNodeBorder('subsidiary')}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          minHeight: '70px'
        }
      });
    });

    // TRANSACTION SECTION (Center) - Clear text description
    const centerX = 500;
    
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: centerX, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-700">
            SUGGESTED DEAL STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '250px'
      },
      draggable: false,
      selectable: false
    });

    // Deal structure description with actual data
    nodes.push({
      id: 'deal-description',
      type: 'default',
      position: { x: centerX, y: 180 },
      data: {
        label: (
          <div className="text-center p-4 max-w-xs">
            <div className="text-lg font-semibold mb-3 text-blue-800">Share Purchase Transaction</div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">• Acquiring Company purchases 70% of Target Company shares</div>
              <div className="font-medium">• Cash consideration: HK$1,000M</div>
              <div className="font-medium">• Target remains a listed entity</div>
              <div className="font-medium">• Acquiring Company gains control</div>
              <div className="font-medium">• Existing shareholders retain 30%</div>
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: '#eff6ff',
        border: '2px solid #2563eb',
        borderRadius: '8px',
        padding: '16px',
        minWidth: '280px',
        minHeight: '200px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER section header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: 850, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-700">
            AFTER TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '300px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER: Show acquiring company shareholders
    let afterYOffset = HEADER_HEIGHT + 20;
    
    nodes.push({
      id: 'after-acquirer-header',
      type: 'default',
      position: { x: 850, y: afterYOffset },
      data: { 
        label: (
          <div className="text-md font-semibold text-blue-700">
            ACQUIRING COMPANY SHAREHOLDERS
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '300px'
      },
      draggable: false,
      selectable: false
    });

    afterYOffset += 50;

    // Show acquiring company shareholders in AFTER state
    finalAcquirerShareholders.forEach((shareholder, index) => {
      const xPos = 850 + (index * GRID_SIZE);
      nodes.push({
        id: `after-acquirer-shareholder-${index}`,
        type: 'default',
        position: { x: xPos, y: afterYOffset },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600">{shareholder.percentage || 100}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('stockholder'),
          border: `2px solid ${getNodeBorder('stockholder')}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          minHeight: '80px'
        }
      });
    });

    afterYOffset += 120;

    // Acquiring Company (Now controlling target)
    nodes.push({
      id: 'after-acquirer-company',
      type: 'default',
      position: { x: 850, y: afterYOffset },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-gray-600">Controls Target (70%)</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('buyer'),
        border: `2px solid ${getNodeBorder('buyer')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Remaining Target Shareholders
    nodes.push({
      id: 'remaining-shareholders',
      type: 'default',
      position: { x: 1050, y: afterYOffset },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Remaining Target Shareholders</div>
            <div className="text-xs text-gray-600">30%</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('stockholder'),
        border: `2px solid ${getNodeBorder('stockholder')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    afterYOffset += 140;

    // Target Company (Now Controlled)
    nodes.push({
      id: 'controlled-target',
      type: 'default',
      position: { x: 950, y: afterYOffset },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-gray-600">Now Controlled by Acquirer</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('target'),
        border: `2px solid ${getNodeBorder('target')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    afterYOffset += 120;

    // Target Subsidiaries (After)
    targetSubsidiaries.forEach((subsidiary, index) => {
      const xPos = 850 + (index * GRID_SIZE);
      nodes.push({
        id: `controlled-subsidiary-${index}`,
        type: 'default',
        position: { x: xPos, y: afterYOffset },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('subsidiary'),
          border: `2px solid ${getNodeBorder('subsidiary')}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          minHeight: '70px'
        }
      });
    });

    // FIXED LINES - Shareholding and Corporate Structure (BEFORE)
    // Acquirer structure
    finalAcquirerShareholders.forEach((_, index) => {
      edges.push({
        id: `acquirer-ownership-${index}`,
        source: `acquirer-shareholder-${index}`,
        target: 'acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 2
        },
        label: `${finalAcquirerShareholders[index]?.percentage || 100}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    });

    // Target structure (BEFORE)
    finalTargetShareholders.forEach((_, index) => {
      edges.push({
        id: `target-ownership-before-${index}`,
        source: `target-shareholder-${index}`,
        target: 'target-company',
        type: 'straight',
        style: {
          stroke: '#16a34a',
          strokeWidth: 2
        },
        label: `${finalTargetShareholders[index]?.percentage || (100 / finalTargetShareholders.length)}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#16a34a'
        }
      });
    });

    // Target subsidiaries (BEFORE)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `target-sub-before-${index}`,
        source: 'target-company',
        target: `target-subsidiary-${index}`,
        type: 'straight',
        style: {
          stroke: '#9333ea',
          strokeWidth: 2
        },
        label: `${subsidiary.percentage || 100}%`,
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#9333ea'
        }
      });
    });

    // FIXED LINES - New Corporate Structure (AFTER)
    // Acquiring company shareholders to acquiring company
    finalAcquirerShareholders.forEach((_, index) => {
      edges.push({
        id: `after-acquirer-ownership-${index}`,
        source: `after-acquirer-shareholder-${index}`,
        target: 'after-acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 2
        },
        label: `${finalAcquirerShareholders[index]?.percentage || 100}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    });

    // Acquiring company to target (70%)
    edges.push({
      id: 'acquirer-target-control',
      source: 'after-acquirer-company',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3
      },
      label: '70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    // Remaining shareholders to target (30%)
    edges.push({
      id: 'remaining-target-ownership',
      source: 'remaining-shareholders',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    // Controlled subsidiaries (AFTER)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `controlled-sub-${index}`,
        source: 'controlled-target',
        target: `controlled-subsidiary-${index}`,
        type: 'straight',
        style: {
          stroke: '#9333ea',
          strokeWidth: 2
        },
        label: `${subsidiary.percentage || 100}%`,
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#9333ea'
        }
      });
    });

    // DOTTED LINES - Deal Flow Illustration
    // Acquirer to deal description
    edges.push({
      id: 'acquirer-to-deal',
      source: 'acquirer-company',
      target: 'deal-description',
      type: 'straight',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Acquires 70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#3b82f6'
      }
    });

    // Target shareholders to deal (receives payment)
    if (finalTargetShareholders.length > 0) {
      edges.push({
        id: 'target-to-deal',
        source: `target-shareholder-0`,
        target: 'deal-description',
        type: 'straight',
        style: {
          stroke: '#16a34a',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: 'Receives HK$1,000M',
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#16a34a'
        }
      });
    }

    // Deal to result
    edges.push({
      id: 'deal-to-result',
      source: 'deal-description',
      target: 'after-acquirer-company',
      type: 'straight',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Gains Control',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#3b82f6'
      }
    });

    return { nodes, edges };
  }, [transactionFlow]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default CombinedTransactionFlowDiagram;
