import React, { useMemo, useState, useCallback } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, Users, DollarSign } from 'lucide-react';
import { TransactionFlow } from '@/types/transactionFlow';
import { DiagramControls } from './DiagramControls';
import { LayoutCalculator } from './LayoutCalculator';

interface CombinedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const CombinedTransactionFlowDiagram: React.FC<CombinedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const [zoom, setZoom] = useState(1);
  const [spacing, setSpacing] = useState(100);
  const [viewMode, setViewMode] = useState<'compact' | 'normal' | 'detailed'>('normal');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
  }, [reactFlowInstance]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setSpacing(100);
    setViewMode('normal');
    handleFitView();
  }, [handleFitView]);

  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Responsive spacing based on user settings and view mode
    const baseSpacing = spacing / 100;
    const spacingMultipliers = {
      compact: 0.6,
      normal: 1,
      detailed: 1.4
    };
    const HORIZONTAL_SPACING = 140 * baseSpacing * spacingMultipliers[viewMode];
    const VERTICAL_SPACING = 80 * baseSpacing * spacingMultipliers[viewMode];
    const CONTAINER_WIDTH = 1200;
    const CONTAINER_HEIGHT = 800;

    // Initialize layout calculator
    const layoutCalculator = new LayoutCalculator({
      containerWidth: CONTAINER_WIDTH,
      containerHeight: CONTAINER_HEIGHT,
      spacing: VERTICAL_SPACING * 0.5,
      viewMode
    });

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

    // Define standard node sizes
    const nodeSizes = {
      header: { width: 300, height: 40 },
      sectionHeader: { width: 280, height: 30 },
      shareholder: { width: 140, height: 80 },
      company: { width: 160, height: 90 },
      subsidiary: { width: 120, height: 70 },
      transaction: { width: 350, height: 250 }
    };

    // Add layout nodes for calculation
    // BEFORE SECTION
    layoutCalculator.addNode({
      id: 'before-header',
      width: nodeSizes.header.width,
      height: nodeSizes.header.height,
      section: 'before',
      type: 'header',
      priority: 100
    });

    layoutCalculator.addNode({
      id: 'acquirer-section-header',
      width: nodeSizes.sectionHeader.width,
      height: nodeSizes.sectionHeader.height,
      section: 'before',
      type: 'header',
      priority: 90
    });

    // Acquirer shareholders
    shareholderData.acquirer.forEach((shareholder, index) => {
      layoutCalculator.addNode({
        id: shareholder.id,
        width: nodeSizes.shareholder.width,
        height: nodeSizes.shareholder.height,
        section: 'before',
        type: 'entity',
        priority: 80 - index
      });
    });

    layoutCalculator.addNode({
      id: 'acquirer-company',
      width: nodeSizes.company.width,
      height: nodeSizes.company.height,
      section: 'before',
      type: 'entity',
      priority: 70
    });

    layoutCalculator.addNode({
      id: 'target-section-header',
      width: nodeSizes.sectionHeader.width,
      height: nodeSizes.sectionHeader.height,
      section: 'before',
      type: 'header',
      priority: 60
    });

    // Target shareholders
    shareholderData.target.forEach((shareholder, index) => {
      layoutCalculator.addNode({
        id: shareholder.id,
        width: nodeSizes.shareholder.width,
        height: nodeSizes.shareholder.height,
        section: 'before',
        type: 'entity',
        priority: 50 - index
      });
    });

    layoutCalculator.addNode({
      id: 'target-company',
      width: nodeSizes.company.width,
      height: nodeSizes.company.height,
      section: 'before',
      type: 'entity',
      priority: 40
    });

    // Target subsidiaries
    targetSubsidiaries.forEach((subsidiary, index) => {
      layoutCalculator.addNode({
        id: `target-subsidiary-${index}`,
        width: nodeSizes.subsidiary.width,
        height: nodeSizes.subsidiary.height,
        section: 'before',
        type: 'entity',
        priority: 30 - index
      });
    });

    // TRANSACTION SECTION
    layoutCalculator.addNode({
      id: 'transaction-header',
      width: nodeSizes.header.width,
      height: nodeSizes.header.height,
      section: 'transaction',
      type: 'header',
      priority: 100
    });

    layoutCalculator.addNode({
      id: 'deal-description',
      width: nodeSizes.transaction.width,
      height: nodeSizes.transaction.height,
      section: 'transaction',
      type: 'description',
      priority: 90
    });

    // AFTER SECTION
    layoutCalculator.addNode({
      id: 'after-header',
      width: nodeSizes.header.width,
      height: nodeSizes.header.height,
      section: 'after',
      type: 'header',
      priority: 100
    });

    layoutCalculator.addNode({
      id: 'after-acquirer-header',
      width: nodeSizes.sectionHeader.width,
      height: nodeSizes.sectionHeader.height,
      section: 'after',
      type: 'header',
      priority: 90
    });

    // After acquirer shareholders
    shareholderData.acquirer.forEach((shareholder, index) => {
      layoutCalculator.addNode({
        id: `after-${shareholder.id}`,
        width: nodeSizes.shareholder.width,
        height: nodeSizes.shareholder.height,
        section: 'after',
        type: 'entity',
        priority: 80 - index
      });
    });

    layoutCalculator.addNode({
      id: 'after-acquirer-company',
      width: nodeSizes.company.width,
      height: nodeSizes.company.height,
      section: 'after',
      type: 'entity',
      priority: 70
    });

    layoutCalculator.addNode({
      id: 'remaining-target-shareholders',
      width: nodeSizes.shareholder.width,
      height: nodeSizes.shareholder.height,
      section: 'after',
      type: 'entity',
      priority: 60
    });

    layoutCalculator.addNode({
      id: 'controlled-target',
      width: nodeSizes.company.width,
      height: nodeSizes.company.height,
      section: 'after',
      type: 'entity',
      priority: 50
    });

    // After target subsidiaries
    targetSubsidiaries.forEach((subsidiary, index) => {
      layoutCalculator.addNode({
        id: `controlled-subsidiary-${index}`,
        width: nodeSizes.subsidiary.width,
        height: nodeSizes.subsidiary.height,
        section: 'after',
        type: 'entity',
        priority: 40 - index
      });
    });

    // Calculate optimal positions
    const positions = layoutCalculator.calculateLayout();

    // Create nodes with calculated positions
    // BEFORE SECTION HEADER
    const beforeHeaderPos = positions.get('before-header') || { x: 50, y: 20 };
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: beforeHeaderPos,
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
        width: `${nodeSizes.header.width}px`,
        height: `${nodeSizes.header.height}px`
      },
      draggable: false,
      selectable: false
    });

    // ACQUIRING COMPANY SECTION
    const acquirerSectionPos = positions.get('acquirer-section-header') || { x: 50, y: 80 };
    nodes.push({
      id: 'acquirer-section-header',
      type: 'default',
      position: acquirerSectionPos,
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
        width: `${nodeSizes.sectionHeader.width}px`,
        height: `${nodeSizes.sectionHeader.height}px`
      },
      draggable: false,
      selectable: false
    });

    // Acquirer shareholders
    shareholderData.acquirer.forEach((shareholder) => {
      const pos = positions.get(shareholder.id) || { x: 50, y: 150 };
      const colors = getNodeColors('stockholder', 'acquirer');
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="font-semibold text-xs">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: `${nodeSizes.shareholder.width}px`,
          height: `${nodeSizes.shareholder.height}px`
        }
      });
    });

    // Acquiring Company entity
    const acquirerCompanyPos = positions.get('acquirer-company') || { x: 50, y: 250 };
    const acquirerColors = getNodeColors('buyer', 'acquirer');
    nodes.push({
      id: 'acquirer-company',
      type: 'default',
      position: acquirerCompanyPos,
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
        width: `${nodeSizes.company.width}px`,
        height: `${nodeSizes.company.height}px`
      }
    });

    // TARGET COMPANY SECTION
    const targetSectionPos = positions.get('target-section-header') || { x: 50, y: 370 };
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: targetSectionPos,
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
        width: `${nodeSizes.sectionHeader.width}px`,
        height: `${nodeSizes.sectionHeader.height}px`
      },
      draggable: false,
      selectable: false
    });

    // Target shareholders
    shareholderData.target.forEach((shareholder) => {
      const pos = positions.get(shareholder.id) || { x: 50, y: 420 };
      const colors = getNodeColors('stockholder', 'target');
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div className="font-semibold text-xs">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: `${nodeSizes.shareholder.width}px`,
          height: `${nodeSizes.shareholder.height}px`
        }
      });
    });

    // Target Company entity
    const targetCompanyPos = positions.get('target-company') || { x: 50, y: 520 };
    const targetColors = getNodeColors('target', 'target');
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: targetCompanyPos,
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
        width: `${nodeSizes.company.width}px`,
        height: `${nodeSizes.company.height}px`
      }
    });

    // Target subsidiaries
    targetSubsidiaries.forEach((subsidiary, index) => {
      const pos = positions.get(`target-subsidiary-${index}`) || { x: 200, y: 520 };
      const subColors = getNodeColors('subsidiary', 'neutral');
      nodes.push({
        id: `target-subsidiary-${index}`,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center p-1">
              <div className="flex items-center justify-center mb-1">
                <Building2 className="h-3 w-3 text-purple-600" />
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
          width: `${nodeSizes.subsidiary.width}px`,
          height: `${nodeSizes.subsidiary.height}px`
        }
      });
    });

    // TRANSACTION SECTION
    const transactionHeaderPos = positions.get('transaction-header') || { x: 450, y: 20 };
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: transactionHeaderPos,
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-800">
            SUGGESTED DEAL STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: `${nodeSizes.header.width}px`,
        height: `${nodeSizes.header.height}px`
      },
      draggable: false,
      selectable: false
    });

    // Enhanced deal description
    const dealDescPos = positions.get('deal-description') || { x: 400, y: 150 };
    nodes.push({
      id: 'deal-description',
      type: 'default',
      position: dealDescPos,
      data: {
        label: (
          <div className="text-center p-4">
            <div className="text-lg font-bold mb-3 text-blue-900">
              Share Acquisition Transaction
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Transaction Type:</strong>
                <div className="text-blue-700">Acquiring Company purchases controlling stake</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">HK$1,000M cash payment</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Ownership Split:</strong>
                <div className="text-orange-700">
                  • Acquirer: 70% controlling<br/>
                  • Remaining: 30%
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <strong className="text-purple-800">Structure:</strong>
                <div className="text-purple-700">Target remains listed under Acquirer control</div>
              </div>
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: '#f8fafc',
        border: '3px solid #2563eb',
        borderRadius: '12px',
        width: `${nodeSizes.transaction.width}px`,
        height: `${nodeSizes.transaction.height}px`
      },
      draggable: false,
      selectable: false
    });

    // AFTER SECTION
    const afterHeaderPos = positions.get('after-header') || { x: 850, y: 20 };
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: afterHeaderPos,
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
        width: `${nodeSizes.header.width}px`,
        height: `${nodeSizes.header.height}px`
      },
      draggable: false,
      selectable: false
    });

    // After: Acquiring Company Shareholders (unchanged)
    const afterAcquirerHeaderPos = positions.get('after-acquirer-header') || { x: 850, y: 80 };
    nodes.push({
      id: 'after-acquirer-header',
      type: 'default',
      position: afterAcquirerHeaderPos,
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
        width: `${nodeSizes.sectionHeader.width}px`,
        height: `${nodeSizes.sectionHeader.height}px`
      },
      draggable: false,
      selectable: false
    });

    shareholderData.acquirer.forEach((shareholder) => {
      const pos = positions.get(`after-${shareholder.id}`) || { x: 850, y: 150 };
      const colors = getNodeColors('stockholder', 'acquirer');
      nodes.push({
        id: `after-${shareholder.id}`,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="font-semibold text-xs">{shareholder.name}</div>
              <div className="text-xs text-gray-600 font-medium">{shareholder.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: `${nodeSizes.shareholder.width}px`,
          height: `${nodeSizes.shareholder.height}px`
        }
      });
    });

    // After: Acquiring Company (now controlling target)
    const afterAcquirerCompanyPos = positions.get('after-acquirer-company') || { x: 850, y: 250 };
    nodes.push({
      id: 'after-acquirer-company',
      type: 'default',
      position: afterAcquirerCompanyPos,
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-blue-700 font-medium">Controls Target (70%)</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `3px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        width: `${nodeSizes.company.width}px`,
        height: `${nodeSizes.company.height}px`
      }
    });

    // Remaining Target Shareholders
    const remainingShareholdersPos = positions.get('remaining-target-shareholders') || { x: 1050, y: 250 };
    nodes.push({
      id: 'remaining-target-shareholders',
      type: 'default',
      position: remainingShareholdersPos,
      data: {
        label: (
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div className="font-semibold text-xs">Remaining Target Shareholders</div>
            <div className="text-xs text-orange-700 font-medium">30% ownership</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColors('stockholder', 'target').backgroundColor,
        border: `2px solid ${getNodeColors('stockholder', 'target').borderColor}`,
        borderRadius: '8px',
        width: `${nodeSizes.shareholder.width}px`,
        height: `${nodeSizes.shareholder.height}px`
      }
    });

    // After: Target Company (now controlled)
    const controlledTargetPos = positions.get('controlled-target') || { x: 920, y: 380 };
    nodes.push({
      id: 'controlled-target',
      type: 'default',
      position: controlledTargetPos,
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
        width: `${nodeSizes.company.width}px`,
        height: `${nodeSizes.company.height}px`
      }
    });

    // After: Target Subsidiaries
    targetSubsidiaries.forEach((subsidiary, index) => {
      const pos = positions.get(`controlled-subsidiary-${index}`) || { x: 1100, y: 450 };
      const subColors = getNodeColors('subsidiary', 'neutral');
      nodes.push({
        id: `controlled-subsidiary-${index}`,
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="text-center p-1">
              <div className="flex items-center justify-center mb-1">
                <Building2 className="h-3 w-3 text-purple-600" />
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
          width: `${nodeSizes.subsidiary.width}px`,
          height: `${nodeSizes.subsidiary.height}px`
        }
      });
    });

    // EDGES - Corporate Structure Lines (reduced for clarity)
    
    // Acquirer structure (before) - only main connections
    if (shareholderData.acquirer.length > 0) {
      edges.push({
        id: `edge-${shareholderData.acquirer[0].id}-to-acquirer`,
        source: shareholderData.acquirer[0].id,
        target: 'acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 2
        },
        label: 'Controls',
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    }

    // Target structure (before) - only main connections
    if (shareholderData.target.length > 0) {
      edges.push({
        id: `edge-${shareholderData.target[0].id}-to-target`,
        source: shareholderData.target[0].id,
        target: 'target-company',
        type: 'straight',
        style: {
          stroke: '#f59e0b',
          strokeWidth: 2
        },
        label: 'Owns',
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#f59e0b'
        }
      });
    }

    // After structure - key control relationships
    if (shareholderData.acquirer.length > 0) {
      edges.push({
        id: `edge-after-${shareholderData.acquirer[0].id}-to-acquirer`,
        source: `after-${shareholderData.acquirer[0].id}`,
        target: 'after-acquirer-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 2
        }
      });
    }

    // Control relationships (after)
    edges.push({
      id: 'edge-acquirer-controls-target',
      source: 'after-acquirer-company',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3
      },
      label: '70% Control',
      labelStyle: {
        fontSize: '12px',
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
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#f59e0b'
      }
    });

    // TRANSACTION FLOW EDGES (Dotted) - simplified
    edges.push({
      id: 'transaction-flow-acquirer',
      source: 'acquirer-company',
      target: 'deal-description',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Acquires',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    if (shareholderData.target.length > 0) {
      edges.push({
        id: 'transaction-flow-target',
        source: shareholderData.target[0].id,
        target: 'deal-description',
        type: 'straight',
        style: {
          stroke: '#dc2626',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: 'Sells',
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#dc2626'
        }
      });
    }

    edges.push({
      id: 'transaction-result',
      source: 'deal-description',
      target: 'after-acquirer-company',
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
  }, [transactionFlow, spacing, viewMode]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={setReactFlowInstance}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: zoom }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      
      <DiagramControls
        zoom={zoom}
        onZoomChange={setZoom}
        spacing={spacing}
        onSpacingChange={setSpacing}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFitView={handleFitView}
        onReset={handleReset}
      />
    </div>
  );
};

export default CombinedTransactionFlowDiagram;
