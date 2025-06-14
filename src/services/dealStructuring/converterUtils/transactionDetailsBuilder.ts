
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEntityId } from './entityHelpers'; // Assuming entityNames contain companyName properties

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
) => {
  const beforeTargetId = generateEntityId('target', entityNames.targetCompanyName, 'before');
  const afterTargetId = generateEntityId('target', entityNames.targetCompanyName, 'after');
  const considerationNodeId = considerationAmount > 0 ? generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, 'after') : undefined;
  // Acquirer might not exist in 'before' explicitly as a buyer entity, but we use its name.
  // For linking steps to diagram nodes, use IDs that will exist.
  // If acquirer is a shareholder before, its ID would be 'before-stockholder-AcquirerName'
  // If it's a new entity for the transaction, it might not have a 'before' node.
  // Let's use a generic ID approach or link to a conceptual acquirer if no diagram node.
  // For consistency with how generateEntityId works, we'd need its type.
  // Let's assume a 'buyer' type conceptually for ID generation if it's the acquirer.
  const beforeAcquirerConceptualId = generateEntityId('buyer', entityNames.acquiringCompanyName, 'before'); // This ID might not map to an actual node in 'before' if acquirer isn't an entity there.
  const afterAcquirerId = generateEntityId('buyer', entityNames.acquiringCompanyName, 'after');


  const steps = [
    {
      id: 'step-1',
      title: 'Due Diligence & Negotiation',
      description: `${entityNames.acquiringCompanyName} conducts due diligence and negotiates with ${entityNames.targetCompanyName}.`,
      entities: [beforeTargetId, beforeAcquirerConceptualId].filter(Boolean) as string[] // beforeAcquirerConceptualId might not exist as a node.
    },
    {
      id: 'step-2',
      title: 'Transaction Structuring & Approvals',
      description: `Implementation of ${results.structure?.recommended || 'optimized transaction structure'} with regulatory approvals.`,
      entities: [beforeTargetId, afterTargetId].filter(Boolean) as string[]
    },
    {
      id: 'step-3',
      title: 'Completion & Settlement',
      description: `Transfer of ${results.dealEconomics?.targetPercentage ? results.dealEconomics.targetPercentage + '%' : 'control'} and ${considerationAmount > 0 ? `payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration` : 'completion of transaction'}.`,
      entities: [afterTargetId, considerationNodeId, afterAcquirerId].filter(Boolean) as string[]
    }
  ];
  return steps;
};
