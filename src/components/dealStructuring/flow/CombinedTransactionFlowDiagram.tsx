import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';

interface CombinedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
  showUnifiedView?: boolean;
}

const CombinedTransactionFlowDiagram: React.FC<CombinedTransactionFlowDiagramProps> = ({
  transactionFlow,
  showUnifiedView = false
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (showUnifiedView) {
      // Unified post-transaction view layout
      const CENTER_X = 400;
      const VERTICAL_SPACING = 120;
      const HORIZONTAL_SPACING = 200;
      
      // Layout positions for unified view
      const SHAREHOLDERS_Y = 50;
      const ACQUIRING_COMPANY_Y = 200;
      const TARGET_COMPANY_Y = 350;
      const CONSIDERATION_Y = 500;

      const afterEntities = transactionFlow.after.entities;
      const afterRelationships = transactionFlow.after.relationships;
      const transactionContext = transactionFlow.transactionContext;

      // Color schemes for different entity types
      const getNodeColors = (type: string) => {
        switch (type) {
          case 'target':
            return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
          case 'buyer':
            return { backgroundColor: '#dbeafe', borderColor: '#2563eb' };
          case 'stockholder':
            return { backgroundColor: '#f3f4f6', borderColor: '#6b7280' };
          case 'consideration':
            return { backgroundColor: '#f0fdf4', borderColor: '#16a34a' };
          default:
            return { backgroundColor: '#f3f4f6', borderColor: '#6b7280' };
        }
      };

      // Title
      nodes.push({
        id: 'title',
        type: 'default',
        position: { x: CENTER_X - 150, y: 10 },
        data: { 
          label: (
            <div className="text-xl font-bold text-gray-800">
              Post-Transaction Corporate & Shareholding Structure
            </div>
          )
        },
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          width: '400px',
          height: '30px'
        },
        draggable: false,
        selectable: false
      });

      // Controlling Shareholder
      const controllingEntity = afterEntities.find(e => e.id === 'controlling-shareholder');
      if (controllingEntity) {
        const colors = getNodeColors('stockholder');
        nodes.push({
          id: 'controlling-shareholder',
          type: 'default',
          position: { x: CENTER_X - HORIZONTAL_SPACING, y: SHAREHOLDERS_Y },
          data: {
            label: (
              <div className="text-center p-2">
                <div className="font-semibold text-sm">{controllingEntity.name}</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `2px solid ${colors.borderColor}`,
            borderRadius: '8px',
            width: '160px',
            height: '60px'
          }
        });
      }

      // Public Shareholders
      const publicEntity = afterEntities.find(e => e.id === 'public-shareholders');
      if (publicEntity) {
        const colors = getNodeColors('stockholder');
        nodes.push({
          id: 'public-shareholders',
          type: 'default',
          position: { x: CENTER_X + HORIZONTAL_SPACING - 160, y: SHAREHOLDERS_Y },
          data: {
            label: (
              <div className="text-center p-2">
                <div className="font-semibold text-sm">{publicEntity.name}</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `2px solid ${colors.borderColor}`,
            borderRadius: '8px',
            width: '160px',
            height: '60px'
          }
        });
      }

      // Acquiring Company
      const acquiringEntity = afterEntities.find(e => e.id === 'acquiring-company');
      if (acquiringEntity) {
        const colors = getNodeColors('buyer');
        nodes.push({
          id: 'acquiring-company',
          type: 'default',
          position: { x: CENTER_X - 100, y: ACQUIRING_COMPANY_Y },
          data: {
            label: (
              <div className="text-center p-3">
                <div className="font-semibold text-lg">{acquiringEntity.name}</div>
                <div className="text-sm text-gray-600">{acquiringEntity.description}</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `3px solid ${colors.borderColor}`,
            borderRadius: '12px',
            width: '200px',
            height: '90px'
          }
        });
      }

      // Target Company
      const targetEntity = afterEntities.find(e => e.id === 'target-company');
      if (targetEntity) {
        const colors = getNodeColors('target');
        nodes.push({
          id: 'target-company',
          type: 'default',
          position: { x: CENTER_X - 100, y: TARGET_COMPANY_Y },
          data: {
            label: (
              <div className="text-center p-3">
                <div className="font-semibold text-lg">{targetEntity.name}</div>
                <div className="text-sm text-gray-600">{targetEntity.description}</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `3px solid ${colors.borderColor}`,
            borderRadius: '12px',
            width: '200px',
            height: '90px'
          }
        });
      }

      // Remaining Target Shareholders
      const remainingEntity = afterEntities.find(e => e.id === 'remaining-target-shareholders');
      if (remainingEntity) {
        const colors = getNodeColors('stockholder');
        nodes.push({
          id: 'remaining-target-shareholders',
          type: 'default',
          position: { x: CENTER_X + HORIZONTAL_SPACING - 160, y: TARGET_COMPANY_Y },
          data: {
            label: (
              <div className="text-center p-2">
                <div className="font-semibold text-sm">{remainingEntity.name}</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `2px solid ${colors.borderColor}`,
            borderRadius: '8px',
            width: '160px',
            height: '60px'
          }
        });
      }

      // Consideration
      const considerationEntity = afterEntities.find(e => e.id === 'consideration');
      if (considerationEntity) {
        const colors = getNodeColors('consideration');
        nodes.push({
          id: 'consideration',
          type: 'default',
          position: { x: CENTER_X - 100, y: CONSIDERATION_Y },
          data: {
            label: (
              <div className="text-center p-3">
                <div className="font-semibold text-lg">{considerationEntity.name}</div>
                <div className="text-sm text-gray-600">Transaction Payment</div>
              </div>
            )
          },
          style: {
            backgroundColor: colors.backgroundColor,
            border: `3px solid ${colors.borderColor}`,
            borderRadius: '12px',
            width: '200px',
            height: '80px'
          }
        });
      }

      // Create edges with percentage/value labels
      afterRelationships.forEach((rel, index) => {
        if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
          edges.push({
            id: `unified-edge-${index}`,
            source: rel.source,
            target: rel.target,
            type: 'straight',
            style: {
              stroke: rel.type === 'consideration' ? '#16a34a' : '#2563eb',
              strokeWidth: rel.type === 'consideration' ? 3 : 2
            },
            label: rel.percentage ? `${rel.percentage}%` : rel.value ? `${transactionContext?.currency} ${(rel.value / 1000000).toFixed(0)}M` : '',
            labelStyle: {
              fontSize: '12px',
              fontWeight: 'bold',
              fill: rel.type === 'consideration' ? '#16a34a' : '#2563eb',
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${rel.type === 'consideration' ? '#16a34a' : '#2563eb'}`
            }
          });
        }
      });

      return { nodes, edges };
    }

    // Layout configuration - using identical Y-coordinates for Before/After sections
    const SECTION_WIDTH = 400;
    const SECTION_SPACING = 80;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;

    // Section positions
    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    // Shared Y-coordinates for mirrored layout
    const SECTION_HEADER_Y = START_Y;
    const ACQUIRING_HEADER_Y = START_Y + 60;
    const CONTROLLING_SHAREHOLDER_Y = START_Y + 110;
    const ACQUIRING_COMPANY_Y = START_Y + 190;
    const TARGET_HEADER_Y = START_Y + 310;
    const TARGET_SHAREHOLDERS_Y = START_Y + 360;
    const TARGET_COMPANY_Y = START_Y + 440;

    // Color schemes for different entity types
    const getNodeColors = (type: string, ownership?: number) => {
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
          if (ownership && ownership > 50) {
            return {
              backgroundColor: '#dbeafe',
              borderColor: '#2563eb'
            };
          }
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
      }
    };

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // BEFORE SECTION
    // Before Section Header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X, y: SECTION_HEADER_Y },
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
        width: '350px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Acquiring Company Section Header
    nodes.push({
      id: 'acquiring-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: ACQUIRING_HEADER_Y },
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
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // Controlling Shareholder
    const controllingEntity = beforeEntities.find(e => e.id === 'before-controlling-shareholder');
    if (controllingEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'before-controlling-shareholder',
        type: 'default',
        position: { x: BEFORE_X, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{controllingEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    // Public Shareholders
    const publicEntity = beforeEntities.find(e => e.id === 'before-public-shareholders');
    if (publicEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'before-public-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 200, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{publicEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    // Acquiring Company
    const acquiringEntity = beforeEntities.find(e => e.id === 'before-acquiring-company');
    if (acquiringEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'before-acquiring-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: ACQUIRING_COMPANY_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{acquiringEntity.name}</div>
              <div className="text-xs text-gray-600">Listed Entity</div>
              {acquiringEntity.description && (
                <div className="text-xs text-gray-500">{acquiringEntity.description}</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '180px',
          height: '80px'
        }
      });
    }

    // Target Company Section Header
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: TARGET_HEADER_Y },
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
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // Target Existing Shareholders
    const targetShareholdersEntity = beforeEntities.find(e => e.id === 'before-target-shareholders');
    if (targetShareholdersEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'before-target-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 100, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{targetShareholdersEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '60px'
        }
      });
    }

    // Target Company
    const targetEntity = beforeEntities.find(e => e.id === 'before-target-company');
    if (targetEntity) {
      const colors = getNodeColors('target');
      nodes.push({
        id: 'before-target-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: TARGET_COMPANY_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{targetEntity.name}</div>
              <div className="text-xs text-gray-600">Target Entity</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '70px'
        }
      });
    }

    // TRANSACTION SECTION
    const transactionY = START_Y + 200;

    // Transaction Header
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: TRANSACTION_X, y: SECTION_HEADER_Y },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-800">
            TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
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
              {transactionContext?.type || 'Acquisition'}
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Transaction:</strong>
                <div className="text-blue-700">{transactionContext?.description}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">
                  {transactionContext?.currency} {(transactionContext?.amount || 0) / 1000000}M
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Ownership:</strong>
                <div className="text-orange-700">
                  {afterRelationships.find(r => r.source.includes('acquiring'))?.percentage}% stake acquired
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

    // AFTER SECTION - MIRRORING BEFORE SECTION LAYOUT
    // After Section Header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X, y: SECTION_HEADER_Y },
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
        width: '350px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Acquiring Company Structure Header (AFTER)
    nodes.push({
      id: 'after-acquiring-header',
      type: 'default',
      position: { x: AFTER_X, y: ACQUIRING_HEADER_Y },
      data: { 
        label: (
          <div className="text-sm font-semibold text-blue-700">
            ACQUIRING COMPANY STRUCTURE (MAINTAINED)
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // After Controlling Shareholder (Same Y as Before)
    const afterControllingEntity = afterEntities.find(e => e.id === 'after-controlling-shareholder');
    if (afterControllingEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'after-controlling-shareholder',
        type: 'default',
        position: { x: AFTER_X, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterControllingEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    // After Public Shareholders (Same Y as Before)
    const afterPublicEntity = afterEntities.find(e => e.id === 'after-public-shareholders');
    if (afterPublicEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'after-public-shareholders',
        type: 'default',
        position: { x: AFTER_X + 180, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterPublicEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    // After Acquiring Company (Same Y as Before)
    const afterAcquiringEntity = afterEntities.find(e => e.id === 'after-acquiring-company');
    if (afterAcquiringEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'after-acquiring-company',
        type: 'default',
        position: { x: AFTER_X + 90, y: ACQUIRING_COMPANY_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{afterAcquiringEntity.name}</div>
              <div className="text-xs text-gray-600">Listed Entity</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '80px'
        }
      });
    }

    // Target Company Header (AFTER)
    nodes.push({
      id: 'after-target-header',
      type: 'default',
      position: { x: AFTER_X, y: TARGET_HEADER_Y },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            TARGET COMPANY - NEW OWNERSHIP
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // Target Company New Shareholders (Same Y as Before Target Shareholders)
    const remainingEntity = afterEntities.find(e => e.id === 'after-remaining-shareholders');
    if (remainingEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'after-remaining-shareholders',
        type: 'default',
        position: { x: AFTER_X + 180, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{remainingEntity.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    // Acquiring Company as New Target Shareholder (positioned like the acquiring company shareholders)
    if (afterAcquiringEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'after-acquiring-as-shareholder',
        type: 'default',
        position: { x: AFTER_X, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterAcquiringEntity.name}</div>
              <div className="text-xs text-gray-500">New Owner</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    // Target Company Post-Transaction (Same Y as Before)
    const afterTargetEntity = afterEntities.find(e => e.id === 'after-target-company');
    if (afterTargetEntity) {
      const colors = getNodeColors('target');
      nodes.push({
        id: 'after-target-company',
        type: 'default',
        position: { x: AFTER_X + 90, y: TARGET_COMPANY_Y },
        data: {
          label: (
            <div className="text-center p-3">
              <div className="font-semibold text-sm">{afterTargetEntity.name}</div>
              <div className="text-xs text-gray-600">Post-Transaction</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `3px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '80px'
        }
      });
    }

    // EDGES - Create relationships based on the data with percentages shown on edges
    beforeRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `before-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            strokeWidth: 2
          },
          label: rel.percentage ? `${rel.percentage}%` : '',
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
      }
    });

    afterRelationships.forEach((rel, index) => {
      // Skip the direct acquiring company to target company edge as we're using a new node structure
      if (rel.source === 'after-acquiring-company' && rel.target === 'after-target-company') {
        // Create edge from the new acquiring shareholder node to target
        edges.push({
          id: `after-target-ownership-${index}`,
          source: 'after-acquiring-as-shareholder',
          target: 'after-target-company',
          type: 'straight',
          style: {
            stroke: '#2563eb',
            strokeWidth: 2
          },
          label: `${rel.percentage}%`,
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: '#2563eb',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
        return;
      }
      
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `after-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'consideration' ? '#16a34a' : rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            strokeWidth: rel.type === 'consideration' ? 3 : 2
          },
          label: rel.percentage ? `${rel.percentage}%` : rel.value ? `${transactionContext?.currency} ${(rel.value / 1000000).toFixed(0)}M` : '',
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: rel.type === 'consideration' ? '#16a34a' : rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
      }
    });

    // Transaction flow arrows
    edges.push({
      id: 'transaction-flow-in',
      source: 'before-acquiring-company',
      target: 'transaction-details',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Initiates',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#16a34a',
        backgroundColor: 'white',
        padding: '2px 4px',
        borderRadius: '3px'
      }
    });

    edges.push({
      id: 'transaction-flow-out',
      source: 'transaction-details',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#7c3aed',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Results In',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#7c3aed',
        backgroundColor: 'white',
        padding: '2px 4px',
        borderRadius: '3px'
      }
    });

    return { nodes, edges };
  }, [transactionFlow, showUnifiedView]);

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
        defaultViewport={{ x: 0, y: 0, zoom: showUnifiedView ? 0.8 : 0.6 }}
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
