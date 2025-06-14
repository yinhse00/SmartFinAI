import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, ConsiderationRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

type CorporateStructureMap = Map<string, CorporateEntity & { children?: string[]; parentLink?: string }>;
type Entities = TransactionEntity[];
type Relationships = AnyTransactionRelationship[];

// --- Constants for consolidating Target Shareholder entities ---
const NORMALIZED_TARGET_SHAREHOLDER_NAME = 'Former Target Shareholders';

// --- Helper functions for identifying shareholder types from analysis results ---

// Identifies shareholders who are explicitly marked as "continuing" or "remaining" in the target company.
const isContinuingOrRemainingShareholder = (name: string) =>
    name.toLowerCase().includes('continuing') || name.toLowerCase().includes('remaining');

// A broader check to identify any group referred to as "Target Shareholders".
const isTargetShareholderGroup = (name: string) =>
    /target shareholder/i.test(name);

export const createAcquirerEntity = (
    acquirerName: string,
    corporateStructureMap: CorporateStructureMap,
    prefix: string,
    entities: Entities
) => {
    const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === acquirerName);
    let acquirerId: string;
    let acquirerDiagramType: TransactionEntity['type'] = 'buyer';

    if (acquirerCorpEntityData) {
        acquirerDiagramType = acquirerCorpEntityData.type === 'issuer' || acquirerCorpEntityData.type === 'parent' ? 'parent' : 'buyer';
        acquirerId = generateEntityId(acquirerDiagramType, acquirerName, prefix);
    } else {
        acquirerId = generateEntityId('buyer', acquirerName, prefix);
    }

    if (!entities.find(e => e.id === acquirerId)) {
        entities.push({
            id: acquirerId,
            name: acquirerName,
            type: acquirerDiagramType,
            description: `Acquiring Entity${acquirerCorpEntityData ? ` (${acquirerCorpEntityData.type} in source)` : ''}`,
        });
    }

    return { acquirerId, acquirerCorpEntityData };
};

