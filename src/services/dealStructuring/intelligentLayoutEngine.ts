
import { EnhancedTransactionEntity, EnhancedTransactionRelationship, VisualLayout } from '@/types/enhancedTransactionFlow';

export class IntelligentLayoutEngine {
  private readonly SECTION_WIDTH = 400;
  private readonly SECTION_SPACING = 100;
  private readonly ENTITY_WIDTH = 160;
  private readonly ENTITY_HEIGHT = 80;
  private readonly VERTICAL_SPACING = 100;
  private readonly HORIZONTAL_SPACING = 200;

  generateLayout(
    beforeEntities: EnhancedTransactionEntity[],
    beforeRelationships: EnhancedTransactionRelationship[],
    afterEntities: EnhancedTransactionEntity[],
    afterRelationships: EnhancedTransactionRelationship[]
  ): VisualLayout {
    
    // Calculate section positions
    const sections = {
      before: { x: 50, y: 50, width: this.SECTION_WIDTH, height: 600 },
      transaction: { x: 50 + this.SECTION_WIDTH + this.SECTION_SPACING, y: 50, width: this.SECTION_WIDTH, height: 600 },
      after: { x: 50 + 2 * (this.SECTION_WIDTH + this.SECTION_SPACING), y: 50, width: this.SECTION_WIDTH, height: 600 }
    };

    const entityPositions = new Map<string, { x: number; y: number }>();
    const hierarchyLevels = new Map<string, number>();

    // Layout before entities
    this.layoutEntitiesInSection(beforeEntities, beforeRelationships, sections.before, entityPositions, hierarchyLevels, 'before');
    
    // Layout after entities (mirrored structure for comparison)
    this.layoutEntitiesInSection(afterEntities, afterRelationships, sections.after, entityPositions, hierarchyLevels, 'after');

    // Position transaction summary in center
    entityPositions.set('transaction-summary', {
      x: sections.transaction.x + this.SECTION_WIDTH / 2 - this.ENTITY_WIDTH / 2,
      y: sections.transaction.y + 200
    });

    return {
      sections,
      entityPositions,
      hierarchyLevels
    };
  }

  private layoutEntitiesInSection(
    entities: EnhancedTransactionEntity[],
    relationships: EnhancedTransactionRelationship[],
    section: { x: number; y: number; width: number; height: number },
    entityPositions: Map<string, { x: number; y: number }>,
    hierarchyLevels: Map<string, number>,
    phase: string
  ) {
    // Group entities by type and hierarchy level
    const entityGroups = this.groupEntitiesByHierarchy(entities, relationships);
    
    let currentY = section.y + 60; // Start below section header
    
    // Layout each hierarchy level
    entityGroups.forEach((levelEntities, level) => {
      const levelY = currentY;
      const entitiesPerRow = Math.ceil(Math.sqrt(levelEntities.length));
      const totalWidth = Math.min(entitiesPerRow * (this.ENTITY_WIDTH + 20), section.width - 40);
      const startX = section.x + (section.width - totalWidth) / 2;

      levelEntities.forEach((entity, index) => {
        const row = Math.floor(index / entitiesPerRow);
        const col = index % entitiesPerRow;
        
        const x = startX + col * (this.ENTITY_WIDTH + 20);
        const y = levelY + row * (this.ENTITY_HEIGHT + 20);

        entityPositions.set(entity.id, { x, y });
        hierarchyLevels.set(entity.id, level);
      });

      // Move to next level
      const rows = Math.ceil(levelEntities.length / entitiesPerRow);
      currentY += rows * (this.ENTITY_HEIGHT + 20) + this.VERTICAL_SPACING;
    });
  }

  private groupEntitiesByHierarchy(
    entities: EnhancedTransactionEntity[],
    relationships: EnhancedTransactionRelationship[]
  ): Map<number, EnhancedTransactionEntity[]> {
    const groups = new Map<number, EnhancedTransactionEntity[]>();
    
    // Find root entities (buyers, acquirers, controlling shareholders)
    const rootEntities = entities.filter(e => 
      e.type === 'buyer' || 
      e.isControlling || 
      e.entityClass === 'institutional'
    );

    // Find target entities
    const targetEntities = entities.filter(e => e.type === 'target');
    
    // Find consideration entities
    const considerationEntities = entities.filter(e => e.type === 'consideration');
    
    // Find remaining stockholders
    const otherEntities = entities.filter(e => 
      !rootEntities.includes(e) && 
      !targetEntities.includes(e) && 
      !considerationEntities.includes(e)
    );

    // Assign hierarchy levels
    if (rootEntities.length > 0) groups.set(0, rootEntities);
    if (otherEntities.length > 0) groups.set(1, otherEntities);
    if (targetEntities.length > 0) groups.set(2, targetEntities);
    if (considerationEntities.length > 0) groups.set(3, considerationEntities);

    return groups;
  }

  calculateOptimalZoom(entityPositions: Map<string, { x: number; y: number }>): number {
    if (entityPositions.size === 0) return 0.8;

    const positions = Array.from(entityPositions.values());
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const diagramWidth = maxX - minX + this.ENTITY_WIDTH;
    const diagramHeight = maxY - minY + this.ENTITY_HEIGHT;

    // Calculate zoom to fit in viewport (assuming 1200x700 viewport)
    const zoomX = 1200 / diagramWidth;
    const zoomY = 700 / diagramHeight;

    return Math.min(Math.min(zoomX, zoomY), 1.0);
  }
}

export const intelligentLayoutEngine = new IntelligentLayoutEngine();
