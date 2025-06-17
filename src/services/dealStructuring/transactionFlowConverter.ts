
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, TransactionFlowSection } from '@/types/transactionFlow';
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { generateTransactionDescription } from './converterUtils/transactionDetailsBuilder';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';
import { EntityNames } from './converterUtils/entityHelpers';
import { extractBaseTransactionType, buildCleanTypeDisplay } from './converterUtils/transactionTypeExtractor';

export const convertAnalysisToTransactionFlow = (
  results: AnalysisResults,
  entityNames: EntityNames
): TransactionFlow => {
  console.log('Starting conversion of analysis results to transaction flow...');
  
  const considerationAmount = extractConsiderationAmount(results);
  console.log('Extracted consideration amount:', considerationAmount);

  // Extract clean transaction type
  const baseTransactionType = extractBaseTransactionType(results.transactionType || 'Transaction');
  const targetPercentage = results.dealEconomics?.targetPercentage;
  const cleanTransactionType = buildCleanTypeDisplay(baseTransactionType, targetPercentage);
  
  console.log('Original transaction type:', results.transactionType);
  console.log('Extracted base type:', baseTransactionType);
  console.log('Clean display type:', cleanTransactionType);

  // Create corporate structure map from results
  const corporateStructureMap = new Map();
  if (results.corporateStructure?.entities) {
    results.corporateStructure.entities.forEach(entity => {
      corporateStructureMap.set(entity.id, entity);
    });
  }

  // Build before and after structures with the corporate structure map
  const beforeStructure = buildBeforeStructure(results, entityNames, corporateStructureMap);
  const afterStructure = buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);

  console.log('Before structure entities:', beforeStructure.entities.length);
  console.log('After structure entities:', afterStructure.entities.length);

  // Generate transaction description using diagram context to avoid amount duplication
  const transactionDescription = generateTransactionDescription(results, considerationAmount, 'diagram');

  const transactionFlow: TransactionFlow = {
    before: beforeStructure,
    after: afterStructure,
    transactionSteps: [], // These would be populated from AI results if available
    transactionContext: {
      type: cleanTransactionType, // Use clean transaction type instead of raw AI response
      description: transactionDescription,
      amount: considerationAmount,
      currency: results.dealEconomics?.currency || 'HKD',
      targetName: entityNames.targetCompanyName,
      buyerName: entityNames.acquiringCompanyName,
      recommendedStructure: results.structure?.recommended,
      optimizationInsights: [],
      optimizationScore: results.confidence || 0.8
    }
  };

  console.log('Transaction flow conversion completed');
  console.log('Transaction context:', transactionFlow.transactionContext);
  
  return transactionFlow;
};

// Create the transactionFlowConverter object that was being imported
export const transactionFlowConverter = {
  convertToTransactionFlow: convertAnalysisToTransactionFlow
};
