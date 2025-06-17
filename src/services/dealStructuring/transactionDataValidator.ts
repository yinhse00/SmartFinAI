import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { dataConsistencyService } from './dataConsistencyService';

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

    // Validate data consistency using the central service
    const consistencyValidation = dataConsistencyService.validateDataConsistency(analysisResults);
    if (!consistencyValidation.isConsistent) {
      errors.push(...consistencyValidation.inconsistencies);
    }

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
    console.log('=== VALIDATOR: EXTRACTING CONSIDERATION AMOUNT ===');
    
    // Use the data consistency service for authoritative data extraction
    const consistentData = dataConsistencyService.extractConsistentData(results);
    
    console.log('✅ Extracted consideration amount via consistency service:', consistentData.considerationAmount);
    console.log('Data source:', consistentData.source);
    
    return consistentData.considerationAmount;
  }

  extractOwnershipPercentages(results: AnalysisResults): { 
    acquisitionPercentage: number; 
    remainingPercentage: number; 
  } {
    // Use the data consistency service
    const consistentData = dataConsistencyService.extractConsistentData(results);
    
    return {
      acquisitionPercentage: consistentData.acquisitionPercentage,
      remainingPercentage: 100 - consistentData.acquisitionPercentage
    };
  }

  extractEntityNames(results: AnalysisResults): {
    targetCompanyName: string;
    acquiringCompanyName: string;
  } {
    // Use the data consistency service
    const consistentData = dataConsistencyService.extractConsistentData(results);
    
    return {
      targetCompanyName: consistentData.targetCompanyName,
      acquiringCompanyName: consistentData.acquiringCompanyName
    };
  }
}

export const transactionDataValidator = new TransactionDataValidator();
