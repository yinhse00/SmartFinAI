
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedInputData } from './inputDataExtractor';

export interface ValidationResult {
  isValid: boolean;
  mismatches: Array<{
    field: string;
    expected: any;
    actual: any;
    severity: 'error' | 'warning';
  }>;
  confidence: number;
  suggestions: string[];
}

export class InputOutputValidator {
  validateAnalysisResults(
    inputData: ExtractedInputData,
    analysisResults: AnalysisResults
  ): ValidationResult {
    const mismatches: ValidationResult['mismatches'] = [];
    const suggestions: string[] = [];

    // Validate consideration amount
    if (inputData.considerationAmount && analysisResults.costs?.total) {
      const tolerance = inputData.considerationAmount * 0.1; // 10% tolerance
      const diff = Math.abs(inputData.considerationAmount - analysisResults.costs.total);
      
      if (diff > tolerance) {
        mismatches.push({
          field: 'consideration amount',
          expected: inputData.considerationAmount,
          actual: analysisResults.costs.total,
          severity: 'error'
        });
        suggestions.push('The transaction amount in the analysis does not match the input description');
      }
    }

    // Validate acquisition percentage
    if (inputData.acquisitionPercentage && analysisResults.shareholding?.after) {
      const acquirerData = analysisResults.shareholding.after.find(holder => 
        holder.name.toLowerCase().includes('acquir') || 
        holder.name.toLowerCase().includes('buyer') ||
        holder.name.toLowerCase().includes('purchas')
      );

      if (acquirerData) {
        const diff = Math.abs(inputData.acquisitionPercentage - acquirerData.percentage);
        if (diff > 2) { // 2% tolerance
          mismatches.push({
            field: 'acquisition percentage',
            expected: inputData.acquisitionPercentage,
            actual: acquirerData.percentage,
            severity: 'error'
          });
          suggestions.push('The acquisition percentage in the shareholding impact does not match the input');
        }
      } else {
        mismatches.push({
          field: 'acquisition percentage',
          expected: inputData.acquisitionPercentage,
          actual: 'not found',
          severity: 'warning'
        });
        suggestions.push('Could not identify the acquiring party in the shareholding structure');
      }
    }

    // Validate company names
    if (inputData.targetCompanyName && analysisResults.corporateStructure?.entities) {
      const targetEntity = analysisResults.corporateStructure.entities.find(e => 
        e.type === 'target' && e.name.toLowerCase().includes(inputData.targetCompanyName!.toLowerCase())
      );

      if (!targetEntity) {
        mismatches.push({
          field: 'target company name',
          expected: inputData.targetCompanyName,
          actual: 'generic name used',
          severity: 'warning'
        });
        suggestions.push('The target company name in the analysis is generic rather than the specific name from input');
      }
    }

    // Validate transaction type
    if (inputData.transactionType && analysisResults.transactionType) {
      if (!analysisResults.transactionType.toLowerCase().includes(inputData.transactionType.toLowerCase())) {
        mismatches.push({
          field: 'transaction type',
          expected: inputData.transactionType,
          actual: analysisResults.transactionType,
          severity: 'warning'
        });
      }
    }

    // Calculate overall confidence
    const errorCount = mismatches.filter(m => m.severity === 'error').length;
    const warningCount = mismatches.filter(m => m.severity === 'warning').length;
    const totalChecks = 4; // Number of validation checks performed
    
    const confidence = Math.max(0, (totalChecks - errorCount * 1 - warningCount * 0.5) / totalChecks);
    const isValid = errorCount === 0 && confidence > 0.7;

    return {
      isValid,
      mismatches,
      confidence,
      suggestions
    };
  }

  generateCorrectedData(
    inputData: ExtractedInputData,
    analysisResults: AnalysisResults,
    validation: ValidationResult
  ): Partial<AnalysisResults> {
    const corrections: Partial<AnalysisResults> = {};

    // Apply input data corrections where validation failed
    for (const mismatch of validation.mismatches) {
      if (mismatch.severity === 'error') {
        switch (mismatch.field) {
          case 'consideration amount':
            if (inputData.considerationAmount) {
              corrections.costs = {
                ...analysisResults.costs,
                total: inputData.considerationAmount
              };
            }
            break;

          case 'acquisition percentage':
            if (inputData.acquisitionPercentage && analysisResults.shareholding) {
              const correctedAfter = analysisResults.shareholding.after.map(holder => {
                if (holder.name.toLowerCase().includes('acquir') || 
                    holder.name.toLowerCase().includes('buyer')) {
                  return { ...holder, percentage: inputData.acquisitionPercentage! };
                }
                return holder;
              });

              corrections.shareholding = {
                ...analysisResults.shareholding,
                after: correctedAfter
              };
            }
            break;
        }
      }
    }

    return corrections;
  }
}

export const inputOutputValidator = new InputOutputValidator();
