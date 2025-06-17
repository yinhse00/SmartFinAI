import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, extractEntityNames, EntityNames } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';
import { 
  shouldUseShareholdingData, 
  getValidatedShareholdingData,
  isGenericShareholderName 
} from './shareholdingValidationUtils';

// Helper function to add parent hierarchy for a given entity
const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  prefix: string,
  visited: Set<string>,
  entitySide: 'acquirer' | 'target' // New parameter to track which side we're processing
): void => {
  if (!corpEntity.parentLink || visited.has(corpEntity.id + '-ancestors')) {
    return;
  }
  visited.add(corpEntity.id + '-ancestors');

  let currentCorpParentId = corpEntity.parentLink;
  let childNodeIdForParentLink = entityIdInDiagram;

  while (currentCorpParentId) {
    const parentCorpData = corporateStructureMap.get(currentCorpParentId);
    if (parentCorpData && !visited.has(parentCorpData.id)) {
      visited.add(parentCorpData.id);

      let parentEntityType = parentCorpData.type as TransactionEntity['type'];
      if (parentCorpData.type === 'issuer' && prefix === 'before') {
          parentEntityType = 'parent';
      } else if (parentCorpData.type === 'issuer') {
          parentEntityType = 'buyer';
      }

      const parentEntityId = generateEntityId(parentEntityType, parentCorpData.name, prefix);
      if (!entities.find(e => e.id === parentEntityId)) {
        entities.push({
          id: parentEntityId,
          name: parentCorpData.name,
          type: parentEntityType,
          description: `${parentCorpData.type} of ${entities.find(e => e.id === childNodeIdForParentLink)?.name || corpEntity.name}`,
        });
      }
      relationships.push({
        source: parentEntityId,
        target: childNodeIdForParentLink,
        type: 'ownership',
      } as AnyTransactionRelationship);

      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink;
    } else {
      currentCorpParentId = undefined;
    }
  }
};

// Validation function to prevent cross-entity relationships
const validateNoCrossEntityRelationships = (
  relationships: AnyTransactionRelationship[],
  acquirerEntityIds: Set<string>,
  targetEntityIds: Set<string>
): void => {
  const invalidRelationships = relationships.filter(rel => {
    const sourceIsAcquirer = acquirerEntityIds.has(rel.source);
    const targetIsAcquirer = acquirerEntityIds.has(rel.target);
    const sourceIsTarget = targetEntityIds.has(rel.source);
    const targetIsTarget = targetEntityIds.has(rel.target);
    
    // Check if relationship crosses between acquirer and target sides
    return (sourceIsAcquirer && targetIsTarget) || (sourceIsTarget && targetIsAcquirer);
  });

  if (invalidRelationships.length > 0) {
    console.error('❌ CRITICAL: Found invalid cross-entity relationships in BEFORE structure:');
    invalidRelationships.forEach(rel => {
      console.error(`  Invalid relationship: ${rel.source} -> ${rel.target} (${rel.type})`);
    });
    throw new Error('Invalid cross-entity relationships detected in BEFORE structure');
  }
};

