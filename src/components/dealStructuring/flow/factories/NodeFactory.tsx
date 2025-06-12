
import React from 'react';
import { Node } from '@xyflow/react';
import { LAYOUT_CONFIG } from '../config/LayoutConfig';
import { getNodeColors } from '../config/NodeColorScheme';

export class NodeFactory {
  private nodes: Node[] = [];

  createHeaderNode(id: string, x: number, y: number, title: string): Node {
    return {
      id,
      type: 'default',
      position: { x, y },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800">
            {title}
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
    };
  }

  createSectionHeaderNode(id: string, x: number, y: number, title: string, colorClass: string): Node {
    return {
      id,
      type: 'default',
      position: { x, y },
      data: { 
        label: (
          <div className={`text-sm font-semibold ${colorClass}`}>
            {title}
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '320px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    };
  }

  createEntityNode(
    id: string, 
    x: number, 
    y: number, 
    title: string, 
    subtitle: string | null, 
    entityType: string, 
    entityGroup: 'acquirer' | 'target' | 'neutral',
    width: string = '160px',
    height: string = '70px',
    borderWidth: string = '2px'
  ): Node {
    const colors = getNodeColors(entityType, entityGroup);
    
    return {
      id,
      type: 'default',
      position: { x, y },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="font-semibold text-sm">{title}</div>
            {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
          </div>
        )
      },
      style: {
        backgroundColor: colors.backgroundColor,
        border: `${borderWidth} solid ${colors.borderColor}`,
        borderRadius: '8px',
        width,
        height
      }
    };
  }

  createTransactionDetailsNode(id: string, x: number, y: number): Node {
    return {
      id,
      type: 'default',
      position: { x, y },
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
        width: '350px',
        height: '220px'
      },
      draggable: false,
      selectable: false
    };
  }

  getNodes(): Node[] {
    return this.nodes;
  }

  addNode(node: Node): void {
    this.nodes.push(node);
  }

  clearNodes(): void {
    this.nodes = [];
  }
}
