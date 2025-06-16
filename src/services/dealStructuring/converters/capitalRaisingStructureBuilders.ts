
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, AnyTransactionRelationship, TransactionFlowScenario } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { ShareholdingDataInspector } from './shareholdingDataInspector';

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
    // Get correctly calculated scenarios using the inspector
    const { fullTakeup, noOtherTakeup } = ShareholdingDataInspector.calculateCapitalRaisingScenarios(results);
    
    // Generate two scenarios for capital raising
    const fullTakeupScenario = this.buildFullTakeupScenario(results, entityNames, considerationAmount, fullTakeup);
    const noOtherTakeupScenario = this.buildNoOtherTakeupScenario(results, entityNames, considerationAmount, noOtherTakeup);

    return [fullTakeupScenario, noOtherTakeupScenario];
  }

  private static buildFullTakeupScenario(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number,
    shareholdingData: any[] | null
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
      description: `Issuing company after capital raising (full take-up - no dilution)`
    });

    // 2. Use shareholding data (should be same as before for full take-up)
    const shareholders = shareholdingData || results.shareholding?.before || [];
    shareholders.forEach((shareholder, index) => {
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
          ? `Existing shareholder maintaining ${shareholder.percentage}% ownership (full take-up, no dilution)`
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

    console.log(`📊 Full Take-up Scenario: ${shareholders.length} shareholders, no dilution`);

    return {
      scenario: { entities, relationships },
      scenarioName: 'Full Take-up',
      scenarioDescription: 'All available shares/rights are taken up - shareholding percentages remain unchanged (no dilution)'
    };
  }

  private static buildNoOtherTakeupScenario(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number,
    shareholdingData: any[] | null
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
      description: `Issuing company after capital raising (no other take-up - dilution occurred)`
    });

    // 2. Use calculated shareholding data with dilution
    const shareholders = shareholdingData || results.shareholding?.after || [];
    const beforeShareholders = results.shareholding?.before || [];
    
    // Identify controlling shareholder from before scenario
    const controllingShareholder = ShareholdingDataInspector.identifyControllingShareholderForCapitalRaising(results);
    
    // Debug logging for shareholder matching
    console.log('🔍 Before shareholders for matching:', beforeShareholders.map(sh => ({ name: sh.name, percentage: sh.percentage })));
    console.log('🔍 After shareholders for matching:', shareholders.map(sh => ({ name: sh.name, percentage: sh.percentage })));
    console.log('🎯 Identified controlling shareholder:', controllingShareholder);
    
    // Track if we've already processed the controlling shareholder
    let controllingShareholderProcessed = false;
    let controllingShareholderIndex = 0;
    
    shareholders.forEach((shareholder, index) => {
      // Check if this is the controlling shareholder and we haven't processed them yet
      const isControllingShareholder = controllingShareholder && shareholder.name === controllingShareholder;
      
      if (isControllingShareholder && !controllingShareholderProcessed) {
        // Process controlling shareholder with consolidation logic
        const shareholderId = `${prefix}-controlling-shareholder`;
        
        // Get before percentage for controlling shareholder
        const beforePercentage = this.findMatchingShareholderPercentage(shareholder.name, beforeShareholders);
        const currentPercentage = shareholder.percentage;
        
        console.log(`🎯 Processing controlling shareholder "${shareholder.name}": before=${beforePercentage}%, after=${currentPercentage}%`);
        
        // Calculate new shares acquired (difference between after and before)
        const newSharesPercentage = currentPercentage - beforePercentage;
        
        let description: string;
        if (newSharesPercentage > 0) {
          description = `Controlling shareholder (${beforePercentage}% existing + ${newSharesPercentage.toFixed(2)}% new shares = ${currentPercentage}% total)`;
        } else {
          description = `Controlling shareholder maintaining ${currentPercentage}% ownership (no other take-up)`;
        }
        
        entities.push({
          id: shareholderId,
          name: shareholder.name,
          type: 'stockholder',
          percentage: currentPercentage,
          description: description
        });

        // Create ownership relationship
        relationships.push({
          source: shareholderId,
          target: issuingCompanyId,
          type: 'ownership',
          percentage: currentPercentage,
          label: `${currentPercentage}%`
        } as OwnershipRelationship);
        
        controllingShareholderProcessed = true;
        controllingShareholderIndex = index;
      } else if (!isControllingShareholder) {
        // Process other shareholders (non-controlling) with existing logic
        const shareholderId = `${prefix}-shareholder-${index}`;
        
        // Improved shareholder matching logic
        const beforePercentage = this.findMatchingShareholderPercentage(shareholder.name, beforeShareholders);
        const currentPercentage = shareholder.percentage;
        
        console.log(`🔍 Matching shareholder "${shareholder.name}": before=${beforePercentage}%, after=${currentPercentage}%`);
        
        const isDiluted = beforePercentage > 0 && currentPercentage < beforePercentage;
        const isNewShareholder = beforePercentage === 0;
        
        let description = `Shareholder with ${currentPercentage}% ownership`;
        if (isDiluted) {
          description = `Existing shareholder diluted from ${beforePercentage}% to ${currentPercentage}% (no other take-up)`;
        } else if (isNewShareholder) {
          description = `New shareholder with ${currentPercentage}% ownership (capital raising)`;
        } else if (beforePercentage > 0) {
          description = `Existing shareholder maintaining ${currentPercentage}% ownership`;
        }
        
        entities.push({
          id: shareholderId,
          name: shareholder.name,
          type: 'stockholder',
          percentage: currentPercentage,
          description: description
        });

        // Create ownership relationship
        relationships.push({
          source: shareholderId,
          target: issuingCompanyId,
          type: 'ownership',
          percentage: currentPercentage,
          label: `${currentPercentage}%`
        } as OwnershipRelationship);
      }
      // Skip duplicate controlling shareholder entries (if any)
    });

    // 3. Add proceeds (likely lower amount due to partial take-up)
    if (considerationAmount > 0) {
      const proceedsId = `${prefix}-proceeds`;
      const currency = results.dealEconomics?.currency || 'HKD';
      // Calculate reduced proceeds based on actual take-up rate
      const takeupRate = 0.7; // This could be calculated based on actual scenario data
      const actualProceeds = considerationAmount * takeupRate;
      
      entities.push({
        id: proceedsId,
        name: 'Proceeds Raised',
        type: 'consideration',
        value: actualProceeds,
        currency: currency,
        description: `${currency} ${(actualProceeds / 1000000).toFixed(0)}M raised (no other take-up scenario)`
      });

      relationships.push({
        source: proceedsId,
        target: issuingCompanyId,
        type: 'funding',
        value: actualProceeds,
        currency: currency,
        label: `${currency} ${(actualProceeds / 1000000).toFixed(0)}M`
      });
    }

    console.log(`📊 No Other Take-up Scenario: ${shareholders.length} shareholders, consolidation applied for controlling shareholder`);

    return {
      scenario: { entities, relationships },
      scenarioName: 'No Other Take-up',
      scenarioDescription: 'Only controlling shareholder (underwriter) participates - other shareholders are diluted'
    };
  }
  
  /**
   * Improved shareholder matching logic with fuzzy matching capabilities
   */
  private static findMatchingShareholderPercentage(shareholderName: string, beforeShareholders: any[]): number {
    // Exact name match first
    const exactMatch = beforeShareholders.find(sh => sh.name === shareholderName);
    if (exactMatch) {
      return exactMatch.percentage;
    }
    
    // Fuzzy matching - case insensitive and trimmed
    const normalizedName = shareholderName.toLowerCase().trim();
    const fuzzyMatch = beforeShareholders.find(sh => 
      sh.name.toLowerCase().trim() === normalizedName
    );
    if (fuzzyMatch) {
      console.log(`🔍 Fuzzy match found: "${shareholderName}" matched with "${fuzzyMatch.name}"`);
      return fuzzyMatch.percentage;
    }
    
    // Partial match for grouped shareholders (e.g., "Controlling Shareholders" vs "ABC Corp")
    const partialMatch = beforeShareholders.find(sh => {
      const beforeName = sh.name.toLowerCase().trim();
      return beforeName.includes(normalizedName) || normalizedName.includes(beforeName);
    });
    if (partialMatch) {
      console.log(`🔍 Partial match found: "${shareholderName}" matched with "${partialMatch.name}"`);
      return partialMatch.percentage;
    }
    
    // No match found - could be new shareholder
    console.log(`⚠️ No matching before shareholder found for "${shareholderName}"`);
    return 0;
  }
}
