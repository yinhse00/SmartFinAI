import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEntityId } from './entityHelpers';

// Define the structure of step data processed by this builder
interface IntermediateStepData {
  id: string;
  title: string;
  description: string;
  entities: string[];
  criticalPath?: boolean;    // Expected from AI (results.transactionFlow.majorTransactionSteps)
  durationEstimate?: string; // Optional, for TransactionStep compatibility
  keyDocuments?: string[];   // Optional, for TransactionStep compatibility
  details?: Record<string, any>; // Optional, for TransactionStep compatibility
}

export const generateTransactionDescription = (results: AnalysisResults, considerationAmount: number): string => {
  const transactionType = results.transactionType || 'Transaction';
  const currency = results.dealEconomics?.currency || 'HKD';
  const targetPercentage = results.dealEconomics?.targetPercentage;

  let amountText = '';
  if (considerationAmount > 0) {
    if (considerationAmount >= 1000000000) {
      amountText = `${currency} ${(considerationAmount / 1000000000).toFixed(1)}B`;
    } else if (considerationAmount >= 1000000) {
      amountText = `${currency} ${(considerationAmount / 1000000).toFixed(0)}M`;
    } else {
      amountText = `${currency} ${(considerationAmount / 1000).toFixed(0)}K`;
    }
  }

  const percentageText = targetPercentage ? `${targetPercentage}% acquisition` : 'acquisition';
  const structure = results.structure?.recommended || 'Standard Structure';

  return `${transactionType} ${amountText} ${percentageText} via ${structure}`.trim();
};

export const generateEnhancedTransactionSteps = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  considerationAmount: number
): IntermediateStepData[] => {
  const beforeTargetId = generateEntityId('target', entityNames.targetCompanyName, 'before');
  let beforeAcquirerType: string = 'buyer';
  const acquirerCorpEntityBefore = results.corporateStructure?.entities.find(e => e.name === entityNames.acquiringCompanyName);
  if (acquirerCorpEntityBefore) {
    if (acquirerCorpEntityBefore.type === 'issuer' || acquirerCorpEntityBefore.type === 'parent') {
      beforeAcquirerType = 'parent';
    }
  }
  const beforeAcquirerId = generateEntityId(beforeAcquirerType, entityNames.acquiringCompanyName, 'before');

  const afterTargetId = generateEntityId('target', entityNames.targetCompanyName, 'after');
  let afterAcquirerType: string = 'buyer';
  const acquirerCorpEntityAfter = results.corporateStructure?.entities.find(e => e.name === entityNames.acquiringCompanyName);
   if (acquirerCorpEntityAfter) {
      if (acquirerCorpEntityAfter.type === 'issuer' || acquirerCorpEntityAfter.type === 'parent') {
          afterAcquirerType = 'parent';
      }
  }
  const afterAcquirerId = generateEntityId(afterAcquirerType, entityNames.acquiringCompanyName, 'after');
  
  const considerationNodeId = considerationAmount > 0 ? generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, 'after') : undefined;

  // Prioritize steps from AI analysis results if available
  if (results.transactionFlow?.majorTransactionSteps && results.transactionFlow.majorTransactionSteps.length > 0) {
    console.log("Using majorTransactionSteps from AI results for enhanced transaction steps.");
    return results.transactionFlow.majorTransactionSteps.map(aiStep => ({
      id: aiStep.id,
      title: aiStep.title,
      description: aiStep.description,
      entities: aiStep.entities || [], // Ensure entities is always an array
      criticalPath: aiStep.criticalPath,
      // durationEstimate, keyDocuments, details would be undefined here
      // unless AI starts providing them directly in majorTransactionSteps
      // or they are derived/mapped from other AI response fields.
      // For now, they remain undefined if not in aiStep.
    }));
  }
  
  // Fallback to default generated steps if AI doesn't provide them
  console.log("Falling back to default generated enhanced transaction steps.");
  const defaultSteps: IntermediateStepData[] = [
    {
      id: 'step-1',
      title: 'Due Diligence & Negotiation',
      description: `${entityNames.acquiringCompanyName} (Acquirer) conducts due diligence and negotiates with ${entityNames.targetCompanyName} (Target).`,
      entities: [beforeTargetId, beforeAcquirerId].filter(Boolean) as string[],
      criticalPath: true, // Default value
      durationEstimate: undefined,
      keyDocuments: undefined,
      details: undefined,
    },
    {
      id: 'step-2',
      title: 'Transaction Structuring & Approvals',
      description: `Parties agree on the acquisition of ${entityNames.targetCompanyName} by ${entityNames.acquiringCompanyName}. Implementation of ${results.structure?.recommended || 'optimized transaction structure'} and obtaining necessary regulatory approvals.`,
      entities: [beforeTargetId, afterTargetId, beforeAcquirerId, afterAcquirerId].filter(Boolean) as string[],
      criticalPath: true, // Default value
      durationEstimate: undefined,
      keyDocuments: undefined,
      details: undefined,
    },
    {
      id: 'step-3',
      title: 'Completion & Settlement',
      description: `Transfer of ${results.dealEconomics?.targetPercentage ? results.dealEconomics.targetPercentage + '%' : 'control'} of ${entityNames.targetCompanyName} to ${entityNames.acquiringCompanyName}. ${considerationAmount > 0 ? `Payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration by ${entityNames.acquiringCompanyName}.` : 'Completion of transaction terms.'}`,
      entities: [afterTargetId, afterAcquirerId, considerationNodeId].filter(Boolean) as string[],
      criticalPath: true, // Default value
      durationEstimate: undefined,
      keyDocuments: undefined,
      details: undefined,
    }
  ];
  
  console.log("Generated Transaction Steps with Entity IDs:");
  console.log("Before Target ID:", beforeTargetId);
  console.log("Before Acquirer ID:", beforeAcquirerId, "(type used:", beforeAcquirerType +")");
  console.log("After Target ID:", afterTargetId);
  console.log("After Acquirer ID:", afterAcquirerId, "(type used:", afterAcquirerType +")");
  console.log("Consideration Node ID:", considerationNodeId);

  return defaultSteps;
};
