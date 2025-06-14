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
    ownershipExclusionList?: Set<string>
) => {
    const acquirerNewShareholders = results.shareholdingChanges?.after || [];
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const stockConsiderationExists = (paymentStructure?.stockPercentage ?? 0) > 0;
    const acquiredPercentage =
      results.structure?.majorTerms?.targetPercentage ??
      results.dealEconomics?.targetPercentage ??
      100;

    acquirerNewShareholders.forEach((holder) => {
        // Skip shareholders explicitly marked as 'continuing' or 'remaining'.
        if (isContinuingOrRemainingShareholder(holder.name)) {
            return;
        }

        const isTargetShareholder = isTargetShareholderGroup(holder.name);

        // In partial acquisitions, exclude any generic target shareholder groups.
        if (isTargetShareholder && acquiredPercentage < 100) {
            if (ownershipExclusionList) {
                ownershipExclusionList.add(holder.name);
                ownershipExclusionList.add(NORMALIZED_TARGET_SHAREHOLDER_NAME); // Explicitly add normalized name as well
            }
            return;
        }

        // If this is a generic 'Target Shareholder' group, only link if clearly new equity recipient or stock consideration.
        if (isTargetShareholder) {
            const isExplicitNewRecipient = holder.type === 'new_equity_recipient';
            if (!stockConsiderationExists && !isExplicitNewRecipient) {
                return;
            }
        }

        if (holder.name.toLowerCase() !== acquirerName.toLowerCase()) {
            const shareholderName = isTargetShareholder ? NORMALIZED_TARGET_SHAREHOLDER_NAME : holder.name;
            const shareholderId = generateEntityId('stockholder', shareholderName, prefix);

            const existingEntity = entities.find(e => e.id === shareholderId);

            if (!existingEntity) {
                entities.push({
                    id: shareholderId,
                    name: shareholderName,
                    type: 'stockholder',
                    percentage: holder.percentage,
                    description: isTargetShareholder
                        ? `Former Target Shareholders who received equity in ${acquirerName}.`
                        : `Shareholder of ${acquirerName} (post-transaction). Original Type: ${holder.type}`,
                });
            } else if (isTargetShareholder && existingEntity.description) {
                if (!existingEntity.description.includes(`equity in ${acquirerName}`)) {
                    existingEntity.description += ` They also received equity in ${acquirerName}.`;
                }
            }

            relationships.push({
                source: shareholderId,
                target: acquirerId,
                type: 'ownership',
                percentage: holder.percentage,
            } as OwnershipRelationship);
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
    ownershipExclusionList?: Set<string>
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

    relationships.push({
        source: acquirerId,
        target: targetId,
        type: 'ownership',
        percentage: acquiredPercentage,
    } as OwnershipRelationship);

    if (acquiredPercentage < 100) {
        const allAfterShareholders = results.shareholdingChanges?.after || [];
        const continuingShareholders = allAfterShareholders.filter(holder => {
            const origName = holder.name;
            const normalizedName = isTargetShareholderGroup(origName) ? NORMALIZED_TARGET_SHAREHOLDER_NAME : origName;
            // Exclude the group if either original or normalized name is excluded
            const isExcluded = ownershipExclusionList && (
                ownershipExclusionList.has(origName) || ownershipExclusionList.has(normalizedName)
            );
            return (
                (isContinuingOrRemainingShareholder(origName) ||
                 isTargetShareholderGroup(origName)) &&
                !isExcluded
            );
        });

        if (continuingShareholders.length > 0) {
            continuingShareholders.forEach(holder => {
                const origName = holder.name;
                const normalizedName = isTargetShareholderGroup(origName) ? NORMALIZED_TARGET_SHAREHOLDER_NAME : origName;
                // Only process if not excluded:
                if (ownershipExclusionList && (ownershipExclusionList.has(origName) || ownershipExclusionList.has(normalizedName))) return;

                const shareholderName = normalizedName;
                const shareholderId = generateEntityId('stockholder', shareholderName, prefix);
                const existingEntity = entities.find(e => e.id === shareholderId);

                if (!existingEntity) {
                    entities.push({
                        id: shareholderId,
                        name: shareholderName,
                        type: 'stockholder',
                        percentage: holder.percentage,
                        description: `Former Target Shareholders who retain a ${holder.percentage}% stake in ${targetCompanyName}.`,
                    });
                } else if (existingEntity.description) {
                    if (!existingEntity.description.includes(`stake in ${targetCompanyName}`)) {
                        existingEntity.description += ` They also retain a ${holder.percentage}% stake in ${targetCompanyName}.`;
                    }
                }

                relationships.push({
                    source: shareholderId,
                    target: targetId,
                    type: 'ownership',
                    percentage: holder.percentage,
                } as OwnershipRelationship);
            });
        } else {
            // Fallback to generic entity if no specific continuing shareholders are found in results OR all are excluded.
            const continuingShareholderName = NORMALIZED_TARGET_SHAREHOLDER_NAME;
            // Only create generic fallback if not in exclusion list:
            if (!ownershipExclusionList || !ownershipExclusionList.has(continuingShareholderName)) {
                const continuingShareholderId = generateEntityId('stockholder', continuingShareholderName, prefix);
                if (!entities.find(e => e.id === continuingShareholderId)) {
                    entities.push({
                        id: continuingShareholderId,
                        name: continuingShareholderName,
                        type: 'stockholder',
                        percentage: 100 - acquiredPercentage,
                        description: `Original shareholders of ${targetCompanyName} who retain a ${100 - acquiredPercentage}% stake.`,
                    });
                }
                relationships.push({
                    source: continuingShareholderId,
                    target: targetId,
                    type: 'ownership',
                    percentage: 100 - acquiredPercentage,
                } as OwnershipRelationship);
            }
        }
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
