
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ShareholdingDataInspector } from './converters/shareholdingDataInspector';

export interface ProcessedShareholdingData {
  before: Array<{
    name: string;
    percentage: number;
  }>;
  after: Array<{
    name: string;
    percentage: number;
    description?: string;
  }>;
  impact: string;
}

export class ShareholdingDataProcessor {
  /**
   * Processes raw shareholding data to apply consolidation logic for consistent display
   */
  static processShareholdingData(
    results: AnalysisResults,
    transactionType?: string
  ): ProcessedShareholdingData {
    const rawBefore = results.shareholding?.before || [];
    const rawAfter = results.shareholding?.after || [];
    const rawImpact = results.shareholding?.impact || '';

    // For capital raising transactions, apply consolidation logic
    if (transactionType === 'CAPITAL_RAISING') {
      return this.processCapitalRaisingShareholding(results, rawBefore, rawAfter, rawImpact);
    }

    // For other transaction types, return data as-is
    return {
      before: rawBefore,
      after: rawAfter,
      impact: rawImpact
    };
  }

  private static processCapitalRaisingShareholding(
    results: AnalysisResults,
    rawBefore: any[],
    rawAfter: any[],
    rawImpact: string
  ): ProcessedShareholdingData {
    const controllingShareholder = ShareholdingDataInspector.identifyControllingShareholderForCapitalRaising(results);
    
    if (!controllingShareholder) {
      // No controlling shareholder identified, return raw data
      return {
        before: rawBefore,
        after: rawAfter,
        impact: rawImpact
      };
    }

    // Process AFTER data with consolidation logic
    const processedAfter = this.consolidateControllingShareholderData(
      rawBefore,
      rawAfter,
      controllingShareholder
    );

    return {
      before: rawBefore, // Before data remains unchanged
      after: processedAfter,
      impact: rawImpact
    };
  }

  private static consolidateControllingShareholderData(
    beforeShareholders: any[],
    afterShareholders: any[],
    controllingShareholder: string
  ): Array<{ name: string; percentage: number; description?: string }> {
    const processedShareholders: Array<{ name: string; percentage: number; description?: string }> = [];
    let controllingShareholderProcessed = false;

    console.log('🔧 Processing shareholding data for consolidation...');
    console.log('🎯 Controlling shareholder:', controllingShareholder);

    afterShareholders.forEach((shareholder, index) => {
      const isControllingShareholder = shareholder.name === controllingShareholder;
      
      if (isControllingShareholder && !controllingShareholderProcessed) {
        // Process controlling shareholder with consolidation logic
        const beforePercentage = this.findMatchingShareholderPercentage(shareholder.name, beforeShareholders);
        const currentPercentage = shareholder.percentage;
        
        console.log(`🎯 Consolidating controlling shareholder "${shareholder.name}": before=${beforePercentage}%, after=${currentPercentage}%`);
        
        // Calculate new shares acquired
        const newSharesPercentage = currentPercentage - beforePercentage;
        
        let description: string;
        if (newSharesPercentage > 0) {
          description = `Controlling shareholder (${beforePercentage}% existing + ${newSharesPercentage.toFixed(2)}% new shares = ${currentPercentage}% total)`;
        } else {
          description = `Controlling shareholder maintaining ${currentPercentage}% ownership`;
        }
        
        processedShareholders.push({
          name: shareholder.name,
          percentage: currentPercentage,
          description: description
        });
        
        controllingShareholderProcessed = true;
      } else if (!isControllingShareholder) {
        // Process other shareholders with improved logic for new share allocation
        const beforePercentage = this.findMatchingShareholderPercentage(shareholder.name, beforeShareholders);
        const currentPercentage = shareholder.percentage;
        
        console.log(`🔍 Processing shareholder "${shareholder.name}": before=${beforePercentage}%, after=${currentPercentage}%`);
        
        const isNewShareholder = beforePercentage === 0;
        const hasIncreasedOwnership = beforePercentage > 0 && currentPercentage > beforePercentage;
        const hasDecreasedOwnership = beforePercentage > 0 && currentPercentage < beforePercentage;
        
        let description = `Shareholder with ${currentPercentage}% ownership`;
        
        if (isNewShareholder) {
          description = `New shareholder with ${currentPercentage}% ownership`;
        } else if (hasIncreasedOwnership) {
          // This shareholder received new shares - focus on acquisition, not dilution
          const newSharesPercentage = currentPercentage - beforePercentage;
          description = `New shares to be taken by ${shareholder.name} of ${newSharesPercentage.toFixed(2)}%`;
        } else if (hasDecreasedOwnership) {
          // This shareholder was diluted by others' participation
          description = `Existing shareholder maintaining ${currentPercentage}% (diluted by other participants)`;
        } else if (beforePercentage > 0) {
          // Shareholder maintained same percentage
          description = `Existing shareholder maintaining ${currentPercentage}% ownership`;
        }
        
        processedShareholders.push({
          name: shareholder.name,
          percentage: currentPercentage,
          description: description
        });
      }
      // Skip duplicate controlling shareholder entries (if any)
    });

    console.log('✅ Shareholding consolidation complete:', processedShareholders);
    return processedShareholders;
  }

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
    
    // No match found - could be new shareholder
    console.log(`⚠️ No matching before shareholder found for "${shareholderName}"`);
    return 0;
  }
}
