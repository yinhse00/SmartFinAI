
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface TransactionDataSources {
  shareholdingData: AnalysisResults['shareholding'];
  corporateStructure: AnalysisResults['corporateStructure'];
  costs: AnalysisResults['costs'];
  structure: AnalysisResults['structure'];
}

class TransactionDataValidator {
  validateConsistency(analysisResults: AnalysisResults): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate shareholding data consistency
    this.validateShareholdingConsistency(analysisResults, warnings, errors);
    
    // Validate cost data consistency
    this.validateCostConsistency(analysisResults, warnings, errors);
    
    // Validate entity naming consistency
    this.validateEntityNaming(analysisResults, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestions
    };
  }

  private validateShareholdingConsistency(
    results: AnalysisResults, 
    warnings: string[], 
    errors: string[]
  ): void {
    const { shareholding, shareholdingChanges } = results;

    if (!shareholding && !shareholdingChanges) {
      warnings.push('Missing shareholding data for transaction visualization');
      return;
    }

    // Check if before/after percentages add up to 100%
    if (shareholding?.before && shareholding.before.length > 0) {
      const beforeTotal = shareholding.before.reduce((sum, holder) => sum + holder.percentage, 0);
      if (Math.abs(beforeTotal - 100) > 0.1) {
        warnings.push(`Before transaction percentages sum to ${beforeTotal.toFixed(2)}% instead of 100%`);
      }
    }

    if (shareholding?.after && shareholding.after.length > 0) {
      const afterTotal = shareholding.after.reduce((sum, holder) => sum + holder.percentage, 0);
      if (Math.abs(afterTotal - 100) > 0.1) {
        warnings.push(`After transaction percentages sum to ${afterTotal.toFixed(2)}% instead of 100%`);
      }
    }
  }

  private validateCostConsistency(
    results: AnalysisResults, 
    warnings: string[], 
    errors: string[]
  ): void {
    const { costs } = results;

    if (!costs || costs.total <= 0) {
      warnings.push('Transaction costs data is missing or invalid');
    }

    // Check if breakdown adds up to total
    if (costs?.breakdown) {
      const breakdownTotal = costs.breakdown.reduce((sum, item) => sum + item.amount, 0);
      if (Math.abs(breakdownTotal - costs.total) > 1000) {
        warnings.push('Cost breakdown does not match total cost');
      }
    }
  }

  private validateEntityNaming(
    results: AnalysisResults, 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const { corporateStructure } = results;

    if (!corporateStructure?.entities || corporateStructure.entities.length === 0) {
      suggestions.push('Add corporate structure entities for better visualization');
    }
  }

  extractConsiderationAmount(results: AnalysisResults): number {
    // Primary source: dealEconomics.purchasePrice
    if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
      console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
      return results.dealEconomics.purchasePrice;
    }

    // Fallback: Try to extract from transaction description or structure
    if (results.structure?.rationale) {
      const amountMatches = results.structure.rationale.match(/(?:HKD|HK\$|USD|\$)\s*([0-9,.]+)(?:\s*million|M|billion|B)?/gi);
      if (amountMatches && amountMatches.length > 0) {
        const firstMatch = amountMatches[0];
        const numberMatch = firstMatch.match(/([0-9,.]+)/);
        if (numberMatch) {
          let amount = parseFloat(numberMatch[1].replace(/,/g, ''));
          
          // Convert millions/billions to actual amount
          if (firstMatch.toLowerCase().includes('million') || firstMatch.toLowerCase().includes('m')) {
            amount *= 1000000;
          } else if (firstMatch.toLowerCase().includes('billion') || firstMatch.toLowerCase().includes('b')) {
            amount *= 1000000000;
          }
          
          console.log('Extracted consideration from rationale:', amount);
          return amount;
        }
      }
    }

    // Last resort: Return 0 instead of using costs (which are execution fees, not purchase price)
    console.warn('No purchase price found in analysis results');
    return 0;
  }

  extractOwnershipPercentages(results: AnalysisResults): { 
    acquisitionPercentage: number; 
    remainingPercentage: number; 
  } {
    // Use shareholding data as primary source
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
      const acquirerData = results.shareholding.after.find(holder => 
        holder.name.toLowerCase().includes('acquir') || 
        holder.name.toLowerCase().includes('buyer') ||
        holder.name.toLowerCase().includes('purchas')
      );
      
      if (acquirerData) {
        return {
          acquisitionPercentage: acquirerData.percentage,
          remainingPercentage: 100 - acquirerData.percentage
        };
      }
    }

    // Return 0 instead of arbitrary percentages
    return {
      acquisitionPercentage: 0,
      remainingPercentage: 0
    };
  }

  extractEntityNames(results: AnalysisResults): {
    targetCompanyName: string;
    acquiringCompanyName: string;
  } {
    // Use corporate structure as primary source
    if (results.corporateStructure?.entities) {
      const targetEntity = results.corporateStructure.entities.find(e => e.type === 'target');
      const acquiringEntity = results.corporateStructure.entities.find(e => 
        e.type === 'parent' || e.type === 'issuer'
      );
      
      if (targetEntity && acquiringEntity) {
        return {
          targetCompanyName: targetEntity.name,
          acquiringCompanyName: acquiringEntity.name
        };
      }
    }

    // Return meaningful defaults instead of generic names
    return {
      targetCompanyName: 'Target Company',
      acquiringCompanyName: 'Acquiring Company'
    };
  }
}

export const transactionDataValidator = new TransactionDataValidator();
