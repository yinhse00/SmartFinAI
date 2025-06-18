
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, TransactionFlowSection } from '@/types/transactionFlow';
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { generateTransactionDescription } from './converterUtils/transactionDetailsBuilder';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';
import { EntityNames } from './converterUtils/entityHelpers';
import { cleanTransactionType, extractTransactionPercentage } from './converterUtils/transactionTypeCleaner';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { dataConsistencyService } from './dataConsistencyService';

export const convertAnalysisToTransactionFlow = (
  results: AnalysisResults,
  entityNames: EntityNames,
  userInputs?: ExtractedUserInputs
): TransactionFlow => {
  console.log('=== DEBUGGING convertAnalysisToTransactionFlow ===');
  console.log('Starting conversion of analysis results to transaction flow...');
  console.log('UserInputs received in converter:', userInputs);
  
  // Use data consistency service to get authoritative transaction data
  const consistentData = dataConsistencyService.extractConsistentData(results, userInputs);
  console.log('Consistent data extracted in converter:', consistentData);
  console.log('Consideration amount source:', consistentData.source);
  console.log('Final consideration amount:', consistentData.considerationAmount);

  // Clean the transaction type from AI results
  const rawTransactionType = results.transactionType || 'Transaction';
  const cleanedTransactionType = cleanTransactionType(rawTransactionType);
  const extractedPercentage = extractTransactionPercentage(rawTransactionType);
  
  console.log('Raw transaction type:', rawTransactionType);
  console.log('Cleaned transaction type:', cleanedTransactionType);
  console.log('Extracted percentage:', extractedPercentage);

  // Create corporate structure map from results
  const corporateStructureMap = new Map();
  if (results.corporateStructure?.entities) {
    results.corporateStructure.entities.forEach(entity => {
      corporateStructureMap.set(entity.id, entity);
    });
  }

  // Build before and after structures with the corporate structure map
  const beforeStructure = buildBeforeStructure(results, entityNames, corporateStructureMap);
  const afterStructure = buildAfterStructure(results, entityNames, corporateStructureMap, consistentData.considerationAmount);

  console.log('Before structure entities:', beforeStructure.entities.length);
  console.log('After structure entities:', afterStructure.entities.length);
  console.log('After structure entities with amounts:', afterStructure.entities.filter(e => e.value).map(e => ({ id: e.id, name: e.name, value: e.value })));

  // Generate transaction description using diagram context to avoid amount duplication
  const transactionDescription = generateTransactionDescription(results, consistentData.considerationAmount, 'diagram');

  const transactionFlow: TransactionFlow = {
    before: beforeStructure,
    after: afterStructure,
    transactionSteps: [], // These would be populated from AI results if available
    transactionContext: {
      type: cleanedTransactionType, // Use cleaned transaction type
      description: transactionDescription,
      amount: consistentData.considerationAmount,
      currency: consistentData.currency,
      targetName: entityNames.targetCompanyName,
      buyerName: entityNames.acquiringCompanyName,
      recommendedStructure: results.structure?.recommended,
      optimizationInsights: [],
      optimizationScore: results.confidence || 0.8
    }
  };

  console.log('Transaction flow conversion completed');
  console.log('Transaction context amount:', transactionFlow.transactionContext.amount);
  console.log('Transaction context currency:', transactionFlow.transactionContext.currency);
  console.log('Transaction context:', transactionFlow.transactionContext);
  
  return transactionFlow;
};

// Create the transactionFlowConverter object that was being imported
export const transactionFlowConverter = {
  convertToTransactionFlow: convertAnalysisToTransactionFlow
};
