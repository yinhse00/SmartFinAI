
interface LayoutNode {
  id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  section: 'before' | 'transaction' | 'after';
  type: 'header' | 'entity' | 'description';
  priority: number; // Higher priority gets positioned first
}

interface LayoutConfig {
  containerWidth: number;
  containerHeight: number;
  spacing: number;
  viewMode: 'compact' | 'normal' | 'detailed';
}

export class LayoutCalculator {
  private nodes: LayoutNode[] = [];
  private config: LayoutConfig;
  private sectionWidth: number;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.sectionWidth = config.containerWidth / 3; // Three sections: before, transaction, after
  }

  addNode(node: LayoutNode): void {
    this.nodes.push(node);
  }

  calculateLayout(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    
    // Sort nodes by section and priority
    const sortedNodes = [...this.nodes].sort((a, b) => {
      if (a.section !== b.section) {
        const sectionOrder = { before: 0, transaction: 1, after: 2 };
        return sectionOrder[a.section] - sectionOrder[b.section];
      }
      return b.priority - a.priority;
    });

    // Calculate section boundaries
    const sectionBounds = {
      before: { startX: 20, endX: this.sectionWidth - 20 },
      transaction: { startX: this.sectionWidth + 20, endX: (this.sectionWidth * 2) - 20 },
      after: { startX: (this.sectionWidth * 2) + 20, endX: (this.sectionWidth * 3) - 20 }
    };

    // Track occupied areas to prevent overlaps
    const occupiedAreas: Array<{ x: number; y: number; width: number; height: number; section: string }> = [];

    // Position nodes section by section
    Object.keys(sectionBounds).forEach(sectionKey => {
      const section = sectionKey as keyof typeof sectionBounds;
      const sectionNodes = sortedNodes.filter(node => node.section === section);
      const bounds = sectionBounds[section];
      
      let currentY = 50; // Start from top with margin
      
      sectionNodes.forEach(node => {
        const position = this.findOptimalPosition(
          node,
          bounds,
          currentY,
          occupiedAreas.filter(area => area.section === section)
        );
        
        positions.set(node.id, position);
        
        // Mark this area as occupied
        occupiedAreas.push({
          x: position.x,
          y: position.y,
          width: node.width,
          height: node.height,
          section
        });
        
        // Update currentY for next node (with spacing)
        currentY = Math.max(currentY, position.y + node.height + this.config.spacing);
      });
    });

    return positions;
  }

  private findOptimalPosition(
    node: LayoutNode,
    bounds: { startX: number; endX: number },
    preferredY: number,
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>
  ): { x: number; y: number } {
    // Center the node horizontally in its section
    const centerX = (bounds.startX + bounds.endX) / 2;
    let x = centerX - (node.width / 2);
    
    // Ensure node stays within section bounds
    x = Math.max(bounds.startX, Math.min(x, bounds.endX - node.width));
    
    let y = preferredY;
    
    // Check for overlaps and adjust position if needed
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      const hasOverlap = occupiedAreas.some(area => 
        this.hasOverlap(
          { x, y, width: node.width, height: node.height },
          area
        )
      );
      
      if (!hasOverlap) {
        break;
      }
      
      // Move down and try again
      y += this.config.spacing;
      attempts++;
    }
    
    return { x, y };
  }

  private hasOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    const buffer = this.config.spacing / 2; // Add buffer to prevent tight overlaps
    
    return !(
      rect1.x + rect1.width + buffer <= rect2.x ||
      rect2.x + rect2.width + buffer <= rect1.x ||
      rect1.y + rect1.height + buffer <= rect2.y ||
      rect2.y + rect2.height + buffer <= rect1.y
    );
  }

  clear(): void {
    this.nodes = [];
  }
}
