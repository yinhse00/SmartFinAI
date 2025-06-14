
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren, AnyTransactionRelationship } from './corporateStructureProcessor'; // Ensure AnyTransactionRelationship is exported or defined

// Helper function to add parent hierarchy for a given entity
const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[], // Use AnyTransactionRelationship
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  prefix: string,
  visited: Set<string>
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
      visited.add(parentCorpData.id); // Mark general visit to avoid re-processing this node if it appears elsewhere

      let parentEntityType = parentCorpData.type as TransactionEntity['type'];
      if (parentCorpData.type === 'issuer' && prefix === 'before') { // An issuer is often a root, consider it 'parent' type in diagram
          parentEntityType = 'parent';
      } else if (parentCorpData.type === 'issuer') { // For 'after', issuer acting as buyer could be 'buyer'
          parentEntityType = 'buyer'; // Or stick to 'parent' if it's the ultimate parent
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
        type: 'ownership', // Assuming parent link implies ownership/control
      } as AnyTransactionRelationship);

      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink; // Move to the next ancestor
    } else {
      currentCorpParentId = undefined; // Stop if no parent data or already visited this path
    }
  }
};


export const buildBeforeStructure = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';
  const visitedAncestry = new Set<string>(); // To avoid loops/redundancy in ancestor processing
  const visitedChildren = new Set<string>(); // For addCorporateChildren

  // 1. Process Target Company and its structure
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.targetCompanyName && (ce.type === 'target' || ce.type === 'subsidiary' || !results.corporateStructure?.entities?.some(e => e.type === 'target')) // Broader match if no explicit target
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

  if (results.shareholding?.before && results.shareholding.before.length > 0) {
    results.shareholding.before.forEach((holder) => {
      // These are shareholders of the target company
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
      relationships.push({
        source: shareholderId,
        target: targetId,
        type: 'ownership',
        percentage: holder.percentage,
      });
    });
  } else if (!targetCorpEntityData?.parentLink && !results.corporateStructure?.relationships.some(r => r.child === targetCorpEntityData?.id)) {
    // Add generic shareholders only if no specific shareholders and no parent in corporate structure
    const genericShareholderId = generateEntityId('stockholder', `ExistingShareholders of ${entityNames.targetCompanyName}`, prefix);
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
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, visitedChildren);
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, visitedAncestry);
  }


  // 2. Process Acquirer Company and its structure (if different from target)
  if (entityNames.acquiringCompanyName && entityNames.acquiringCompanyName !== entityNames.targetCompanyName) {
    const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(
      ce => ce.name === entityNames.acquiringCompanyName && (ce.type === 'issuer' || ce.type === 'parent' || ce.type === 'target') // 'target' if acquirer is also a target in some complex structure (unlikely for this scenario but for completeness)
    );

    if (acquirerCorpEntityData) {
      let acquirerDiagramType = acquirerCorpEntityData.type as TransactionEntity['type'];
      // If the acquirer is an 'issuer', it's likely a 'parent' type in the diagram sense for its own group
      if (acquirerCorpEntityData.type === 'issuer') acquirerDiagramType = 'parent';
      // If it was marked as 'target' type in corporate structure but is the acquirer, use 'buyer' or 'parent'
      else if (acquirerCorpEntityData.type === 'target') acquirerDiagramType = 'buyer';


      const acquirerRootId = generateEntityId(acquirerDiagramType, acquirerCorpEntityData.name, prefix);
      if (!entities.find(e => e.id === acquirerRootId)) {
        entities.push({
          id: acquirerRootId,
          name: acquirerCorpEntityData.name,
          type: acquirerDiagramType,
          description: `Acquiring Entity Root (${acquirerCorpEntityData.type} type in source)`,
        });
      }
      // Add children (subsidiaries) of the Acquirer
      addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren)); // Use a new set for acquirer's children
      // Add parents (owners) of the Acquirer
      addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry)); // Use a new set for acquirer's ancestors
    } else if (entityNames.acquiringCompanyName !== 'Acquiring Company') { // Acquirer name is specific but not in corp structure
        // Create a standalone acquirer node if it's named but not in the detailed corporate map
        const acquirerDiagramType = results.isAcquirerListed ? 'parent' : 'buyer'; // 'parent' if listed, else 'buyer'
        const acquirerRootId = generateEntityId(acquirerDiagramType, entityNames.acquiringCompanyName, prefix);
        if (!entities.find(e => e.id === acquirerRootId)) {
             entities.push({
                id: acquirerRootId,
                name: entityNames.acquiringCompanyName,
                type: acquirerDiagramType,
                description: 'Acquiring Entity (not detailed in corporate structure map)',
            });
        }
    }
  }
  
  console.log(`Before Structure (Revamped): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));
  return { entities, relationships };
};
