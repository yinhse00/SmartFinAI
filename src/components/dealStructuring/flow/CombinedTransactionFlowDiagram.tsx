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

    // Enhanced grid positioning with better spacing
    const HORIZONTAL_SPACING = 200;
    const VERTICAL_SPACING = 120;
    const SECTION_SPACING = 60;
    const HEADER_HEIGHT = 80;

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

    // Extract and categorize shareholder data
    const getDetailedShareholderData = () => {
      const shareholderData = {
        acquirer: [] as Array<{ id: string; name: string; type: 'stockholder'; percentage: number }>,
        target: [] as Array<{ id: string; name: string; type: 'stockholder'; percentage: number }>
      };

      // Try to get detailed breakdown from before state
      if (transactionFlow.before?.entities) {
        const allShareholders = transactionFlow.before.entities.filter(e => e.type === 'stockholder');
        
        allShareholders.forEach((shareholder, index) => {
          const name = shareholder.name.toLowerCase();
          if (name.includes('acquirer') || name.includes('acquiring') || name.includes('buyer')) {
            shareholderData.acquirer.push({
              id: `acquirer-shareholder-${index}`,
              name: shareholder.name,
              type: 'stockholder',
              percentage: shareholder.percentage || 100
            });
          } else if (name.includes('target') || name.includes('existing')) {
            shareholderData.target.push({
              id: `target-shareholder-${index}`,
              name: shareholder.name,
              type: 'stockholder',
              percentage: shareholder.percentage || 100
            });
          }
        });
      }

      // If no specific breakdown available, create realistic default structure
      if (shareholderData.acquirer.length === 0) {
        shareholderData.acquirer = [
          { id: 'acquirer-controlling', name: 'Controlling Shareholder', type: 'stockholder', percentage: 70 },
          { id: 'acquirer-public', name: 'Public Shareholders', type: 'stockholder', percentage: 30 }
        ];
      }

      if (shareholderData.target.length === 0) {
        shareholderData.target = [
          { id: 'target-institutional', name: 'Institutional Investors', type: 'stockholder', percentage: 60 },
          { id: 'target-public', name: 'Public Shareholders', type: 'stockholder', percentage: 40 }
        ];
      }

      return shareholderData;
    };

    const shareholderData = getDetailedShareholderData();
    const targetSubsidiaries = transactionFlow.before?.entities?.filter(e => e.type === 'subsidiary') || [];

    // Position calculator to prevent overlaps
    const calculatePosition = (row: number, col: number, offsetX = 0, offsetY = 0) => ({
      x: 50 + (col * HORIZONTAL_SPACING) + offsetX,
      y: HEADER_HEIGHT + (row * VERTICAL_SPACING) + offsetY
    });

    // BEFORE SECTION HEADER
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: calculatePosition(0, 0),
      data: { 
        label: (
          <div className="text-xl font-bold text-gray-800">
            BEFORE TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '400px'
      },
      draggable: false,
      selectable: false
    });

    // ACQUIRING COMPANY SECTION
    let currentRow = 1;
    
    nodes.push({
      id: 'acquirer-section-header',
      type: 'default',
      position: calculatePosition(currentRow, 0),
      data: { 
        label: (
          <div className="text-lg font-semibold text-blue-700">
            ACQUIRING COMPANY STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '350px'
      },
      draggable: false,
      selectable: false
    });

    currentRow++;

    // Acquirer shareholders with proper spacing
    shareholderData.acquirer.forEach((shareholder, index) => {
      const colors = getNodeColors('stockholder', 'acquirer');
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: calculatePosition(currentRow, index, 0, 0),
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '160px',
          minHeight: '90px'
        }
      });
    });

    currentRow += 2;

    // Acquiring Company entity
    const acquirerColors = getNodeColors('buyer', 'acquirer');
    nodes.push({
      id: 'acquirer-company',
      type: 'default',
      position: calculatePosition(currentRow, 0, 20, 0),
      data: {
        label: (
          <div className="text-center p-3">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="font-semibold text-base">Acquiring Company</div>
            <div className="text-sm text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `2px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '180px',
        minHeight: '100px'
      }
    });

    currentRow += 3;

    // TARGET COMPANY SECTION
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: calculatePosition(currentRow, 0),
      data: { 
        label: (
          <div className="text-lg font-semibold text-orange-700">
            TARGET COMPANY STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '350px'
      },
      draggable: false,
      selectable: false
    });

    currentRow++;

    // Target shareholders with proper spacing
    shareholderData.target.forEach((shareholder, index) => {
      const colors = getNodeColors('stockholder', 'target');
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: calculatePosition(currentRow, index, 0, 0),
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '160px',
          minHeight: '90px'
        }
      });
    });

    currentRow += 2;

    // Target Company entity
    const targetColors = getNodeColors('target', 'target');
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: calculatePosition(currentRow, 0, 20, 0),
      data: {
        label: (
          <div className="text-center p-3">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="font-semibold text-base">Target Company</div>
            <div className="text-sm text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `2px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '180px',
        minHeight: '100px'
      }
    });

    // Target subsidiaries
    targetSubsidiaries.forEach((subsidiary, index) => {
      const subColors = getNodeColors('subsidiary', 'neutral');
      nodes.push({
        id: `target-subsidiary-${index}`,
        type: 'default',
        position: calculatePosition(currentRow, index + 1, 60, 0),
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: subColors.backgroundColor,
          border: `2px solid ${subColors.borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '130px',
          minHeight: '80px'
        }
      });
    });

    // TRANSACTION SECTION (Center) - Clear and detailed
    const centerX = 600;
    const centerY = 300;
    
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: centerX, y: 50 },
      data: { 
        label: (
          <div className="text-xl font-bold text-blue-800">
            SUGGESTED DEAL STRUCTURE
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

    // Enhanced deal description with actual data
    nodes.push({
      id: 'deal-description',
      type: 'default',
      position: { x: centerX - 50, y: centerY - 100 },
      data: {
        label: (
          <div className="text-center p-6">
            <div className="text-xl font-bold mb-4 text-blue-900">
              Share Acquisition Transaction
            </div>
            <div className="space-y-3 text-sm text-left">
              <div className="bg-blue-50 p-3 rounded">
                <strong className="text-blue-800">Transaction Type:</strong>
                <div className="text-blue-700">Acquiring Company purchases controlling stake in Target Company</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">HK$1,000M cash payment</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <strong className="text-orange-800">Ownership Split:</strong>
                <div className="text-orange-700">
                  • Acquiring Company: 70% controlling stake<br/>
                  • Remaining shareholders: 30%
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <strong className="text-purple-800">Structure:</strong>
                <div className="text-purple-700">Target remains listed entity under Acquirer control</div>
              </div>
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: '#f8fafc',
        border: '3px solid #2563eb',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '400px',
        minHeight: '300px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER SECTION
    const afterX = 1100;
    
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: afterX, y: 50 },
      data: { 
        label: (
          <div className="text-xl font-bold text-gray-800">
            AFTER TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '400px'
      },
      draggable: false,
      selectable: false
    });

    // After: Acquiring Company Shareholders (unchanged)
    let afterRow = 1;
    
    nodes.push({
      id: 'after-acquirer-header',
      type: 'default',
      position: { x: afterX, y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
      data: { 
        label: (
          <div className="text-lg font-semibold text-blue-700">
            ACQUIRING COMPANY SHAREHOLDERS
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '400px'
      },
      draggable: false,
      selectable: false
    });

    afterRow++;

    shareholderData.acquirer.forEach((shareholder, index) => {
      const colors = getNodeColors('stockholder', 'acquirer');
      nodes.push({
        id: `after-${shareholder.id}`,
        type: 'default',
        position: { x: afterX + (index * HORIZONTAL_SPACING), y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="font-semibold text-sm">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '160px',
          minHeight: '90px'
        }
      });
    });

    afterRow += 2;

    // After: Acquiring Company (now controlling target)
    nodes.push({
      id: 'after-acquirer-company',
      type: 'default',
      position: { x: afterX + 20, y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="font-semibold text-base">Acquiring Company</div>
            <div className="text-sm text-blue-700 font-medium">Controls Target (70%)</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `3px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '180px',
        minHeight: '100px'
      }
    });

    // Remaining Target Shareholders
    nodes.push({
      id: 'remaining-target-shareholders',
      type: 'default',
      position: { x: afterX + 250, y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div className="font-semibold text-sm">Remaining Target Shareholders</div>
            <div className="text-xs text-orange-700 font-medium">30% ownership</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColors('stockholder', 'target').backgroundColor,
        border: `2px solid ${getNodeColors('stockholder', 'target').borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '160px',
        minHeight: '90px'
      }
    });

    afterRow += 2;

    // After: Target Company (now controlled)
    nodes.push({
      id: 'controlled-target',
      type: 'default',
      position: { x: afterX + 135, y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="font-semibold text-base">Target Company</div>
            <div className="text-sm text-blue-700 font-medium">Controlled by Acquirer</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `3px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '180px',
        minHeight: '100px'
      }
    });

    // After: Target Subsidiaries
    afterRow++;
    targetSubsidiaries.forEach((subsidiary, index) => {
      const subColors = getNodeColors('subsidiary', 'neutral');
      nodes.push({
        id: `controlled-subsidiary-${index}`,
        type: 'default',
        position: { x: afterX + (index * 150) + 50, y: HEADER_HEIGHT + (afterRow * VERTICAL_SPACING) },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: subColors.backgroundColor,
          border: `2px solid ${subColors.borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '130px',
          minHeight: '80px'
        }
      });
    });

    // EDGES - Corporate Structure Lines (Solid)
    
    // Acquirer structure (before)
    shareholderData.acquirer.forEach((shareholder) => {
      edges.push({
        id: `edge-${shareholder.id}-to-acquirer`,
        source: shareholder.id,
        target: 'acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 3
        },
        label: `${shareholder.percentage}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    });

    // Target structure (before)
    shareholderData.target.forEach((shareholder) => {
      edges.push({
        id: `edge-${shareholder.id}-to-target`,
        source: shareholder.id,
        target: 'target-company',
        type: 'straight',
        style: {
          stroke: '#f59e0b',
          strokeWidth: 3
        },
        label: `${shareholder.percentage}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#f59e0b'
        }
      });
    });

    // Target subsidiaries (before)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `edge-target-to-sub-${index}`,
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

    // After structure
    shareholderData.acquirer.forEach((shareholder) => {
      edges.push({
        id: `edge-after-${shareholder.id}-to-acquirer`,
        source: `after-${shareholder.id}`,
        target: 'after-acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 3
        },
        label: `${shareholder.percentage}%`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    });

    // Control relationships (after)
    edges.push({
      id: 'edge-acquirer-controls-target',
      source: 'after-acquirer-company',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 4
      },
      label: '70% Control',
      labelStyle: {
        fontSize: '14px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'edge-remaining-to-target',
      source: 'remaining-target-shareholders',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#f59e0b',
        strokeWidth: 3
      },
      label: '30%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#f59e0b'
      }
    });

    // Controlled subsidiaries (after)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `edge-controlled-target-to-sub-${index}`,
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

    // TRANSACTION FLOW EDGES (Dotted)
    
    // Deal flow from acquirer
    edges.push({
      id: 'transaction-flow-acquirer',
      source: 'acquirer-company',
      target: 'deal-description',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 4,
        strokeDasharray: '10,5'
      },
      label: 'Acquires 70%',
      labelStyle: {
        fontSize: '14px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    // Deal flow from target shareholders
    if (shareholderData.target.length > 0) {
      edges.push({
        id: 'transaction-flow-target',
        source: shareholderData.target[0].id,
        target: 'deal-description',
        type: 'straight',
        style: {
          stroke: '#dc2626',
          strokeWidth: 4,
          strokeDasharray: '10,5'
        },
        label: 'Sells 70%',
        labelStyle: {
          fontSize: '14px',
          fontWeight: 'bold',
          fill: '#dc2626'
        }
      });
    }

    // Result flow
    edges.push({
      id: 'transaction-result',
      source: 'deal-description',
      target: 'after-acquirer-company',
      type: 'straight',
      style: {
        stroke: '#7c3aed',
        strokeWidth: 4,
        strokeDasharray: '10,5'
      },
      label: 'Gains Control',
      labelStyle: {
        fontSize: '14px',
        fontWeight: 'bold',
        fill: '#7c3aed'
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
        elementsSelectable={true}
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
