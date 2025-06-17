
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { extractEntityNames, EntityNames } from './entityHelpers';
import { attributeShareholdingData } from './shareholdingValidationUtils';
import { validateNoCrossEntityRelationships, shouldCreateCorporateRelationship } from './beforeStructureValidators';
import { createAcquirerEntity, createTargetEntity } from './beforeStructureEntityProcessor';
import { processAcquirerShareholders, processTargetShareholders } from './beforeStructureShareholderProcessor';

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

  // Create a filtered corporate structure map that excludes invalid cross-entity relationships
  const filteredCorporateStructureMap = new Map(corporateStructureMap);
  
  // Remove invalid parent-child relationships from the corporate structure
  for (const [entityId, entity] of corporateStructureMap.entries()) {
    if (entity.parentLink) {
      const parentEntity = corporateStructureMap.get(entity.parentLink);
      if (parentEntity && !shouldCreateCorporateRelationship(parentEntity, entity, entityNames)) {
        // Remove the invalid parent link
        const filteredEntity = { ...entity };
        delete filteredEntity.parentLink;
        filteredCorporateStructureMap.set(entityId, filteredEntity);
        
        // Also remove this child from the parent's children array
        if (parentEntity.children) {
          const filteredParent = { 
            ...parentEntity, 
            children: parentEntity.children.filter(childId => childId !== entityId)
          };
          filteredCorporateStructureMap.set(entity.parentLink, filteredParent);
        }
      }
    }
  }

  // Attribute shareholding data to acquirer vs target
  const { acquirerShareholders, targetShareholders } = attributeShareholdingData(
    results.shareholding?.before || [], 
    entityNames
  );

  console.log(`📊 Attributed shareholding data - Acquirer: ${acquirerShareholders.length}, Target: ${targetShareholders.length}`);

  // 1. Process Acquirer Company (Listed Company) and its shareholders first
  const acquirerRootId = createAcquirerEntity(
    entityNames,
    filteredCorporateStructureMap,
    prefix,
    entities,
    relationships,
    acquirerVisitedAncestry,
    acquirerVisitedChildren,
    acquirerEntityIds
  );

  // Process Acquirer's shareholders
  processAcquirerShareholders(
    results,
    entityNames,
    acquirerRootId,
    prefix,
    entities,
    relationships,
    acquirerEntityIds,
    acquirerShareholders
  );

  // 2. Process Target Company and its structure (completely separate from acquirer)
  const targetId = createTargetEntity(
    entityNames,
    filteredCorporateStructureMap,
    prefix,
    entities,
    relationships,
    targetVisitedAncestry,
    targetVisitedChildren,
    targetEntityIds
  );

  // Process Target's shareholders with validation
  processTargetShareholders(
    results,
    entityNames,
    targetId,
    prefix,
    entities,
    relationships,
    targetEntityIds,
    targetShareholders
  );

  // Final validation to ensure no cross-entity relationships
  validateNoCrossEntityRelationships(relationships, acquirerEntityIds, targetEntityIds);

  console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  console.log(`Acquirer Entity IDs: ${Array.from(acquirerEntityIds).join(', ')}`);
  console.log(`Target Entity IDs: ${Array.from(targetEntityIds).join(', ')}`);
  
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));

  return { entities, relationships };
};
