
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, ConsiderationRelationship, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { addCorporateChildren } from './corporateStructureProcessor';
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
    relationships
  );

  // 2. Add corporate hierarchy (children only) for the acquirer
  if (acquirerCorpEntityData) {
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    // The `addAncestors` call for the acquirer has been removed to prevent double-counting its owners.
    // `addAcquirerShareholders` is now the single source of truth for the acquirer's direct ownership post-transaction.
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
    visitedChildren
  );

  // 4. Add consideration/payment details
  addConsiderationDetails(
    results,
    considerationAmount,
    acquirerId,
    prefix,
    entities,
    relationships
  );

  // 5. Logging
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
