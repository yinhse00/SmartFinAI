
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionAnalysisRequest } from '../aiAnalysisService';

export interface InputValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Service for validating input data consistency
 */
export const inputValidationService = {
  /**
   * Validate that the input data is consistent
   */
  validateInputConsistency: (
    request: TransactionAnalysisRequest,
    results: AnalysisResults
  ): InputValidationResult => {
    const issues: string[] = [];
    let isValid = true;

    if (!request.description || request.description.length < 50) {
      issues.push('Transaction description is too short.');
      isValid = false;
    }

    if (!results.structure) {
      issues.push('No transaction structure was identified.');
      isValid = false;
    }

    return {
      isValid,
      issues
    };
  }
};
