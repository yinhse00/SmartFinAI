
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, AnyTransactionRelationship } from '@/types/transactionFlow';
import { EntityNames, generateEntityId } from './entityHelpers';
import { 
  shouldUseShareholdingData, 
  getValidatedShareholdingData,
  isGenericShareholderName
} from './shareholdingValidationUtils';

export const processAcquirerShareholders = (
  results: AnalysisResults,
  entityNames: EntityNames,
  acquirerRootId: string,
  prefix: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  acquirerEntityIds: Set<string>,
  acquirerShareholders: Array<{ name: string; percentage: number }>
): void => {
  console.log(`🔍 Processing Acquirer shareholders for ${entityNames.acquiringCompanyName}`);
  
  if (acquirerShareholders.length > 0) {
    console.log(`📋 Acquirer shareholding data:`, acquirerShareholders.map(h => ({ name: h.name, percentage: h.percentage })));
    
    // Validate and filter acquirer shareholding data
    if (shouldUseShareholdingData(acquirerShareholders, entityNames.acquiringCompanyName)) {
      const validAcquirerShareholders = getValidatedShareholdingData(acquirerShareholders, entityNames.acquiringCompanyName);
      
      validAcquirerShareholders.forEach((holder) => {
        // Ensure this holder isn't the target itself
        if (holder.name !== entityNames.targetCompanyName) {
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
          
          console.log(`✅ Created valid acquirer shareholder relationship: ${holder.name} -> ${entityNames.acquiringCompanyName} (${holder.percentage}%)`);
        }
      });
    }
  }

  // If Listed Company has no shareholders, add generic ones for listed companies
  if (entityNames.isAcquirerListed) {
    const acquirerHasValidShareholders = relationships.some(r => 
      r.target === acquirerRootId && 
      r.type === 'ownership' && 
      entities.find(e => e.id === r.source && !isGenericShareholderName(e.name))
    );
    
    if (!acquirerHasValidShareholders) {
      console.log(`📝 Adding generic shareholders for Listed Company ${entityNames.acquiringCompanyName}`);
      const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.acquiringCompanyName}`, prefix);
      acquirerEntityIds.add(genericShareholderId);
      
      if (!entities.find(e => e.id === genericShareholderId)) {
        entities.push({
          id: genericShareholderId,
          name: `Existing Shareholders of ${entityNames.acquiringCompanyName}`,
          type: 'stockholder',
          percentage: 100,
          description: '100% collective ownership',
        });
      }
      relationships.push({
        source: genericShareholderId,
        target: acquirerRootId,
        type: 'ownership',
        percentage: 100,
      });
    }
  }
};

export const processTargetShareholders = (
  results: AnalysisResults,
  entityNames: EntityNames,
  targetId: string,
  prefix: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  targetEntityIds: Set<string>,
  targetShareholders: Array<{ name: string; percentage: number }>
): void => {
  console.log(`🔍 Processing Target Company shareholders for ${entityNames.targetCompanyName}`);
  
  if (targetShareholders.length > 0) {
    console.log(`📋 Target shareholding data:`, targetShareholders.map(h => ({ name: h.name, percentage: h.percentage })));
    
    // Validate and filter target shareholding data
    if (shouldUseShareholdingData(targetShareholders, entityNames.targetCompanyName)) {
      const validTargetShareholders = getValidatedShareholdingData(targetShareholders, entityNames.targetCompanyName);
      
      validTargetShareholders.forEach((holder) => {
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
          
          console.log(`✅ Created valid target shareholder relationship: ${holder.name} -> ${entityNames.targetCompanyName} (${holder.percentage}%)`);
        }
      });
    }
  }
  
  // Check if we need to add generic shareholders for target
  const targetHasValidShareholders = relationships.some(r => 
    r.target === targetId && 
    r.type === 'ownership' && 
    entities.find(e => e.id === r.source && !isGenericShareholderName(e.name))
  );
  
  if (!targetHasValidShareholders) {
    // If still no parents/shareholders found, add generic shareholders
    const targetStillHasNoParents = !relationships.some(r => r.target === targetId);
    if (targetStillHasNoParents) {
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
  }
};
