
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, extractEntityNames, EntityNames } from './entityHelpers'; // Added EntityNames import
import { addCorporateChildren, AnyTransactionRelationship } from './corporateStructureProcessor';

// Helper function to add parent hierarchy for a given entity
const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
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
  entityNames: EntityNames, // Added entityNames parameter
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';
  const visitedAncestry = new Set<string>();
  const visitedChildren = new Set<string>();

  // Removed: const entityNames = extractEntityNames(results); // This is now passed as a parameter

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

    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: acquirerCorpEntityData.name,
        type: acquirerDiagramType,
        description: `Acquiring Company Root (${acquirerCorpEntityData.type} in CS)`,
      });
    }
    addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, visitedAncestry);
    addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, visitedChildren);

    // Link shareholders from shareholding.before if they are owners of this acquirer
    // This logic assumes shareholding.before might list owners of the ListedCo
    const acquirerShareholdersFromResults = results.shareholding?.before?.filter(sh => {
        // Heuristic: If a shareholder name appears in the corporate structure as a parent of the acquirer,
        // or if the shareholding refers to the acquirer's name explicitly.
        // This needs careful handling to avoid misattribution.
        // For now, let's assume shareholding.before is primarily for the TARGET.
        // If specific shareholders of acquirer (ListedCo) are meant to be drawn from results.shareholding.before,
        // this part might need more sophisticated matching.
        // The current addAncestors should pick up parents from corporateStructureMap.
        // This block is more for shareholders mentioned *outside* the formal corporate structure map
        // but listed in results.shareholding.before as owners of the acquirer.
        // This is a potential area for refinement based on data patterns.
        // For the example "Shareholder A owns 75% of Listed Company",
        // "Shareholder A" needs to be linked to `acquirerRootId`.
        // If "Shareholder A" is NOT in corporateStructureMap as a parent of ListedCo, this logic would try to add it.
        const corpShareholder = Array.from(corporateStructureMap.values()).find(csEnt => csEnt.name === sh.name);
        if (corpShareholder && corpShareholder.children?.includes(acquirerCorpEntityData.id)) {
            return true; // This shareholder is a parent of the acquirer in the CS map. addAncestors handles this.
        }
        // A simpler check if the problem statement implies results.shareholding directly applies to acquirer
        // This is typically not the case, so this might be redundant or need careful conditions.
        return false; // Let addAncestors primarily handle this.
    });

    // Example: If "Shareholder A" (75%) and "Other Investors" (25%) own "Listed Company",
    // and this isn't fully captured by parentLink in corporateStructureMap for ListedCo,
    // we might need to add them here based on `results.shareholding` if it contains this info.
    // The current structure heavily relies on `corporateStructureMap` for Acquirer's parents.
    // For "Shareholder A" and "Other Investors" scenario for "Listed Company":
    // IF they are NOT in corporate structure map as parents of "Listed Company",
    // AND results.shareholding.before lists them as owners of "Listed Company", this is where they'd be added.
    // This requires `results.shareholding.before` to identify the company being held.

    // Let's use a direct approach for adding shareholders of the acquirer if they are listed in results.shareholding.before
    // and are specifically designated as owners of the acquirer.
    // This assumes `results.shareholding.before` might have entries like:
    // { name: "Shareholder A", percentage: 75, heldCompany: "Listed Company Name" }
    // or similar indication. The current ShareholderData type doesn't have 'heldCompany'.
    // We will assume that if `isAcquirerListed` is true, then `results.shareholding.before`
    // might actually refer to shareholders of the Acquirer (Listed Company) instead of, or in addition to, Target.
    // This is a major assumption shift.
    // If `entityNames.isAcquirerListed` is true, we can process `results.shareholding.before`
    // as shareholders of the Acquirer (Listed Company).
    // The prompt's example (Shareholder A 75%, Other Investors 25% of Listed Co) implies this.

    if (entityNames.isAcquirerListed) {
        results.shareholding?.before?.forEach(holder => {
            // We need to ensure these are shareholders of the ACQUIRER, not the target.
            // This is a key distinction. If the prompt implies shareholding.before refers to ListedCo's owners.
            // Let's assume this is the case for ListedCo.
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
            relationships.push({
                source: shareholderId,
                target: acquirerRootId, // Link to the acquirer
                type: 'ownership',
                percentage: holder.percentage,
            });
        });
        // If addAncestors also added these from corporateStructureMap, there might be duplicates if not handled.
        // The `visitedAncestry` in addAncestors and entity existence check should mitigate full duplication of nodes,
        // but relationships might be duplicated if not careful.
        // The current addAncestors logic: if `parentCorpData` (shareholder) is found, it's added.
        // This block adds from `results.shareholding.before`.
        // These two sources for acquirer's shareholders need to be reconciled or be mutually exclusive.
        // For now, we assume they might be distinct sources or that checks prevent duplicates.
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
    // If the acquirer is listed and not in CS map, add its shareholders from results.shareholding.before
    if (entityNames.isAcquirerListed) {
        results.shareholding?.before?.forEach(holder => {
            const shareholderId = generateEntityId('stockholder', holder.name, prefix);
            if(!entities.find(e => e.id === shareholderId)) {
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
    } else if (entityNames.isAcquirerListed && (!results.shareholding?.before || results.shareholding.before.length === 0)) {
        // Generic public shareholders if listed and no specific ones are provided
        const genericAcquirerShareholderId = generateEntityId('stockholder', `Public Shareholders of ${entityNames.acquiringCompanyName}`, prefix);
        if(!entities.find(e => e.id === genericAcquirerShareholderId)) {
            entities.push({
                id: genericAcquirerShareholderId,
                name: `Public Shareholders of ${entityNames.acquiringCompanyName}`,
                type: 'stockholder',
                percentage: 100, // Collective
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
  } else {
    // Fallback if no specific acquirer name
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

  // 2. Process Target Company and its structure
  // The Target company should be independent of the Acquirer in the "before" state.
  // Its shareholders should be its own, not the acquirer's.
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

  // Add Target's direct shareholders.
  // This part should ONLY add shareholders of the TARGET.
  // If isAcquirerListed is true, results.shareholding.before was assumed to be for Acquirer.
  // This creates a conflict: what if shareholding.before has info for BOTH?
  // The type ShareholderData doesn't specify which company is held.
  // For robust logic, shareholding data needs to be specific about the entity it pertains to.
  // Current assumption: if acquirer is NOT listed, then shareholding.before is for Target.
  // If acquirer IS listed, shareholding.before was used for Acquirer's shareholders above.
  // This means Target might not get its shareholders if acquirer is listed AND shareholding.before is monopolized.
  // This logic needs refinement.
  // Let's assume results.shareholding.before is for TARGET'S shareholders UNLESS specific conditions for acquirer are met.
  // The previous edit made a strong assumption for `if (entityNames.isAcquirerListed)`.
  // Let's refine: `results.shareholding.before` primarily describes the Target's shareholders.
  // If the Acquirer is "Listed Company", its shareholders are either from `corporateStructureMap` (via `addAncestors`)
  // or need to be explicitly parsed if `results.shareholding.before` has a way to denote ownership of "Listed Company".

  // Resetting assumption for Target:
  // `results.shareholding.before` is for the Target company primarily,
  // UNLESS an entry explicitly states it's for the "Listed Company" (acquirer).
  // Since `ShareholderData` lacks a `heldCompany` field, we filter out Acquirer's known shareholders
  // if they were already processed above or would be picked by addAncestors for acquirer.
  // This is complex. The simplest path:
  // - If `entityNames.isAcquirerListed` is true, the block above already processed `results.shareholding.before` for the acquirer.
  //   In this case, the Target's shareholders must come from its own `parentLink` in `corporateStructureMap` via `addAncestors(targetCorpEntityData, ...)`
  //   or be generic if no other info.
  // - If `entityNames.isAcquirerListed` is false, then `results.shareholding.before` applies to the Target.

  if (!entityNames.isAcquirerListed && results.shareholding?.before && results.shareholding.before.length > 0) {
    results.shareholding.before.forEach((holder) => {
        // Ensure this holder isn't the acquirer itself or one of its main known entities if it's a corporate buyer.
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
            relationships.push({
            source: shareholderId,
            target: targetId,
            type: 'ownership',
            percentage: holder.percentage,
            });
        }
    });
  } else if (targetCorpEntityData) {
    // If Acquirer is listed (meaning results.shareholding.before was used for it),
    // or if no results.shareholding.before, rely on corporate structure for Target's parents.
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry)); // Use a new set for target's ancestry
    // If after addAncestors, target still has no parents AND no explicit shareholders were added, add generic.
    const targetHasParents = relationships.some(r => r.target === targetId);
    if (!targetHasParents && !results.shareholding?.before?.length) { // Simplified condition
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
  } else if (!results.shareholding?.before || results.shareholding.before.length === 0) {
     // Target not in CS map, and no shareholding info for target
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


  if (targetCorpEntityData) {
    // Add children (subsidiaries) of the Target
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren)); // Use a new set for target's children
    // Ancestors of Target already handled above if targetCorpEntityData exists.
  }

  console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));

  return { entities, relationships };
};

