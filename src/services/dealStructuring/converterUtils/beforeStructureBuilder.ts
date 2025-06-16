
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, extractEntityNames, EntityNames } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

// Helper function to add parent hierarchy for a given entity
const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  prefix: string,
  visited: Set<string>,
  entityGroup: 'acquirer' | 'target' // Track which group this entity belongs to
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
      
      // Validate that we're not creating cross-entity relationships
      const childEntity = entities.find(e => e.id === childNodeIdForParentLink);
      if (childEntity && isValidBeforeRelationship(parentEntityId, childNodeIdForParentLink, entities, entityGroup)) {
        relationships.push({
          source: parentEntityId,
          target: childNodeIdForParentLink,
          type: 'ownership',
        } as AnyTransactionRelationship);
      }

      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink;
    } else {
      currentCorpParentId = undefined;
    }
  }
};

// Validation function to prevent cross-entity relationships in "before" state
const isValidBeforeRelationship = (
  sourceId: string, 
  targetId: string, 
  entities: TransactionEntity[],
  entityGroup: 'acquirer' | 'target'
): boolean => {
  const sourceEntity = entities.find(e => e.id === sourceId);
  const targetEntity = entities.find(e => e.id === targetId);
  
  if (!sourceEntity || !targetEntity) return false;
  
  // In "before" state, acquirer and target entities should never be connected
  const acquirerTypes = ['parent', 'buyer', 'stockholder'];
  const targetTypes = ['target'];
  
  const isSourceAcquirerSide = acquirerTypes.includes(sourceEntity.type) || 
    sourceEntity.name.toLowerCase().includes('listed') ||
    sourceEntity.name.toLowerCase().includes('acquiring');
    
  const isTargetTargetSide = targetTypes.includes(targetEntity.type) ||
    targetEntity.name.toLowerCase().includes('target');
  
  // Prevent relationships between acquirer-side and target-side entities
  if (isSourceAcquirerSide && isTargetTargetSide) {
    console.warn(`🚫 Prevented invalid before-transaction relationship: ${sourceId} -> ${targetId}`);
    return false;
  }
  
  if (entityGroup === 'acquirer' && targetTypes.includes(targetEntity.type)) {
    console.warn(`🚫 Prevented acquirer group connecting to target entity: ${sourceId} -> ${targetId}`);
    return false;
  }
  
  if (entityGroup === 'target' && (acquirerTypes.includes(sourceEntity.type) || isSourceAcquirerSide)) {
    console.warn(`🚫 Prevented target group connecting to acquirer entity: ${sourceId} -> ${targetId}`);
    return false;
  }
  
  return true;
};

// Helper to determine if shareholding data applies to target (default) or acquirer
const shouldApplyToAcquirer = (entityNames: EntityNames, holder: any): boolean => {
  // Only apply to acquirer if explicitly indicated or if holder is clearly an acquirer shareholder
  if (!entityNames.isAcquirerListed) return false;
  
  // Check if holder name suggests it's an acquirer shareholder
  const holderName = holder.name.toLowerCase();
  const acquirerName = entityNames.acquiringCompanyName.toLowerCase();
  
  // Only if holder explicitly mentions the acquirer company
  return holderName.includes(acquirerName) || holderName.includes('listed company');
};

