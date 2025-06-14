
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';
import { 
    NORMALIZED_TARGET_SHAREHOLDER_NAME, 
    isContinuingOrRemainingShareholder 
} from './shareholderIdentificationUtils';

type CorporateStructureMap = Map<string, CorporateEntity & { children?: string[]; parentLink?: string }>;
type Entities = TransactionEntity[];
type Relationships = AnyTransactionRelationship[];

export const addTargetWithOwnership = (
    results: AnalysisResults,
    targetCompanyName: string,
    corporateStructureMap: CorporateStructureMap,
    acquirerId: string,
    prefix: string,
    entities: Entities,
    relationships: Relationships,
    visitedChildren: Set<string>,
    processedEntities: Set<string>
): void => {
    const targetId = generateEntityId('target', targetCompanyName, prefix);
    if (!entities.find(e => e.id === targetId)) {
        entities.push({
            id: targetId,
            name: targetCompanyName,
            type: 'target',
            description: 'Target Company (Post-Transaction, Acquired)',
        });
    }
    const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === targetCompanyName);
    if (targetCorpEntityData) {
        addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, visitedChildren);
    }

    const acquiredPercentage = results.structure?.majorTerms?.targetPercentage ?? results.dealEconomics?.targetPercentage ?? 100;
    
    // Add acquirer's ownership in target
    relationships.push({
        source: acquirerId,
        target: targetId,
        type: 'ownership',
        percentage: acquiredPercentage,
    } as OwnershipRelationship);

    console.log(`✅ Added ${acquiredPercentage}% ownership: Acquirer -> ${targetCompanyName}`);

    // Handle remaining ownership if it's a partial acquisition
    if (acquiredPercentage < 100) {
        const remainingPercentage = 100 - acquiredPercentage;
        const allAfterShareholders = results.shareholdingChanges?.after || [];
        const continuingShareholders = allAfterShareholders.filter(holder => isContinuingOrRemainingShareholder(holder.name));

        console.log(`🔍 Processing target remaining ownership (${remainingPercentage}%):`, {
            continuingShareholdersFound: continuingShareholders.length,
            allAfterShareholders: allAfterShareholders.length
        });

        // CRITICAL: Use the exact same entity ID generation as in addAcquirerShareholders
        const shareholderName = NORMALIZED_TARGET_SHAREHOLDER_NAME;
        const shareholderId = generateEntityId('stockholder', shareholderName, prefix);
        
        console.log(`🔧 Processing remaining ownership for ${shareholderName}:`, {
            shareholderId,
            shareholderName,
            targetId,
            targetCompanyName,
            remainingPercentage
        });
        
        // Create a unique tracking key for this specific context (target shareholding)
        const trackingKey = `${shareholderName}_in_${targetCompanyName}`;

        // Check if this entity has already been processed in this context
        if (processedEntities.has(trackingKey)) {
            console.log(`⚠️  Entity "${shareholderName}" already processed in ${targetCompanyName}, skipping`);
            return;
        }

        if (continuingShareholders.length > 0) {
            // Use the percentage from the analysis if available
            const continungShareholderData = continuingShareholders[0];
            const actualRemainingPercentage = continungShareholderData.percentage || remainingPercentage;
            
            const existingEntity = entities.find(e => e.id === shareholderId);

            if (!existingEntity) {
                entities.push({
                    id: shareholderId,
                    name: shareholderName,
                    type: 'stockholder',
                    percentage: actualRemainingPercentage,
                    description: `Former Target Shareholders who retain a ${actualRemainingPercentage}% stake in ${targetCompanyName}.`,
                });
                console.log(`✅ Created new entity for remaining ownership: ${shareholderId} (${shareholderName})`);
            } else if (existingEntity.description) {
                if (!existingEntity.description.includes(`stake in ${targetCompanyName}`)) {
                    existingEntity.description += ` They also retain a ${actualRemainingPercentage}% stake in ${targetCompanyName}.`;
                }
                console.log(`✅ Updated existing entity for remaining ownership: ${shareholderId} (${shareholderName})`);
            }

            relationships.push({
                source: shareholderId,
                target: targetId,
                type: 'ownership',
                percentage: actualRemainingPercentage,
            } as OwnershipRelationship);

            console.log(`✅ Added ${actualRemainingPercentage}% remaining ownership: ${shareholderName} (${shareholderId}) -> ${targetCompanyName} (${targetId})`);
        } else {
            // Fallback: create remaining ownership based on calculation
            if (!entities.find(e => e.id === shareholderId)) {
                entities.push({
                    id: shareholderId,
                    name: shareholderName,
                    type: 'stockholder',
                    percentage: remainingPercentage,
                    description: `Original shareholders of ${targetCompanyName} who retain a ${remainingPercentage}% stake.`,
                });
                console.log(`✅ Created fallback entity for remaining ownership: ${shareholderId} (${shareholderName})`);
            }
            relationships.push({
                source: shareholderId,
                target: targetId,
                type: 'ownership',
                percentage: remainingPercentage,
            } as OwnershipRelationship);

            console.log(`✅ Added ${remainingPercentage}% calculated remaining ownership: ${shareholderName} (${shareholderId}) -> ${targetCompanyName} (${targetId})`);
        }

        // Mark this entity as processed in this context
        processedEntities.add(trackingKey);
    }
};
