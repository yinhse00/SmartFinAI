
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, ConsiderationRelationship, OperationalRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { generateEntityId } from './entityHelpers';

type Entities = TransactionEntity[];
type Relationships = AnyTransactionRelationship[];

export const addConsiderationDetails = (
    results: AnalysisResults,
    considerationAmount: number,
    acquirerId: string,
    prefix: string,
    entities: Entities,
    relationships: Relationships,
    formerShareholdersId?: string
) => {
    console.log('=== DEBUGGING addConsiderationDetails ===');
    console.log('Input considerationAmount:', considerationAmount);
    
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const stockPaymentPercentage = paymentStructure?.stockPercentage || 0;
    const purchasePrice = results.dealEconomics?.purchasePrice || considerationAmount || 0;
    
    console.log('Purchase price from dealEconomics:', results.dealEconomics?.purchasePrice);
    console.log('Final purchase price used:', purchasePrice);
    console.log('Stock payment percentage:', stockPaymentPercentage);

    let cashConsiderationAmount = considerationAmount;
    if (stockPaymentPercentage > 0 && stockPaymentPercentage < 100 && purchasePrice > 0) {
        cashConsiderationAmount = purchasePrice * ((100 - stockPaymentPercentage) / 100);
        console.log('Mixed payment calculated cash amount:', cashConsiderationAmount);
    } else if (stockPaymentPercentage === 100) {
        cashConsiderationAmount = 0;
        console.log('Stock-only payment, cash amount set to 0');
    }
    
    console.log('Final cash consideration amount:', cashConsiderationAmount);

    if (cashConsiderationAmount > 0) {
        const millionsAmount = (cashConsiderationAmount / 1000000).toFixed(0);
        console.log('Millions calculation - cashConsiderationAmount:', cashConsiderationAmount, 'divided by 1000000 =', millionsAmount);
        
        const considerationNodeName = stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ?
            `Cash Payment (${millionsAmount}M)` :
            `Payment (${millionsAmount}M)`;
        const considerationId = generateEntityId('consideration', considerationNodeName, prefix);
        
        console.log('Generated consideration node name:', considerationNodeName);
        console.log('Generated consideration ID:', considerationId);
        
        if (!entities.find(e => e.id === considerationId)) {
            const entityValue = cashConsiderationAmount;
            const entityName = `${results.dealEconomics?.currency || 'HKD'} ${millionsAmount}M`;
            
            console.log('Creating entity with value:', entityValue, 'and name:', entityName);
            
            entities.push({
                id: considerationId,
                name: entityName,
                type: 'consideration',
                value: entityValue,
                currency: results.dealEconomics?.currency || 'HKD',
                description: stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ? 'Cash portion of Transaction Consideration' : 'Transaction Consideration',
            });
        }

        // Relationship: Acquirer → Consideration
        relationships.push({
            source: acquirerId,
            target: considerationId,
            type: 'consideration',
            value: cashConsiderationAmount,
        } as ConsiderationRelationship);

        // Relationship: Consideration → Former Target Shareholders (if they exist)
        if (formerShareholdersId && entities.find(e => e.id === formerShareholdersId)) {
            relationships.push({
                source: considerationId,
                target: formerShareholdersId,
                type: 'receives_from',
                description: 'Consideration payment to former shareholders',
            } as OperationalRelationship);
        }
    }
};
