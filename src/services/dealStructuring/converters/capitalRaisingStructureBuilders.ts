
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';

export class CapitalRaisingStructureBuilders {
  static buildCapitalRaisingBeforeStructure(
    results: AnalysisResults,
    entityNames: any,
    corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
  ): TransactionFlow['before'] {
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    const prefix = 'before';

    // 1. Add issuing company
    const issuingCompanyName = entityNames.issuingCompanyName || entityNames.primaryCompanyName;
    const issuingCompanyId = `${prefix}-issuing-company`;
    
    entities.push({
      id: issuingCompanyId,
      name: issuingCompanyName,
      type: 'target', // Use 'target' for positioning in hierarchy
      description: `Issuing company before capital raising`
    });

    // 2. Add individual shareholders from analysis results
    const beforeShareholders = results.shareholding?.before || [];
    beforeShareholders.forEach((shareholder, index) => {
      const shareholderId = `${prefix}-shareholder-${index}`;
      
      entities.push({
        id: shareholderId,
        name: shareholder.name,
        type: 'stockholder',
        percentage: shareholder.percentage,
        description: `Existing shareholder with ${shareholder.percentage}% ownership`
      });

      // Create ownership relationship
      relationships.push({
        source: shareholderId,
        target: issuingCompanyId,
        type: 'ownership',
        percentage: shareholder.percentage,
        label: `${shareholder.percentage}%`
      } as OwnershipRelationship);
    });

    console.log(`Capital Raising Before Structure: ${entities.length} entities, ${relationships.length} relationships`);
    entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name} Percentage: ${e.percentage}`));

    return { entities, relationships };
  }

  static buildCapitalRaisingAfterStructure(
    results: AnalysisResults,
    entityNames: any,
    corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
    considerationAmount: number
  ): TransactionFlow['after'] {
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    const prefix = 'after';

    // 1. Add issuing company (same company, post-transaction)
    const issuingCompanyName = entityNames.issuingCompanyName || entityNames.primaryCompanyName;
    const issuingCompanyId = `${prefix}-issuing-company`;
    
    entities.push({
      id: issuingCompanyId,
      name: issuingCompanyName,
      type: 'target', // Use 'target' for positioning in hierarchy
      description: `Issuing company after capital raising`
    });

    // 2. Add individual shareholders from analysis results (post-dilution)
    const afterShareholders = results.shareholding?.after || [];
    afterShareholders.forEach((shareholder, index) => {
      const shareholderId = `${prefix}-shareholder-${index}`;
      
      // Determine if this is a new investor or existing shareholder
      const beforeShareholders = results.shareholding?.before || [];
      const wasExistingShareholder = beforeShareholders.some(bs => bs.name === shareholder.name);
      
      entities.push({
        id: shareholderId,
        name: shareholder.name,
        type: wasExistingShareholder ? 'stockholder' : 'investor',
        percentage: shareholder.percentage,
        description: wasExistingShareholder 
          ? `Existing shareholder with diluted ${shareholder.percentage}% ownership`
          : `New investor with ${shareholder.percentage}% ownership`
      });

      // Create ownership relationship
      relationships.push({
        source: shareholderId,
        target: issuingCompanyId,
        type: 'ownership',
        percentage: shareholder.percentage,
        label: `${shareholder.percentage}%`
      } as OwnershipRelationship);
    });

    // 3. Add proceeds/consideration if significant
    if (considerationAmount > 0) {
      const proceedsId = `${prefix}-proceeds`;
      const currency = results.dealEconomics?.currency || 'HKD';
      
      entities.push({
        id: proceedsId,
        name: 'Proceeds Raised',
        type: 'consideration',
        value: considerationAmount,
        currency: currency,
        description: `${currency} ${(considerationAmount / 1000000).toFixed(0)}M raised from capital raising`
      });

      relationships.push({
        source: proceedsId,
        target: issuingCompanyId,
        type: 'funding',
        value: considerationAmount,
        currency: currency,
        label: `${currency} ${(considerationAmount / 1000000).toFixed(0)}M`
      });
    }

    console.log(`Capital Raising After Structure: ${entities.length} entities, ${relationships.length} relationships`);
    entities.forEach(e => console.log(`After Entity: ${e.id} (${e.type}) Name: ${e.name} Percentage: ${e.percentage}`));

    return { entities, relationships };
  }
}
