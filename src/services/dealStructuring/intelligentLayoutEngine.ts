
import { EnhancedTransactionEntity, EnhancedTransactionRelationship, VisualLayout } from '@/types/enhancedTransactionFlow';

export class IntelligentLayoutEngine {
  private readonly SECTION_WIDTH = 350;
  private readonly SECTION_SPACING = 150;
  private readonly ENTITY_WIDTH = 140;
  private readonly ENTITY_HEIGHT = 60;
  private readonly LEVEL_SPACING = 120;
  private readonly HORIZONTAL_SPACING = 160;

  generateLayout(
    beforeEntities: EnhancedTransactionEntity[],
    beforeRelationships: EnhancedTransactionRelationship[],
    afterEntities: EnhancedTransactionEntity[],
    afterRelationships: EnhancedTransactionRelationship[]
  ): VisualLayout {
    
    const sections = {
      before: { x: 50, y: 50, width: this.SECTION_WIDTH, height: 600 },
      transaction: { x: 50 + this.SECTION_WIDTH + this.SECTION_SPACING, y: 50, width: this.SECTION_WIDTH, height: 600 },
      after: { x: 50 + 2 * (this.SECTION_WIDTH + this.SECTION_SPACING), y: 50, width: this.SECTION_WIDTH, height: 600 }
    };

    const entityPositions = new Map<string, { x: number; y: number }>();
    const hierarchyLevels = new Map<string, number>();

    // Layout before entities with proper shareholder grouping
    this.layoutEntitiesByOwnershipHierarchy(beforeEntities, beforeRelationships, sections.before, entityPositions, hierarchyLevels, 'before');
    
    // Layout after entities with same structure for comparison
    this.layoutEntitiesByOwnershipHierarchy(afterEntities, afterRelationships, sections.after, entityPositions, hierarchyLevels, 'after');

    return {
      sections,
      entityPositions,
      hierarchyLevels
    };
  }

  private layoutEntitiesByOwnershipHierarchy(
    entities: EnhancedTransactionEntity[],
    relationships: EnhancedTransactionRelationship[],
    section: { x: number; y: number; width: number; height: number },
    entityPositions: Map<string, { x: number; y: number }>,
    hierarchyLevels: Map<string, number>,
    phase: string
  ) {
    // Group entities by their role in the ownership structure
    const ownershipGroups = this.groupEntitiesByOwnershipLevel(entities, relationships);
    
    let currentY = section.y + 80; // Start below section header

    // Level 0: All shareholders/buyers at the same level
    const shareholders = ownershipGroups.get(0) || [];
    if (shareholders.length > 0) {
      this.positionEntitiesAtLevel(shareholders, section, currentY, entityPositions, hierarchyLevels, 0);
      currentY += this.LEVEL_SPACING;
    }

    // Level 1: Target companies
    const targets = ownershipGroups.get(1) || [];
    if (targets.length > 0) {
      this.positionEntitiesAtLevel(targets, section, currentY, entityPositions, hierarchyLevels, 1);
      currentY += this.LEVEL_SPACING;
    }

    // Level 2: Subsidiaries (if any)
    const subsidiaries = ownershipGroups.get(2) || [];
    if (subsidiaries.length > 0) {
      this.positionEntitiesAtLevel(subsidiaries, section, currentY, entityPositions, hierarchyLevels, 2);
    }
  }

  private groupEntitiesByOwnershipLevel(
    entities: EnhancedTransactionEntity[],
    relationships: EnhancedTransactionRelationship[]
  ): Map<number, EnhancedTransactionEntity[]> {
    const groups = new Map<number, EnhancedTransactionEntity[]>();
    
    // Find entities that are targets of ownership (owned entities)
    const ownedEntityIds = new Set(
      relationships
        .filter(r => r.type === 'ownership')
        .map(r => r.target)
    );

    // Level 0: Shareholders/Buyers (entities that own others but aren't owned)
    const shareholders = entities.filter(e => 
      !ownedEntityIds.has(e.id) && 
      (e.type === 'buyer' || e.type === 'stockholder' || e.type === 'management') &&
      e.type !== 'consideration'
    );

    // Level 1: Target companies (entities that are owned)
    const targets = entities.filter(e => 
      ownedEntityIds.has(e.id) || e.type === 'target'
    );

    // Level 2: Subsidiaries (if there are multi-level ownership chains)
    const subsidiaries = entities.filter(e => 
      e.type === 'subsidiary' || e.type === 'spv'
    );

    if (shareholders.length > 0) groups.set(0, shareholders);
    if (targets.length > 0) groups.set(1, targets);
    if (subsidiaries.length > 0) groups.set(2, subsidiaries);

    return groups;
  }

  private positionEntitiesAtLevel(
    entities: EnhancedTransactionEntity[],
    section: { x: number; y: number; width: number; height: number },
    levelY: number,
    entityPositions: Map<string, { x: number; y: number }>,
    hierarchyLevels: Map<string, number>,
    level: number
  ) {
    const totalWidth = entities.length * this.ENTITY_WIDTH + (entities.length - 1) * 20;
    const startX = section.x + (section.width - totalWidth) / 2;

    entities.forEach((entity, index) => {
      const x = startX + index * (this.ENTITY_WIDTH + 20);
      const y = levelY;

      entityPositions.set(entity.id, { x, y });
      hierarchyLevels.set(entity.id, level);
    });
  }

  calculateOptimalZoom(entityPositions: Map<string, { x: number; y: number }>): number {
    if (entityPositions.size === 0) return 0.9;

    const positions = Array.from(entityPositions.values());
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const diagramWidth = maxX - minX + this.ENTITY_WIDTH;
    const diagramHeight = maxY - minY + this.ENTITY_HEIGHT;

    // Calculate zoom to fit in viewport
    const zoomX = 1000 / diagramWidth;
    const zoomY = 600 / diagramHeight;

    return Math.min(Math.min(zoomX, zoomY), 1.0);
  }
}

export const intelligentLayoutEngine = new IntelligentLayoutEngine();
