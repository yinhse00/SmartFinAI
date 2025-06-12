
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
      errors.push('Missing shareholding data for transaction visualization');
      return;
    }

    // Check if before/after percentages add up to 100%
    if (shareholding?.before) {
      const beforeTotal = shareholding.before.reduce((sum, holder) => sum + holder.percentage, 0);
      if (Math.abs(beforeTotal - 100) > 0.1) {
        warnings.push(`Before transaction percentages sum to ${beforeTotal.toFixed(2)}% instead of 100%`);
      }
    }

    if (shareholding?.after) {
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
    // Priority order for consideration amount extraction
    
    // 1. Check if there's a dedicated transaction amount in costs
    if (results.costs?.total && results.costs.total > 1000000) {
      return results.costs.total;
    }

    // 2. Parse from structure rationale
    if (results.structure?.rationale) {
      const amountMatch = results.structure.rationale.match(/(HK\$\s*[\d.,]+\s*(?:million|billion))/i);
      if (amountMatch) {
        return this.parseAmount(amountMatch[1]);
      }
    }

    // 3. Parse from shareholding impact description
    if (results.shareholding?.impact) {
      const amountMatch = results.shareholding.impact.match(/(HK\$\s*[\d.,]+\s*(?:million|billion))/i);
      if (amountMatch) {
        return this.parseAmount(amountMatch[1]);
      }
    }

    return 0;
  }

  private parseAmount(amountStr: string): number {
    const cleanStr = amountStr.replace(/[HK$\s,]/g, '');
    const numMatch = cleanStr.match(/([\d.]+)/);
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[1]);
    if (cleanStr.toLowerCase().includes('billion')) {
      return num * 1000000000;
    } else if (cleanStr.toLowerCase().includes('million')) {
      return num * 1000000;
    }
    return num;
  }

  extractOwnershipPercentages(results: AnalysisResults): { 
    acquisitionPercentage: number; 
    remainingPercentage: number; 
  } {
    // Use shareholding data as primary source
    if (results.shareholding?.after) {
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

    // Fallback to parsing from text
    const description = results.structure?.rationale || results.shareholding?.impact || '';
    const ownershipMatch = description.match(/(?:purchase|acquire|buy)\s+(\d+)%/i);
    const acquisitionPercentage = ownershipMatch ? parseInt(ownershipMatch[1]) : 55;
    
    return {
      acquisitionPercentage,
      remainingPercentage: 100 - acquisitionPercentage
    };
  }

  extractEntityNames(results: AnalysisResults): {
    targetCompanyName: string;
    acquiringCompanyName: string;
  } {
    // Use corporate structure as primary source
    if (results.corporateStructure?.entities) {
      const targetEntity = results.corporateStructure.entities.find(e => e.type === 'target');
      const acquiringEntity = results.corporateStructure.entities.find(e => e.type === 'parent');
      
      if (targetEntity && acquiringEntity) {
        return {
          targetCompanyName: targetEntity.name,
          acquiringCompanyName: acquiringEntity.name
        };
      }
    }

    // Fallback to default names
    return {
      targetCompanyName: 'Target Company',
      acquiringCompanyName: 'Acquiring Company'
    };
  }
}

export const transactionDataValidator = new TransactionDataValidator();
