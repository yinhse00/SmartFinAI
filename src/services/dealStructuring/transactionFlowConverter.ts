
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, TransactionFlowSection } from '@/types/transactionFlow';
import { generateTransactionDescription } from './converterUtils/transactionDetailsBuilder';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';
import { EntityNames } from './converterUtils/entityHelpers';
import { cleanTransactionType, extractTransactionPercentage } from './converterUtils/transactionTypeCleaner';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { dataNormalizationService } from './dataNormalizationService';
import { inputAuthorityService, AuthoritativeData } from './inputAuthorityService';
import { considerationCalculator } from './considerationCalculator';

export const convertAnalysisToTransactionFlow = (
  results: AnalysisResults,
  entityNames: EntityNames,
  userInputs?: ExtractedUserInputs,
  authoritative?: AuthoritativeData
): TransactionFlow => {
  console.log('=== TRANSACTION FLOW CONVERTER WITH NORMALIZATION ===');
  console.log('Starting conversion with user inputs:', userInputs);
  
  // CRITICAL: Apply normalization to ensure data consistency
  const normalizedResults = dataNormalizationService.normalizeAnalysisResults(results, userInputs);
  
  // Use consideration calculator for proper calculation
  
  // Calculate proper consideration amount - prioritize calculated values
  let considerationAmount: number | undefined;
  
  // Priority 1: Authoritative amount (user specified)
  if (authoritative?.amount?.value) {
    considerationAmount = authoritative.amount.value;
    console.log('🔒 Using authoritative amount:', considerationAmount);
  }
  // Priority 2: User inputs with calculation if target valuation + percentage available
  else if (userInputs?.amount && userInputs?.acquisitionPercentage) {
    // Check if this looks like a calculation scenario (target valuation * percentage)
    const calculationResult = considerationCalculator.calculateConsideration(
      normalizedResults.executiveSummary?.narrative || 'transaction analysis',
      userInputs
    );
    
    if (calculationResult.calculationMethod === 'calculated' && calculationResult.isValid) {
      considerationAmount = calculationResult.considerationAmount;
      console.log('💰 Using calculated consideration:', considerationAmount, calculationResult.calculationDetails.calculationFormula);
    } else {
      considerationAmount = userInputs.amount;
      console.log('📊 Using direct user input amount:', considerationAmount);
    }
  }
  // Priority 3: Direct user amount
  else if (userInputs?.amount) {
    considerationAmount = userInputs.amount;
    console.log('📝 Using user input amount:', considerationAmount);
  }
  // Priority 4: Fallback to normalized results
  else {
    considerationAmount = normalizedResults.transactionFlow?.transactionContext?.amount ||
                         normalizedResults.dealEconomics?.purchasePrice ||
                         normalizedResults.valuation?.transactionValue?.amount;
    console.log('🤖 Using AI-generated amount as fallback:', considerationAmount);
  }
                             
  console.log('Using consideration amount:', considerationAmount);

  // Clean the transaction type from AI results
  const rawTransactionType = normalizedResults.transactionType || 'Transaction';
  const cleanedTransactionType = cleanTransactionType(rawTransactionType);
  const extractedPercentage = extractTransactionPercentage(rawTransactionType);
  
  console.log('Raw transaction type:', rawTransactionType);
  console.log('Cleaned transaction type:', cleanedTransactionType);
  console.log('Extracted percentage:', extractedPercentage);

  // Create corporate structure map from results
  const corporateStructureMap = new Map();
  if (normalizedResults.corporateStructure?.entities) {
    normalizedResults.corporateStructure.entities.forEach(entity => {
      corporateStructureMap.set(entity.id, entity);
    });
  }

  // Build before and after structures with the corporate structure map
  const beforeStructure = buildBeforeStructure(normalizedResults, entityNames, corporateStructureMap);
  const afterStructure = buildAfterStructure(normalizedResults, entityNames, corporateStructureMap, considerationAmount);

  console.log('Before structure entities:', beforeStructure.entities.length);
  console.log('After structure entities:', afterStructure.entities.length);
  console.log('After structure entities with amounts:', afterStructure.entities.filter(e => e.value).map(e => ({ id: e.id, name: e.name, value: e.value })));

  // Generate transaction description using diagram context to avoid amount duplication
  const transactionDescription = generateTransactionDescription(normalizedResults, considerationAmount, 'diagram');

  const transactionFlow: TransactionFlow = {
    before: beforeStructure,
    after: afterStructure,
    transactionSteps: [], // These would be populated from AI results if available
    transactionContext: {
      type: cleanedTransactionType, // Use cleaned transaction type
      description: transactionDescription,
      amount: considerationAmount, // CRITICAL: Use normalized amount
      currency: normalizedResults.dealEconomics?.currency || userInputs?.currency || 'HKD',
      targetName: entityNames.targetCompanyName,
      buyerName: entityNames.acquiringCompanyName,
      recommendedStructure: normalizedResults.structure?.recommended,
      optimizationInsights: [],
      optimizationScore: normalizedResults.confidence || 0.8
    }
  };

  console.log('Transaction flow conversion completed with normalized data');
  console.log('Final transaction context amount:', transactionFlow.transactionContext.amount);
  console.log('Transaction context:', transactionFlow.transactionContext);
  
  return transactionFlow;
};

// Create the transactionFlowConverter object that was being imported
export const transactionFlowConverter = {
  convertToTransactionFlow: convertAnalysisToTransactionFlow
};
