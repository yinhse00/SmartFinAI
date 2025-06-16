
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionStep } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
import { TransactionClassification } from './transactionTypeClassifier';

// Import existing utility functions
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { typeSpecificEntityExtractor } from './typeSpecificEntityExtractor';
import { processCorporateStructure } from './converterUtils/corporateStructureProcessor';

// Import new focused modules
import { TypeSpecificStructureBuilders } from './converters/typeSpecificStructureBuilders';
import { TypeSpecificStepGenerators } from './converters/typeSpecificStepGenerators';
import { TransactionContextBuilder } from './converters/transactionContextBuilder';
import { TransactionTypeInference } from './converters/transactionTypeInference';

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult,
    classification?: TransactionClassification
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to transaction flow with type awareness...');
    console.log('Classification:', classification);
    console.log('Results:', JSON.stringify(results, null, 2));

    // Determine transaction type from classification or fallback to analysis
    const transactionType = classification?.type || TransactionTypeInference.inferTransactionTypeFromResults(results);
    console.log('Processing as transaction type:', transactionType);

    // Extract entities based on transaction type
    const entityNames = typeSpecificEntityExtractor.extractEntitiesForType(results, transactionType);
    console.log('Extracted entities:', entityNames);

    // Get consideration/proceeds amount
    const considerationAmount = extractConsiderationAmount(results);
    
    const corporateStructureMap = processCorporateStructure(results.corporateStructure);

    // Build before structure
    const before = TypeSpecificStructureBuilders.buildTypeSpecificBeforeStructure(
      results, 
      entityNames, 
      corporateStructureMap, 
      transactionType
    );

    // Build after structure (may return single structure or multiple scenarios)
    const afterResult = TypeSpecificStructureBuilders.buildTypeSpecificAfterStructure(
      results, 
      entityNames, 
      corporateStructureMap, 
      considerationAmount, 
      transactionType
    );
    
    // Generate transaction steps based on type
    const rawTransactionSteps = TypeSpecificStepGenerators.generateTypeSpecificSteps(
      results, 
      entityNames, 
      considerationAmount, 
      transactionType
    );
    
    const transactionSteps: TransactionStep[] = rawTransactionSteps.map((step, index) => ({
      stepNumber: index + 1,
      title: step.title,
      description: step.description,
      actors: step.entities || [],
      type: step.type || 'operational',
      durationEstimate: step.durationEstimate,
      keyDocuments: step.keyDocuments,
      details: step.details || (step.criticalPath !== undefined ? { criticalPath: step.criticalPath } : undefined),
    }));

    // Build transaction context based on type
    const transactionContext = TransactionContextBuilder.buildTypeSpecificContext(
      results, 
      entityNames, 
      considerationAmount, 
      transactionType, 
      optimizationResult
    );

    const transactionFlow: TransactionFlow = {
      before,
      after: afterResult, // This could be a single structure or array of scenarios
      transactionSteps,
      transactionContext
    };

    console.log('Generated TransactionFlow:', JSON.stringify(transactionFlow, null, 2));
    return transactionFlow;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
