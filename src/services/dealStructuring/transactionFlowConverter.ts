
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, TransactionFlowSection } from '@/types/transactionFlow';
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { generateTransactionDescription } from './converterUtils/transactionDetailsBuilder';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';

export const convertAnalysisToTransactionFlow = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string }
): TransactionFlow => {
  console.log('Starting conversion of analysis results to transaction flow...');
  
  const considerationAmount = extractConsiderationAmount(results);
  console.log('Extracted consideration amount:', considerationAmount);

  // Build before and after structures
  const beforeStructure = buildBeforeStructure(results, entityNames);
  const afterStructure = buildAfterStructure(results, entityNames, considerationAmount);

  console.log('Before structure entities:', beforeStructure.entities.length);
  console.log('After structure entities:', afterStructure.entities.length);

  // Generate transaction description using diagram context to avoid amount duplication
  const transactionDescription = generateTransactionDescription(results, considerationAmount, 'diagram');

  const transactionFlow: TransactionFlow = {
    before: beforeStructure,
    after: afterStructure,
    transactionSteps: [], // These would be populated from AI results if available
    transactionContext: {
      type: results.transactionType || 'Acquisition',
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
