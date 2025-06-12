
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedInputData, inputDataExtractor } from './inputDataExtractor';
import { inputOutputValidator } from './inputOutputValidator';
import { TransactionAnalysisRequest } from './aiAnalysisService';

export interface ReconciliationResult {
  originalResults: AnalysisResults;
  correctedResults: AnalysisResults;
  inputData: ExtractedInputData;
  validation: {
    isValid: boolean;
    confidence: number;
    mismatches: any[];
    suggestions: string[];
  };
  reconciliationApplied: boolean;
}

export class DataReconciliationService {
  reconcileAnalysisWithInput(
    request: TransactionAnalysisRequest,
    analysisResults: AnalysisResults
  ): ReconciliationResult {
    // Extract structured data from user input
    const inputData = inputDataExtractor.extractStructuredData(request);
    
    // Validate analysis results against input
    const validation = inputOutputValidator.validateAnalysisResults(inputData, analysisResults);
    
    // Generate corrections if needed
    const corrections = inputOutputValidator.generateCorrectedData(
      inputData, 
      analysisResults, 
      validation
    );

    // Apply corrections to create reconciled results
    const correctedResults: AnalysisResults = {
      ...analysisResults,
      ...corrections
    };

    // Apply input-based corrections for missing or generic data
    if (inputData.targetCompanyName && 
        (!correctedResults.corporateStructure?.entities || 
         correctedResults.corporateStructure.entities.some(e => e.name === 'Target Company'))) {
      
      if (correctedResults.corporateStructure) {
        correctedResults.corporateStructure = {
          ...correctedResults.corporateStructure,
          entities: correctedResults.corporateStructure.entities.map(entity => 
            entity.type === 'target' 
              ? { ...entity, name: inputData.targetCompanyName! }
              : entity
          )
        };
      }
    }

    if (inputData.acquiringCompanyName && 
        (!correctedResults.corporateStructure?.entities || 
         correctedResults.corporateStructure.entities.some(e => e.name === 'Acquiring Company'))) {
      
      if (correctedResults.corporateStructure) {
        correctedResults.corporateStructure = {
          ...correctedResults.corporateStructure,
          entities: correctedResults.corporateStructure.entities.map(entity => 
            entity.type === 'parent' 
              ? { ...entity, name: inputData.acquiringCompanyName! }
              : entity
          )
        };
      }
    }

    const reconciliationApplied = Object.keys(corrections).length > 0 || 
                                  validation.mismatches.length > 0;

    return {
      originalResults: analysisResults,
      correctedResults,
      inputData,
      validation,
      reconciliationApplied
    };
  }

  shouldApplyReconciliation(validation: ReconciliationResult['validation']): boolean {
    return !validation.isValid || validation.confidence < 0.8;
  }

  getReconciliationSummary(result: ReconciliationResult): string {
    if (!result.reconciliationApplied) {
      return 'Analysis results match the input data accurately.';
    }

    const corrections = result.validation.mismatches.filter(m => m.severity === 'error');
    const warnings = result.validation.mismatches.filter(m => m.severity === 'warning');

    let summary = 'Data reconciliation applied: ';
    
    if (corrections.length > 0) {
      summary += `${corrections.length} correction${corrections.length > 1 ? 's' : ''} made`;
    }
    
    if (warnings.length > 0) {
      if (corrections.length > 0) summary += ', ';
      summary += `${warnings.length} warning${warnings.length > 1 ? 's' : ''} noted`;
    }

    return summary + '.';
  }
}

export const dataReconciliationService = new DataReconciliationService();
