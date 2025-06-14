import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, ConsiderationRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

type CorporateStructureMap = Map<string, CorporateEntity & { children?: string[]; parentLink?: string }>;
type Entities = TransactionEntity[];
type Relationships = AnyTransactionRelationship[];

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
    relationships: Relationships
) => {
    const acquirerNewShareholders = results.shareholdingChanges?.after || [];
    const acquiredPercentage = results.structure?.majorTerms?.targetPercentage ?? results.dealEconomics?.targetPercentage ?? 100;

    // This function identifies shareholders who are continuing to hold shares in the target company
    // to prevent them from being incorrectly linked to the acquirer. Their ownership is handled
    // separately in `addTargetWithOwnership`.
    const isContinuingTargetShareholder = (name: string) => 
        name.toLowerCase().includes('continuing') || name.toLowerCase().includes('remaining');

    acquirerNewShareholders.forEach((holder) => {
        // In a partial acquisition, skip processing for continuing target shareholders.
        if (acquiredPercentage < 100 && isContinuingTargetShareholder(holder.name)) {
            return; 
        }

        if (holder.name.toLowerCase() !== acquirerName.toLowerCase()) {
            const shareholderId = generateEntityId('stockholder', holder.name, prefix);
            if (!entities.find(e => e.id === shareholderId)) {
                entities.push({
                    id: shareholderId,
                    name: holder.name,
                    type: 'stockholder',
                    percentage: holder.percentage,
                    description: `Shareholder of ${acquirerName} (post-transaction). Original Type: ${holder.type}`,
                });
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
    visitedChildren: Set<string>
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
        const continuingShareholderName = 'Continuing Target Shareholders';
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
