
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, AnyTransactionRelationship, TransactionFlowScenario } from '@/types/transactionFlow';
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
  ): TransactionFlowScenario[] {
    // Generate two scenarios for capital raising
    const fullTakeupScenario = this.buildFullTakeupScenario(results, entityNames, considerationAmount);
    const noOtherTakeupScenario = this.buildNoOtherTakeupScenario(results, entityNames, considerationAmount);

    return [fullTakeupScenario, noOtherTakeupScenario];
  }

  private static buildFullTakeupScenario(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number
  ): TransactionFlowScenario {
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    const prefix = 'after-full';

    // 1. Add issuing company
    const issuingCompanyName = entityNames.issuingCompanyName || entityNames.primaryCompanyName;
    const issuingCompanyId = `${prefix}-issuing-company`;
    
    entities.push({
      id: issuingCompanyId,
      name: issuingCompanyName,
      type: 'target',
      description: `Issuing company after capital raising (full take-up)`
    });

    // 2. Add shareholders from analysis results (post-dilution with full take-up)
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
          ? `Existing shareholder with diluted ${shareholder.percentage}% ownership (full take-up)`
          : `New investor with ${shareholder.percentage}% ownership (full take-up)`
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

    // 3. Add proceeds if significant
    if (considerationAmount > 0) {
      const proceedsId = `${prefix}-proceeds`;
      const currency = results.dealEconomics?.currency || 'HKD';
      
      entities.push({
        id: proceedsId,
        name: 'Proceeds Raised',
        type: 'consideration',
        value: considerationAmount,
        currency: currency,
        description: `${currency} ${(considerationAmount / 1000000).toFixed(0)}M raised (full take-up scenario)`
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

    return {
      scenario: { entities, relationships },
      scenarioName: 'Full Take-up',
      scenarioDescription: 'All available shares/rights are taken up by investors'
    };
  }

  private static buildNoOtherTakeupScenario(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number
  ): TransactionFlowScenario {
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    const prefix = 'after-no-other';

    // 1. Add issuing company
    const issuingCompanyName = entityNames.issuingCompanyName || entityNames.primaryCompanyName;
    const issuingCompanyId = `${prefix}-issuing-company`;
    
    entities.push({
      id: issuingCompanyId,
      name: issuingCompanyName,
      type: 'target',
      description: `Issuing company after capital raising (no other take-up)`
    });

    // 2. For no other take-up scenario, only existing shareholders participate
    const beforeShareholders = results.shareholding?.before || [];
    beforeShareholders.forEach((shareholder, index) => {
      const shareholderId = `${prefix}-shareholder-${index}`;
      
      // In no other take-up scenario, existing shareholders maintain or increase their percentage
      // This is a simplified assumption - in reality this would depend on the specific transaction terms
      const adjustedPercentage = shareholder.percentage; // Could be higher if they take up additional shares
      
      entities.push({
        id: shareholderId,
        name: shareholder.name,
        type: 'stockholder',
        percentage: adjustedPercentage,
        description: `Existing shareholder with ${adjustedPercentage}% ownership (no other take-up)`
      });

      // Create ownership relationship
      relationships.push({
        source: shareholderId,
        target: issuingCompanyId,
        type: 'ownership',
        percentage: adjustedPercentage,
        label: `${adjustedPercentage}%`
      } as OwnershipRelationship);
    });

    // 3. Add proceeds (likely lower amount due to no other take-up)
    if (considerationAmount > 0) {
      const proceedsId = `${prefix}-proceeds`;
      const currency = results.dealEconomics?.currency || 'HKD';
      const reducedAmount = considerationAmount * 0.7; // Assume 70% take-up in no other scenario
      
      entities.push({
        id: proceedsId,
        name: 'Proceeds Raised',
        type: 'consideration',
        value: reducedAmount,
        currency: currency,
        description: `${currency} ${(reducedAmount / 1000000).toFixed(0)}M raised (no other take-up scenario)`
      });

      relationships.push({
        source: proceedsId,
        target: issuingCompanyId,
        type: 'funding',
        value: reducedAmount,
        currency: currency,
        label: `${currency} ${(reducedAmount / 1000000).toFixed(0)}M`
      });
    }

    return {
      scenario: { entities, relationships },
      scenarioName: 'No Other Take-up',
      scenarioDescription: 'Only existing shareholders participate in the capital raising'
    };
  }
}