export const buildBeforeStructure = (
  results: AnalysisResults,
  entityNames: EntityNames,
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';
  
  // Use separate visited sets for acquirer and target to prevent cross-contamination
  const acquirerVisitedAncestry = new Set<string>();
  const acquirerVisitedChildren = new Set<string>();
  const targetVisitedAncestry = new Set<string>();
  const targetVisitedChildren = new Set<string>();
  
  // Track entity IDs by side for validation
  const acquirerEntityIds = new Set<string>();
  const targetEntityIds = new Set<string>();

  console.log("Building Before Structure with entityNames:", entityNames);

  // 1. Process Acquirer Company (Listed Company) and its shareholders first
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.acquiringCompanyName && (ce.type === 'issuer' || ce.type === 'parent')
  );

  let acquirerRootId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'parent';

  if (acquirerCorpEntityData) {
    acquirerDiagramType = (entityNames.isAcquirerListed || acquirerCorpEntityData.type === 'issuer') ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, acquirerCorpEntityData.name, prefix);
    acquirerEntityIds.add(acquirerRootId);

    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: acquirerCorpEntityData.name,
        type: acquirerDiagramType,
        description: `Acquiring Company Root (${acquirerCorpEntityData.type} in CS)`,
      });
    }
    
    addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedAncestry, 'acquirer');
    addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedChildren);

    // Track all acquirer-related entities
    entities.forEach(e => {
      if (e.id.includes(acquirerCorpEntityData.name) || e.description?.includes(acquirerCorpEntityData.name)) {
        acquirerEntityIds.add(e.id);
      }
    });

    // Process acquirer's shareholders only if it's a listed company
    if (entityNames.isAcquirerListed) {
      // Only use shareholding data for acquirer if explicitly indicated
      // For now, we'll rely primarily on corporate structure for acquirer's shareholders
      const acquirerShareholdersFromResults = results.shareholding?.before?.filter(sh => {
        // Only include if there's clear indication this shareholder belongs to the acquirer
        // This is a conservative approach to avoid misattribution
        return false; // Disabled for now to prevent incorrect relationships
      });

      acquirerShareholdersFromResults?.forEach(holder => {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        acquirerEntityIds.add(shareholderId);
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: `${holder.percentage}% Shareholder of ${entityNames.acquiringCompanyName}`,
          });
        }
        relationships.push({
          source: shareholderId,
          target: acquirerRootId,
          type: 'ownership',
          percentage: holder.percentage,
        });
      });
    }

  } else if (entityNames.acquiringCompanyName && entityNames.acquiringCompanyName !== 'Acquiring Company') {
    acquirerDiagramType = entityNames.isAcquirerListed ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, entityNames.acquiringCompanyName, prefix);
    acquirerEntityIds.add(acquirerRootId);
    
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: entityNames.acquiringCompanyName,
        type: acquirerDiagramType,
        description: 'Acquiring Company (not in CS map)',
      });
    }
  } else {
    acquirerRootId = generateEntityId('buyer', 'Acquiring Company', prefix);
    acquirerEntityIds.add(acquirerRootId);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: 'Acquiring Company',
        type: 'buyer',
        description: 'Default Acquiring Company',
      });
    }
  }

  // 2. Process Target Company and its structure (completely separate from acquirer)
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.targetCompanyName && ce.type === 'target'
  );

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  targetEntityIds.add(targetId);
  
  if (!entities.find(e => e.id === targetId)) {
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Pre-Transaction)',
    });
  }

  // Process Target's shareholders with validation
  console.log(`🔍 Processing Target Company shareholders for ${entityNames.targetCompanyName}`);
  
  if (results.shareholding?.before && results.shareholding.before.length > 0) {
    console.log(`📋 Raw shareholding data:`, results.shareholding.before.map(h => ({ name: h.name, percentage: h.percentage })));
    
    // Validate and filter shareholding data
    if (shouldUseShareholdingData(results.shareholding.before, entityNames.targetCompanyName)) {
      const validShareholders = getValidatedShareholdingData(results.shareholding.before, entityNames.targetCompanyName);
      
      validShareholders.forEach((holder) => {
        // Ensure this holder isn't the acquirer itself
        if (holder.name !== entityNames.acquiringCompanyName) {
          const shareholderId = generateEntityId('stockholder', holder.name, prefix);
          targetEntityIds.add(shareholderId);
          
          if (!entities.find(e => e.id === shareholderId)) {
            entities.push({
              id: shareholderId,
              name: holder.name,
              type: 'stockholder',
              percentage: holder.percentage,
              description: `${holder.percentage}% Shareholder of ${entityNames.targetCompanyName}`,
            });
          }
          relationships.push({
            source: shareholderId,
            target: targetId,
            type: 'ownership',
            percentage: holder.percentage,
          });
          
          console.log(`✅ Created valid shareholder relationship: ${holder.name} -> ${entityNames.targetCompanyName} (${holder.percentage}%)`);
        }
      });
      
      // Check if we created any valid shareholders
      const createdValidShareholders = validShareholders.filter(h => h.name !== entityNames.acquiringCompanyName).length;
      if (createdValidShareholders === 0) {
        console.log(`⚠️ No valid shareholders created after filtering, using generic fallback`);
        // Fall through to generic shareholder creation below
      }
    } else {
      console.log(`🔄 Shareholding data not suitable for ${entityNames.targetCompanyName}, using generic fallback`);
      // Continue to generic shareholder creation below
    }
    
    // Check if we need to add generic shareholders
    const targetHasValidShareholders = relationships.some(r => 
      r.target === targetId && 
      r.type === 'ownership' && 
      entities.find(e => e.id === r.source && !isGenericShareholderName(e.name))
    );
    
    if (!targetHasValidShareholders) {
      console.log(`📝 Adding generic shareholders for ${entityNames.targetCompanyName} (no valid specific shareholders found)`);
      const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.targetCompanyName}`, prefix);
      targetEntityIds.add(genericShareholderId);
      
      if (!entities.find(e => e.id === genericShareholderId)) {
        entities.push({
          id: genericShareholderId,
          name: `Existing Shareholders of ${entityNames.targetCompanyName}`,
          type: 'stockholder',
          percentage: 100,
          description: '100% collective ownership',
        });
      }
      relationships.push({
        source: genericShareholderId,
        target: targetId,
        type: 'ownership',
        percentage: 100,
      });
    }
  } else if (targetCorpEntityData) {
    // Use corporate structure for Target's parents if no shareholding data
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedAncestry, 'target');
    
    // Track target-related entities
    entities.forEach(e => {
      if (e.id.includes(entityNames.targetCompanyName) || e.description?.includes(entityNames.targetCompanyName)) {
        targetEntityIds.add(e.id);
      }
    });
    
    // If no parents found, add generic shareholders
    const targetHasParents = relationships.some(r => r.target === targetId);
    if (!targetHasParents) {
      const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.targetCompanyName}`, prefix);
      targetEntityIds.add(genericShareholderId);
      
      if (!entities.find(e => e.id === genericShareholderId)) {
        entities.push({
          id: genericShareholderId,
          name: `Existing Shareholders of ${entityNames.targetCompanyName}`,
          type: 'stockholder',
          percentage: 100,
          description: '100% collective ownership',
        });
      }
      relationships.push({
        source: genericShareholderId,
        target: targetId,
        type: 'ownership',
        percentage: 100,
      });
    }
  } else {
    // Target not in CS map and no shareholding info
    const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.targetCompanyName}`, prefix);
    targetEntityIds.add(genericShareholderId);
    
    if (!entities.find(e => e.id === genericShareholderId)) {
      entities.push({
        id: genericShareholderId,
        name: `Existing Shareholders of ${entityNames.targetCompanyName}`,
        type: 'stockholder',
        percentage: 100,
        description: '100% collective ownership',
      });
    }
    relationships.push({
      source: genericShareholderId,
      target: targetId,
      type: 'ownership',
      percentage: 100,
    });
  }

  if (targetCorpEntityData) {
    // Add children (subsidiaries) of the Target using separate visited set
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedChildren);
    
    // Update target entity tracking
    entities.forEach(e => {
      if (e.id.includes(entityNames.targetCompanyName) || e.description?.includes(entityNames.targetCompanyName)) {
        targetEntityIds.add(e.id);
      }
    });
  }

  // Final validation to ensure no cross-entity relationships
  validateNoCrossEntityRelationships(relationships, acquirerEntityIds, targetEntityIds);

  console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  console.log(`Acquirer Entity IDs: ${Array.from(acquirerEntityIds).join(', ')}`);
  console.log(`Target Entity IDs: ${Array.from(targetEntityIds).join(', ')}`);
  
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));

  return { entities, relationships };
};
