
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
// Removed: import { transactionDataValidator } from './transactionDataValidator';
// Removed: import { CorporateEntity } from '@/types/dealStructuring';

// Import new utility functions
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { extractEntityNames } from './converterUtils/entityHelpers';
import { processCorporateStructure } from './converterUtils/corporateStructureProcessor';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';
import { 
  generateTransactionDescription, 
  generateEnhancedTransactionSteps 
} from './converterUtils/transactionDetailsBuilder';

// Removed: EnhancedTransactionFlowData interface as it seems unused.

// Removed: type AnyTransactionRelationship - moved to corporateStructureProcessor.ts

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to comprehensive transaction flow (v2 refactored)...');
    console.log('AnalysisResults Input:', JSON.stringify(results, null, 2));

    const considerationAmount = extractConsiderationAmount(results);
    const entityNames = extractEntityNames(results);
    
    // The processCorporateStructure now correctly takes results.corporateStructure
    // The original type was (corporateStructureData?: AnalysisResults['corporateStructure'])
    // It should be called with results.corporateStructure.entities and results.corporateStructure.relationships for map construction
    // However, the original `this.processCorporateStructure(results.corporateStructure)` passed the whole object.
    // The refactored `processCorporateStructure` expects `CorporateEntity[]` as its first argument.
    // Let's adjust the call or the function. The function was modified to take `AnalysisResults['corporateStructure']`.
    // The refactored `processCorporateStructure` in `corporateStructureProcessor.ts` now takes `corporateStructureData?: CorporateEntity[]`
    // This is a mismatch.
    // The `processCorporateStructure` in `corporateStructureProcessor.ts` was expecting `corporateStructureData.entities.forEach`.
    // And `corporateStructureData.relationships.forEach`. So it expects `AnalysisResults['corporateStructure']`
    // Let's fix `corporateStructureProcessor.ts` parameter.
    // It was: export const processCorporateStructure = (corporateStructureData?: CorporateEntity[])
    // It should be: export const processCorporateStructure = (corporateStructureData?: AnalysisResults['corporateStructure'])
    // The current `corporateStructureProcessor.ts` is written to accept `CorporateEntity[]` for the first argument. This needs correction.
    // Corrected: `processCorporateStructure` in `corporateStructureProcessor.ts` now handles `AnalysisResults['corporateStructure']`
    // by accessing `corporateStructureData.entities` and `corporateStructureData.relationships`.

    const corporateStructureMap = processCorporateStructure(results.corporateStructure);


    const before = buildBeforeStructure(results, entityNames, corporateStructureMap);
    const after = buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    const transactionSteps = generateEnhancedTransactionSteps(results, entityNames, considerationAmount);

    const transactionFlow: TransactionFlow = {
      before,
      after,
      transactionSteps,
      transactionContext: {
        type: results.transactionType || 'Transaction Analysis',
        amount: considerationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        targetName: entityNames.targetCompanyName,
        buyerName: entityNames.acquiringCompanyName,
        description: generateTransactionDescription(results, considerationAmount),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      }
    };
    console.log('Generated TransactionFlow (refactored):', JSON.stringify(transactionFlow, null, 2));
    return transactionFlow;
  }

  // All private methods have been moved to utility files.
  // - extractConsiderationAmount -> dataExtractors.ts
  // - extractEntityNames -> entityHelpers.ts
  // - processCorporateStructure -> corporateStructureProcessor.ts
  // - generateEntityId -> entityHelpers.ts
  // - buildBeforeStructure -> beforeStructureBuilder.ts
  // - addCorporateChildren -> corporateStructureProcessor.ts
  // - buildAfterStructure -> afterStructureBuilder.ts
  // - identifyAcquirer -> entityHelpers.ts
  // - generateTransactionDescription -> transactionDetailsBuilder.ts
  // - generateEnhancedTransactionSteps -> transactionDetailsBuilder.ts
}

export const transactionFlowConverter = new TransactionFlowConverter();