export const buildBeforeStructure = (
  results: AnalysisResults,
  entityNames: EntityNames,
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';
  
  // Separate visited sets for acquirer and target to prevent cross-contamination
  const acquirerVisitedAncestry = new Set<string>();
  const acquirerVisitedChildren = new Set<string>();
  const targetVisitedAncestry = new Set<string>();
  const targetVisitedChildren = new Set<string>();

  console.log("Building Before Structure with entityNames:", entityNames);

  // 1. Process Acquirer Company (Listed Company) independently
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.acquiringCompanyName && (ce.type === 'issuer' || ce.type === 'parent')
  );

  let acquirerRootId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'parent';

  if (acquirerCorpEntityData) {
    acquirerDiagramType = (entityNames.isAcquirerListed || acquirerCorpEntityData.type === 'issuer') ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, acquirerCorpEntityData.name, prefix);

    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: acquirerCorpEntityData.name,
        type: acquirerDiagramType,
        description: `Acquiring Company Root (${acquirerCorpEntityData.type} in CS)`,
      });
    }
    
    // Process acquirer hierarchy with isolated visited sets
    addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedAncestry, 'acquirer');
    addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedChildren);

    // Process acquirer-specific shareholding data
    if (entityNames.isAcquirerListed && results.shareholding?.before) {
      const acquirerShareholders = results.shareholding.before.filter(holder => shouldApplyToAcquirer(entityNames, holder));
      
      acquirerShareholders.forEach(holder => {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: `${holder.percentage}% Shareholder of ${entityNames.acquiringCompanyName}`,
          });
        }
        
        if (isValidBeforeRelationship(shareholderId, acquirerRootId, entities, 'acquirer')) {
          relationships.push({
            source: shareholderId,
            target: acquirerRootId,
            type: 'ownership',
            percentage: holder.percentage,
          });
        }
      });
      
      // Add generic public shareholders if no specific ones and it's listed
      if (acquirerShareholders.length === 0) {
        const genericAcquirerShareholderId = generateEntityId('stockholder', `Public Shareholders of ${entityNames.acquiringCompanyName}`, prefix);
        if (!entities.find(e => e.id === genericAcquirerShareholderId)) {
          entities.push({
            id: genericAcquirerShareholderId,
            name: `Public Shareholders of ${entityNames.acquiringCompanyName}`,
            type: 'stockholder',
            percentage: 100,
            description: `Public shareholders of ${entityNames.acquiringCompanyName}`
          });
        }
        relationships.push({
          source: genericAcquirerShareholderId,
          target: acquirerRootId,
          type: 'ownership',
          percentage: 100
        });
      }
    }
  } else if (entityNames.acquiringCompanyName && entityNames.acquiringCompanyName !== 'Acquiring Company') {
    // Acquirer is named but not in corporate structure map
    acquirerDiagramType = entityNames.isAcquirerListed ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, entityNames.acquiringCompanyName, prefix);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: entityNames.acquiringCompanyName,
        type: acquirerDiagramType,
        description: 'Acquiring Company (not in CS map)',
      });
    }
    
    // Add acquirer shareholders if listed
    if (entityNames.isAcquirerListed && results.shareholding?.before) {
      const acquirerShareholders = results.shareholding.before.filter(holder => shouldApplyToAcquirer(entityNames, holder));
      
      if (acquirerShareholders.length > 0) {
        acquirerShareholders.forEach(holder => {
          const shareholderId = generateEntityId('stockholder', holder.name, prefix);
          if (!entities.find(e => e.id === shareholderId)) {
            entities.push({
              id: shareholderId,
              name: holder.name,
              type: 'stockholder',
              percentage: holder.percentage,
              description: `${holder.percentage}% Shareholder of ${entityNames.acquiringCompanyName}`
            });
          }
          relationships.push({
            source: shareholderId,
            target: acquirerRootId,
            type: 'ownership',
            percentage: holder.percentage
          });
        });
      } else {
        // Generic public shareholders if listed and no specific ones
        const genericAcquirerShareholderId = generateEntityId('stockholder', `Public Shareholders of ${entityNames.acquiringCompanyName}`, prefix);
        if (!entities.find(e => e.id === genericAcquirerShareholderId)) {
          entities.push({
            id: genericAcquirerShareholderId,
            name: `Public Shareholders of ${entityNames.acquiringCompanyName}`,
            type: 'stockholder',
            percentage: 100,
            description: `Public shareholders of ${entityNames.acquiringCompanyName}`
          });
        }
        relationships.push({
          source: genericAcquirerShareholderId,
          target: acquirerRootId,
          type: 'ownership',
          percentage: 100
        });
      }
    }
  } else {
    // Fallback acquirer
    acquirerRootId = generateEntityId('buyer', 'Acquiring Company', prefix);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: 'Acquiring Company',
        type: 'buyer',
        description: 'Default Acquiring Company',
      });
    }
  }

  // 2. Process Target Company independently (completely separate from acquirer)
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.targetCompanyName && ce.type === 'target'
  );

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  if (!entities.find(e => e.id === targetId)) {
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Pre-Transaction)',
    });
  }

  // Process target-specific shareholding data (default for results.shareholding.before)
  if (results.shareholding?.before) {
    const targetShareholders = results.shareholding.before.filter(holder => !shouldApplyToAcquirer(entityNames, holder));
    
    targetShareholders.forEach((holder) => {
      // Ensure this holder isn't the acquirer itself
      if (holder.name !== entityNames.acquiringCompanyName) {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: `${holder.percentage}% Shareholder of ${entityNames.targetCompanyName}`,
          });
        }
        
        if (isValidBeforeRelationship(shareholderId, targetId, entities, 'target')) {
          relationships.push({
            source: shareholderId,
            target: targetId,
            type: 'ownership',
            percentage: holder.percentage,
          });
        }
      }
    });
  }

  if (targetCorpEntityData) {
    // Add target hierarchy with isolated visited sets
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedAncestry, 'target');
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedChildren);
  }

  // Add generic target shareholders if none were added
  const targetHasParents = relationships.some(r => r.target === targetId);
  if (!targetHasParents && (!results.shareholding?.before || results.shareholding.before.length === 0)) {
    const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.targetCompanyName}`, prefix);
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

  console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));

  return { entities, relationships };
};