export const addAcquirerShareholders = (
    results: AnalysisResults,
    acquirerId: string,
    acquirerName: string,
    prefix: string,
    entities: Entities,
    relationships: Relationships,
    processedEntities: Set<string>
) => {
    const acquirerNewShareholders = results.shareholdingChanges?.after || [];
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const stockConsiderationExists = (paymentStructure?.stockPercentage ?? 0) > 0;
    const acquiredPercentage = results.structure?.majorTerms?.targetPercentage ?? results.dealEconomics?.targetPercentage ?? 100;
    const isPartialAcquisition = acquiredPercentage < 100;

    console.log(`🔍 Processing acquirer shareholders for ${acquirerName}:`, {
        shareholdersCount: acquirerNewShareholders.length,
        isPartialAcquisition,
        acquiredPercentage,
        stockConsiderationExists
    });

    acquirerNewShareholders.forEach((holder) => {
        // Skip shareholders explicitly marked as 'continuing' or 'remaining'.
        if (isContinuingOrRemainingShareholder(holder.name)) {
            console.log(`⏭️  Skipping continuing shareholder: ${holder.name}`);
            return;
        }

        const isTargetShareholder = isTargetShareholderGroup(holder.name);
        
        // For target shareholders in partial acquisitions, we need to handle them differently
        if (isPartialAcquisition && isTargetShareholder) {
            // Only process target shareholders who explicitly received new equity in the acquirer
            // This should be the 8% portion that gets equity in Listed Company
            const isExplicitNewRecipient = holder.type === 'new_equity_recipient' || stockConsiderationExists;
            if (!isExplicitNewRecipient) {
                console.log(`⏭️  Skipping target shareholder ${holder.name} in partial acquisition (no new equity)`);
                return;
            }
            console.log(`✅ Processing target shareholder ${holder.name} as new equity recipient (${holder.percentage}%)`);
        }

        const normalizedName = isTargetShareholder ? NORMALIZED_TARGET_SHAREHOLDER_NAME : holder.name;
        
        // Create a unique tracking key for this specific context (acquirer shareholding)
        const trackingKey = `${normalizedName}_in_${acquirerName}`;

        // Check if this entity has already been processed in this context
        if (processedEntities.has(trackingKey)) {
            console.log(`⚠️  Skipping duplicate processing of "${normalizedName}" in ${acquirerName}`);
            return;
        }

        if (holder.name.toLowerCase() !== acquirerName.toLowerCase()) {
            const shareholderId = generateEntityId('stockholder', normalizedName, prefix);
            
            const existingEntity = entities.find(e => e.id === shareholderId);

            if (!existingEntity) {
                entities.push({
                    id: shareholderId,
                    name: normalizedName,
                    type: 'stockholder',
                    percentage: holder.percentage,
                    description: isTargetShareholder
                        ? `Former Target Shareholders who received ${holder.percentage}% equity in ${acquirerName}.`
                        : `Shareholder of ${acquirerName} (post-transaction). Original Type: ${holder.type}`,
                });
            } else if (isTargetShareholder && existingEntity.description) {
                if (!existingEntity.description.includes(`equity in ${acquirerName}`)) {
                    existingEntity.description += ` They also received ${holder.percentage}% equity in ${acquirerName}.`;
                }
            }

            // Validate before creating relationship
            const existingOwnership = relationships
                .filter(r => r.type === 'ownership' && r.target === acquirerId)
                .reduce((sum, r) => sum + ((r as OwnershipRelationship).percentage || 0), 0);
            
            if (existingOwnership + holder.percentage > 100) {
                console.warn(`⚠️  Ownership validation: Adding ${holder.percentage}% for ${normalizedName} would exceed 100% for ${acquirerName} (current: ${existingOwnership}%)`);
            }

            relationships.push({
                source: shareholderId,
                target: acquirerId,
                type: 'ownership',
                percentage: holder.percentage,
            } as OwnershipRelationship);

            // Mark this entity as processed in this context
            processedEntities.add(trackingKey);
            console.log(`✅ Added ${holder.percentage}% ownership: ${normalizedName} -> ${acquirerName}`);
        }
    });
};

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

        // Create a unique tracking key for this specific context (target shareholding)
        const shareholderName = NORMALIZED_TARGET_SHAREHOLDER_NAME;
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
            
            const shareholderId = generateEntityId('stockholder', shareholderName, prefix);
            const existingEntity = entities.find(e => e.id === shareholderId);

            if (!existingEntity) {
                entities.push({
                    id: shareholderId,
                    name: shareholderName,
                    type: 'stockholder',
                    percentage: actualRemainingPercentage,
                    description: `Former Target Shareholders who retain a ${actualRemainingPercentage}% stake in ${targetCompanyName}.`,
                });
            } else if (existingEntity.description) {
                if (!existingEntity.description.includes(`stake in ${targetCompanyName}`)) {
                    existingEntity.description += ` They also retain a ${actualRemainingPercentage}% stake in ${targetCompanyName}.`;
                }
            }

            relationships.push({
                source: shareholderId,
                target: targetId,
                type: 'ownership',
                percentage: actualRemainingPercentage,
            } as OwnershipRelationship);

            console.log(`✅ Added ${actualRemainingPercentage}% remaining ownership: ${shareholderName} -> ${targetCompanyName}`);
        } else {
            // Fallback: create remaining ownership based on calculation
            const shareholderId = generateEntityId('stockholder', shareholderName, prefix);
            if (!entities.find(e => e.id === shareholderId)) {
                entities.push({
                    id: shareholderId,
                    name: shareholderName,
                    type: 'stockholder',
                    percentage: remainingPercentage,
                    description: `Original shareholders of ${targetCompanyName} who retain a ${remainingPercentage}% stake.`,
                });
            }
            relationships.push({
                source: shareholderId,
                target: targetId,
                type: 'ownership',
                percentage: remainingPercentage,
            } as OwnershipRelationship);

            console.log(`✅ Added ${remainingPercentage}% calculated remaining ownership: ${shareholderName} -> ${targetCompanyName}`);
        }

        // Mark this entity as processed in this context
        processedEntities.add(trackingKey);
    }
};

export const addConsiderationDetails = (
    results: AnalysisResults,
    considerationAmount: number,
    acquirerId: string,
    prefix: string,
    entities: Entities,
    relationships: Relationships
) => {
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const stockPaymentPercentage = paymentStructure?.stockPercentage || 0;
    const purchasePrice = results.dealEconomics?.purchasePrice || considerationAmount || 0;

    let cashConsiderationAmount = considerationAmount;
    if (stockPaymentPercentage > 0 && stockPaymentPercentage < 100 && purchasePrice > 0) {
        cashConsiderationAmount = purchasePrice * ((100 - stockPaymentPercentage) / 100);
    } else if (stockPaymentPercentage === 100) {
        cashConsiderationAmount = 0;
    }

    if (cashConsiderationAmount > 0) {
        const considerationNodeName = stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ?
            `Cash Payment (${(cashConsiderationAmount / 1000000).toFixed(0)}M)` :
            `Payment (${(cashConsiderationAmount / 1000000).toFixed(0)}M)`;
        const considerationId = generateEntityId('consideration', considerationNodeName, prefix);
        
        if (!entities.find(e => e.id === considerationId)) {
            entities.push({
                id: considerationId,
                name: `${results.dealEconomics?.currency || 'HKD'} ${(cashConsiderationAmount / 1000000).toFixed(0)}M`,
                type: 'consideration',
                value: cashConsiderationAmount,
                currency: results.dealEconomics?.currency || 'HKD',
                description: stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ? 'Cash portion of Transaction Consideration' : 'Transaction Consideration',
            });
        }
        relationships.push({
            source: acquirerId,
            target: considerationId,
            type: 'consideration',
            value: cashConsiderationAmount,
        } as ConsiderationRelationship);
    }
};
