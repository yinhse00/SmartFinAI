
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { 
    NORMALIZED_TARGET_SHAREHOLDER_NAME, 
    isContinuingOrRemainingShareholder, 
    isTargetShareholderGroup 
} from './shareholderIdentificationUtils';

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
            
            console.log(`🔧 Creating/updating shareholder entity for ${normalizedName}:`, {
                shareholderId,
                normalizedName,
                originalHolderName: holder.name,
                percentage: holder.percentage,
                isTargetShareholder
            });
            
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
                console.log(`✅ Created new entity: ${shareholderId} (${normalizedName})`);
            } else if (isTargetShareholder && existingEntity.description) {
                if (!existingEntity.description.includes(`equity in ${acquirerName}`)) {
                    existingEntity.description += ` They also received ${holder.percentage}% equity in ${acquirerName}.`;
                }
                console.log(`✅ Updated existing entity: ${shareholderId} (${normalizedName})`);
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
            console.log(`✅ Added ${holder.percentage}% ownership: ${normalizedName} (${shareholderId}) -> ${acquirerName} (${acquirerId})`);
        }
    });
};

// Create the processAcquirerEntities function that afterStructureBuilder expects
export const processAcquirerEntities = (
    results: AnalysisResults,
    entityNames: { acquiringCompanyName: string },
    entities: Entities,
    relationships: Relationships,
    prefix: string
): string => {
    const corporateStructureMap = new Map();
    if (results.corporateStructure?.entities) {
        results.corporateStructure.entities.forEach(entity => {
            corporateStructureMap.set(entity.id, entity);
        });
    }

    const processedEntities = new Set<string>();
    
    // Create acquirer entity
    const { acquirerId } = createAcquirerEntity(
        entityNames.acquiringCompanyName,
        corporateStructureMap,
        prefix,
        entities
    );

    // Add acquirer shareholders
    addAcquirerShareholders(
        results,
        acquirerId,
        entityNames.acquiringCompanyName,
        prefix,
        entities,
        relationships,
        processedEntities
    );

    return acquirerId;
};
