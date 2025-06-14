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
  // Use the correct entity types for ID generation based on how they are created in builders
  // Target is always 'target'
  // Acquirer in 'before' could be 'parent' (if it's a group/listed co) or 'buyer'
  // Acquirer in 'after' is typically 'buyer' or 'parent' (if it's a group/listed co that bought)
  
  const beforeTargetId = generateEntityId('target', entityNames.targetCompanyName, 'before');
  // Acquirer's ID in 'before' state. Its type might be 'parent' if it's e.g. a Listed Co.
  // The entityNames.isAcquirerListed could help determine this, but relying on actual builder logic is better.
  // Let's assume the acquirer will be generated with type 'parent' if it's a significant entity like Listed Co, or 'buyer' if simpler.
  // For consistency, we need to know what type it will be assigned in beforeStructureBuilder.
  // It's complex to predict the exact type here. Let's use a likely type.
  // The actual acquirer entity in the 'before' diagram should be used.
  // For now, let's assume it's identified as 'parent' if it's a corporate acquirer.
  // This ID needs to match what's actually created in `beforeStructureBuilder`.
  // The `beforeStructureBuilder` uses `acquirerDiagramType` which can be 'parent' or 'buyer'.
  // To be safe, we should derive this type from `results.corporateStructure` for the acquiring company.
  let beforeAcquirerType: string = 'buyer'; // default
  const acquirerCorpEntity = results.corporateStructure?.entities.find(e => e.name === entityNames.acquiringCompanyName);
  if (acquirerCorpEntity) {
      if (acquirerCorpEntity.type === 'issuer' || acquirerCorpEntity.type === 'parent') {
          beforeAcquirerType = 'parent';
      }
  }
  const beforeAcquirerId = generateEntityId(beforeAcquirerType, entityNames.acquiringCompanyName, 'before');


  const afterTargetId = generateEntityId('target', entityNames.targetCompanyName, 'after');
  // Acquirer's ID in 'after' state.
  let afterAcquirerType: string = 'buyer'; // default
   if (acquirerCorpEntity) {
      if (acquirerCorpEntity.type === 'issuer' || acquirerCorpEntity.type === 'parent') {
          afterAcquirerType = 'parent';
      }
  }
  const afterAcquirerId = generateEntityId(afterAcquirerType, entityNames.acquiringCompanyName, 'after');
  
  const considerationNodeId = considerationAmount > 0 ? generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, 'after') : undefined;

  const steps = [
    {
      id: 'step-1',
      title: 'Due Diligence & Negotiation',
      description: `${entityNames.acquiringCompanyName} (Acquirer) conducts due diligence and negotiates with ${entityNames.targetCompanyName} (Target).`,
      // Ensure these IDs will actually exist in the 'before' diagram.
      entities: [beforeTargetId, beforeAcquirerId].filter(Boolean) as string[]
    },
    {
      id: 'step-2',
      title: 'Transaction Structuring & Approvals',
      description: `Parties agree on the acquisition of ${entityNames.targetCompanyName} by ${entityNames.acquiringCompanyName}. Implementation of ${results.structure?.recommended || 'optimized transaction structure'} and obtaining necessary regulatory approvals.`,
      // Refers to conceptual state change and entities involved overall
      entities: [beforeTargetId, afterTargetId, beforeAcquirerId, afterAcquirerId].filter(Boolean) as string[]
    },
    {
      id: 'step-3',
      title: 'Completion & Settlement',
      description: `Transfer of ${results.dealEconomics?.targetPercentage ? results.dealEconomics.targetPercentage + '%' : 'control'} of ${entityNames.targetCompanyName} to ${entityNames.acquiringCompanyName}. ${considerationAmount > 0 ? `Payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration by ${entityNames.acquiringCompanyName}.` : 'Completion of transaction terms.'}`,
      // These entities should exist in the 'after' diagram.
      entities: [afterTargetId, afterAcquirerId, considerationNodeId].filter(Boolean) as string[]
    }
  ];
  
  console.log("Generated Transaction Steps with Entity IDs:");
  console.log("Before Target ID:", beforeTargetId);
  console.log("Before Acquirer ID:", beforeAcquirerId, "(type used:", beforeAcquirerType +")");
  console.log("After Target ID:", afterTargetId);
  console.log("After Acquirer ID:", afterAcquirerId, "(type used:", afterAcquirerType +")");
  console.log("Consideration Node ID:", considerationNodeId);

  return steps;
};
