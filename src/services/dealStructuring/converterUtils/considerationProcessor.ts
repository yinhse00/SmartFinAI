
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
