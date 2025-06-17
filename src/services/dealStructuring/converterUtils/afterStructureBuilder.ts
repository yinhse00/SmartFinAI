import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, ConsiderationRelationship, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { addCorporateChildren } from './corporateStructureProcessor';
import { generateEntityId } from './entityHelpers';
import { NORMALIZED_TARGET_SHAREHOLDER_NAME } from './shareholderIdentificationUtils';
import {
  createAcquirerEntity,
  addAcquirerShareholders,
  addTargetWithOwnership,
  addConsiderationDetails
} from './afterStructureHelpers';

export const buildAfterStructure = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  considerationAmount: number
): TransactionFlow['after'] => {
  const entities: TransactionEntity[] = [];
  const relationships: AnyTransactionRelationship[] = [];
  const prefix = 'after';
  const visitedChildren = new Set<string>();
  const processedEntities = new Set<string>(); // Shared tracking for processed entities

  // 1. Process the acquirer and its new shareholders (Level 1 Ownership)
  const { acquirerId, acquirerCorpEntityData } = createAcquirerEntity(
    entityNames.acquiringCompanyName,
    corporateStructureMap,
    prefix,
    entities
  );

  addAcquirerShareholders(
    results,
    acquirerId,
    entityNames.acquiringCompanyName,
    prefix,
    entities,
    relationships,
    processedEntities
  );

  // 2. Add corporate hierarchy (children only) for the acquirer
  if (acquirerCorpEntityData) {
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
  }

  // 3. Process the target company and its new ownership structure (Level 2 Ownership)
  addTargetWithOwnership(
    results,
    entityNames.targetCompanyName,
    corporateStructureMap,
    acquirerId,
    prefix,
    entities,
    relationships,
    visitedChildren,
    processedEntities
  );

  // 4. Find the Former Target Shareholders entity ID for consideration flow
  const formerShareholdersId = generateEntityId('stockholder', NORMALIZED_TARGET_SHAREHOLDER_NAME, prefix);

  // 5. Add consideration/payment details with proper flow to former shareholders
  addConsiderationDetails(
    results,
    considerationAmount,
    acquirerId,
    prefix,
    entities,
    relationships,
    formerShareholdersId
  );

  // 6. Validate ownership percentages
  validateOwnershipPercentages(entities, relationships);

  // 7. Logging
  console.log(`After Structure (refactored): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`After Entity: ${e.id} (${e.type}) Name: ${e.name} Desc: ${e.description}`));
  relationships.forEach(r => {
    let labelContent = r.label || '';
    if (r.type === 'ownership' && (r as OwnershipRelationship).percentage !== undefined) {
        labelContent += ` ${(r as OwnershipRelationship).percentage}%`;
    } else if ((r.type === 'consideration' || r.type === 'funding') && (r as ConsiderationRelationship).value !== undefined) {
        labelContent += ` ${(r as ConsiderationRelationship).value}`;
    }
    console.log(`After Relationship: ${r.source} -> ${r.target} (${r.type}) Label: ${labelContent}`);
  });
  
  return { entities, relationships };
};

const validateOwnershipPercentages = (
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[]
): void => {
  const ownershipRelationships = relationships.filter(r => r.type === 'ownership') as OwnershipRelationship[];
  
  // Group relationships by target (the entity being owned)
  const ownershipByTarget = new Map<string, OwnershipRelationship[]>();
  
  ownershipRelationships.forEach(rel => {
    if (!ownershipByTarget.has(rel.target)) {
      ownershipByTarget.set(rel.target, []);
    }
    ownershipByTarget.get(rel.target)!.push(rel);
  });
  
  // Check each target entity's total ownership
  ownershipByTarget.forEach((ownerships, targetId) => {
    const totalOwnership = ownerships.reduce((sum, rel) => sum + (rel.percentage || 0), 0);
    const targetEntity = entities.find(e => e.id === targetId);
    
    if (totalOwnership > 100) {
      console.warn(`⚠️  Ownership validation failed for ${targetEntity?.name || targetId}: Total ownership is ${totalOwnership}% (exceeds 100%)`);
      console.warn(`   Ownership breakdown:`, ownerships.map(rel => {
        const sourceEntity = entities.find(e => e.id === rel.source);
        return `${sourceEntity?.name || rel.source}: ${rel.percentage}%`;
      }));
    } else if (totalOwnership < 95 && totalOwnership > 0) {
      console.warn(`⚠️  Ownership validation warning for ${targetEntity?.name || targetId}: Total ownership is ${totalOwnership}% (less than 100%)`);
    }
  });
};
