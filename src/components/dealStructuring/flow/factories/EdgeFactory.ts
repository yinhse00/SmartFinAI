
import { Edge } from '@xyflow/react';

export class EdgeFactory {
  private edges: Edge[] = [];

  createOwnershipEdge(
    id: string,
    source: string,
    target: string,
    percentage: string,
    color: string = '#2563eb',
    strokeWidth: number = 3
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'straight',
      style: {
        stroke: color,
        strokeWidth
      },
      label: percentage,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: color,
        backgroundColor: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb'
      }
    };
  }

  createTransactionFlowEdge(
    id: string,
    source: string,
    target: string,
    label: string,
    color: string = '#16a34a',
    strokeWidth: number = 4,
    dashed: boolean = true
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'straight',
      style: {
        stroke: color,
        strokeWidth,
        ...(dashed && { strokeDasharray: '8,4' })
      },
      label,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: color,
        backgroundColor: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        border: `1px solid ${color}`
      }
    };
  }

  createConsiderationEdge(
    id: string,
    source: string,
    target: string,
    label: string = 'HK$1,000M'
  ): Edge {
    return {
      id,
      source,
      target,
      type: 'smoothstep',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      label,
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a',
        backgroundColor: '#f0fdf4',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid #16a34a'
      },
      labelBgBorderRadius: 4,
      labelBgPadding: [2, 6]
    };
  }

  getEdges(): Edge[] {
    return this.edges;
  }

  addEdge(edge: Edge): void {
    this.edges.push(edge);
  }

  clearEdges(): void {
    this.edges = [];
  }
}
