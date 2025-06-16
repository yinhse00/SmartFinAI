import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionStep } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';

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

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to comprehensive transaction flow (v2 refactored)...');
    console.log('AnalysisResults Input:', JSON.stringify(results, null, 2));

    const considerationAmount = extractConsiderationAmount(results);
    const entityNames = extractEntityNames(results);
    
    const corporateStructureMap = processCorporateStructure(results.corporateStructure);


    const before = buildBeforeStructure(results, entityNames, corporateStructureMap);
    const after = buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    
    // Assuming generateEnhancedTransactionSteps returns an array of objects like:
    // { id: string, title: string, description: string, entities: string[], criticalPath?: boolean }
    // We need to map this to TransactionStep[]
    const rawTransactionSteps = generateEnhancedTransactionSteps(results, entityNames, considerationAmount);
    
    const transactionSteps: TransactionStep[] = rawTransactionSteps.map((step, index) => ({
      stepNumber: index + 1, // Assign step number
      title: step.title,
      description: step.description,
      actors: step.entities || [], // Map entities to actors
      type: 'operational', // Default type, can be refined if AI provides more detail
      durationEstimate: step.durationEstimate || undefined, // Optional
      keyDocuments: step.keyDocuments || undefined, // Optional
      details: step.details || (step.criticalPath !== undefined ? { criticalPath: step.criticalPath } : undefined), // Keep other details like criticalPath
    }));


    const transactionFlow: TransactionFlow = {
      before,
      after,
      transactionSteps, // Use the mapped steps
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
