
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlowSection, TransactionEntity, AnyTransactionRelationship } from '@/types/transactionFlow';
import { EntityNames } from './entityHelpers';
import { addConsiderationDetails } from './considerationProcessor';
import { processAcquirerEntities } from './acquirerEntityProcessor';
import { processTargetOwnership } from './targetOwnershipProcessor';
import { ExtractedUserInputs } from '../enhancedAiAnalysisService';

export const buildAfterStructure = (
  results: AnalysisResults,
  entityNames: EntityNames,
  corporateStructureMap: Map<string, any>,
  considerationAmount: number,
  userInputs?: ExtractedUserInputs
): TransactionFlowSection => {
  console.log('=== Building After Structure with User Inputs ===');
  console.log('Consideration amount:', considerationAmount);
  console.log('User inputs:', userInputs);

  const entities: TransactionEntity[] = [];
  const relationships: AnyTransactionRelationship[] = [];

  // Process acquirer entities and get the acquirer ID
  const acquirerId = processAcquirerEntities(results, entityNames, entities, relationships, 'after');

  // Process target ownership structure
  const formerShareholdersId = processTargetOwnership(
    results,
    entityNames,
    entities,
    relationships,
    'after',
    corporateStructureMap
  );

  // CRITICAL: Add consideration details with user inputs for authority
  addConsiderationDetails(
    results,
    considerationAmount,
    acquirerId,
    'after',
    entities,
    relationships,
    formerShareholdersId,
    userInputs // Pass userInputs for authoritative data
  );

  console.log('After structure built with', entities.length, 'entities');
  console.log('Entities with values:', entities.filter(e => e.value).map(e => ({ id: e.id, name: e.name, value: e.value })));

  return {
    entities,
    relationships
  };
};
