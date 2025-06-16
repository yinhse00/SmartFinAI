
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionAnalysisRequest } from '../aiAnalysisService';
import { TransactionClassification } from '../transactionTypeClassifier';

export interface ReconciliationResult {
  reconciledResults: AnalysisResults;
  changesApplied: string[];
  reconciliationApplied: boolean;
  originalIssues: string[];
}

/**
 * Service for reconciling data inconsistencies with transaction type-specific logic
 */
export const dataReconciliationService = {
  /**
   * Reconcile data with transaction type-specific logic
   */
  reconcileDataInconsistencies: (
    request: TransactionAnalysisRequest,
    results: AnalysisResults,
    classification: TransactionClassification
  ): ReconciliationResult => {
    let reconciledResults = { ...results };
    let changesApplied: string[] = [];
    let reconciliationApplied = false;

    // Type-specific reconciliation
    if (classification.type === 'CAPITAL_RAISING') {
      // Ensure single-company structure
      if (reconciledResults.corporateStructure?.entities) {
        const issuingEntity = reconciledResults.corporateStructure.entities.find(e => 
          e.type === 'issuer' || e.name === classification.issuingCompany
        );
        
        if (!issuingEntity && classification.issuingCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'issuer-1',
            name: classification.issuingCompany,
            type: 'issuer',
            description: 'Issuing company for capital raising'
          });
          changesApplied.push('Added issuing company entity');
          reconciliationApplied = true;
        }
      }
    } else if (classification.type === 'M&A') {
      // Ensure acquirer-target structure
      if (reconciledResults.corporateStructure?.entities) {
        const hasAcquirer = reconciledResults.corporateStructure.entities.some(e => 
          e.type === 'issuer' || e.type === 'parent'
        );
        const hasTarget = reconciledResults.corporateStructure.entities.some(e => e.type === 'target');
        
        if (!hasAcquirer && classification.acquiringCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'acquirer-1',
            name: classification.acquiringCompany,
            type: 'issuer',
            description: 'Acquiring company in M&A transaction'
          });
          changesApplied.push('Added acquiring company entity');
          reconciliationApplied = true;
        }
        
        if (!hasTarget && classification.targetCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'target-1',
            name: classification.targetCompany,
            type: 'target',
            description: 'Target company in M&A transaction'
          });
          changesApplied.push('Added target company entity');
          reconciliationApplied = true;
        }
      }
    }

    return {
      reconciledResults,
      changesApplied,
      reconciliationApplied,
      originalIssues: reconciliationApplied ? ['Missing type-specific entities'] : []
    };
  }
};
