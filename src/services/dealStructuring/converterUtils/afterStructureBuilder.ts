
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

  console.log('=== AFTER STRUCTURE BUILDER DEBUG START ===');
  console.log('Input entityNames:', entityNames);
  console.log('Input considerationAmount:', considerationAmount);
  console.log('Input results.shareholdingChanges:', results.shareholdingChanges);
  console.log('Input results.structure?.majorTerms?.targetPercentage:', results.structure?.majorTerms?.targetPercentage);
  console.log('Input results.dealEconomics?.targetPercentage:', results.dealEconomics?.targetPercentage);

  // 1. Process the acquirer and its new shareholders (Level 1 Ownership)
  const { acquirerId, acquirerCorpEntityData } = createAcquirerEntity(
    entityNames.acquiringCompanyName,
    corporateStructureMap,
    prefix,
    entities
  );

  console.log('Created acquirer entity:', { acquirerId, acquirerCorpEntityData });

  addAcquirerShareholders(
    results,
    acquirerId,
    entityNames.acquiringCompanyName,
    prefix,
    entities,
    relationships
  );

  console.log('After addAcquirerShareholders:');
  console.log('- Entities count:', entities.length);
  console.log('- Relationships count:', relationships.length);

  // 2. Add corporate hierarchy (children only) for the acquirer
  if (acquirerCorpEntityData) {
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    // The `addAncestors` call for the acquirer has been removed to prevent double-counting its owners.
    // `addAcquirerShareholders` is now the single source of truth for the acquirer's direct ownership post-transaction.
  }

  console.log('After addCorporateChildren:');
  console.log('- Entities count:', entities.length);
  console.log('- Relationships count:', relationships.length);

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

  console.log('After addTargetWithOwnership:');
  console.log('- Entities count:', entities.length);
  console.log('- Relationships count:', relationships.length);

  // 4. Add consideration/payment details
  addConsiderationDetails(
    results,
    considerationAmount,
    acquirerId,
    prefix,
    entities,
    relationships
  );

  console.log('After addConsiderationDetails:');
  console.log('- Entities count:', entities.length);
  console.log('- Relationships count:', relationships.length);

  // 5. Detailed Logging
  console.log(`After Structure (refactored): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  
  entities.forEach((e, idx) => {
    console.log(`After Entity ${idx}: ${e.id} (${e.type}) Name: ${e.name}`);
    if (e.percentage) console.log(`  Percentage: ${e.percentage}%`);
    console.log(`  Description: ${e.description}`);
  });
  
  relationships.forEach((r, idx) => {
    let labelContent = r.label || '';
    if (r.type === 'ownership' && (r as OwnershipRelationship).percentage !== undefined) {
        labelContent += ` ${(r as OwnershipRelationship).percentage}%`;
    } else if ((r.type === 'consideration' || r.type === 'funding') && (r as ConsiderationRelationship).value !== undefined) {
        labelContent += ` ${(r as ConsiderationRelationship).value}`;
    }
    console.log(`After Relationship ${idx}: ${r.source} -> ${r.target} (${r.type}) Label: ${labelContent}`);
  });

  // 6. Validation checks
  const continuingShareholders = entities.filter(e => 
    e.type === 'stockholder' && e.name.toLowerCase().includes('continuing')
  );
  console.log('Continuing shareholders found:', continuingShareholders.length);
  continuingShareholders.forEach(cs => {
    console.log(`  ${cs.name} (${cs.percentage}%) - ID: ${cs.id}`);
    const relatedRelationships = relationships.filter(r => r.source === cs.id);
    console.log(`    Related relationships: ${relatedRelationships.length}`);
    relatedRelationships.forEach(rel => {
      console.log(`      -> ${rel.target} (${rel.type}) ${(rel as OwnershipRelationship).percentage}%`);
    });
  });

  // Check target ownership totals
  const targetEntity = entities.find(e => e.type === 'target');
  if (targetEntity) {
    const targetOwnershipRels = relationships.filter(r => r.target === targetEntity.id && r.type === 'ownership');
    const totalTargetOwnership = targetOwnershipRels.reduce((sum, rel) => {
      return sum + ((rel as OwnershipRelationship).percentage || 0);
    }, 0);
    console.log(`Target company total ownership: ${totalTargetOwnership}% (should be 100%)`);
    if (Math.abs(totalTargetOwnership - 100) > 0.1) {
      console.warn(`WARNING: Target ownership does not add up to 100%!`);
    }
  }

  console.log('=== AFTER STRUCTURE BUILDER DEBUG END ===');
  
  return { entities, relationships };
};
