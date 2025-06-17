
import { AnyTransactionRelationship } from '@/types/transactionFlow';
import { EntityNames } from './entityHelpers';
import { CorporateEntity } from '@/types/dealStructuring';

// Validation function to prevent cross-entity relationships
export const validateNoCrossEntityRelationships = (
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

// Helper function to check if two entities should be connected based on corporate structure
export const shouldCreateCorporateRelationship = (
  parentEntity: CorporateEntity,
  childEntity: CorporateEntity,
  entityNames: EntityNames
): boolean => {
  // Never create relationships between acquirer and target in BEFORE structure
  const parentIsAcquirer = parentEntity.name === entityNames.acquiringCompanyName || 
                          parentEntity.type === 'issuer';
  const childIsTarget = childEntity.name === entityNames.targetCompanyName || 
                       childEntity.type === 'target';
  
  const parentIsTarget = parentEntity.name === entityNames.targetCompanyName || 
                        parentEntity.type === 'target';
  const childIsAcquirer = childEntity.name === entityNames.acquiringCompanyName || 
                         childEntity.type === 'issuer';

  if ((parentIsAcquirer && childIsTarget) || (parentIsTarget && childIsAcquirer)) {
    console.log(`🚫 Preventing cross-entity relationship: ${parentEntity.name} (${parentEntity.type}) -> ${childEntity.name} (${childEntity.type})`);
    return false;
  }

  return true;
};
