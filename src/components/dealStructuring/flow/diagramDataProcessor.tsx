
import { Node, Edge } from '@xyflow/react';
import { TransactionFlow } from '@/types/transactionFlow';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

export const processTransactionFlowForDiagram = (
  transactionFlow: TransactionFlow,
  userInputs?: ExtractedUserInputs
): { nodes: Node[]; edges: Edge[] } => {
  console.log('=== PROCESSING TRANSACTION FLOW FOR DIAGRAM ===');
  console.log('UserInputs received in processor:', userInputs);
  
  const tc = transactionFlow.transactionContext;
  console.log('Transaction context received:', tc);
  
  // CRITICAL: Validate transaction context amount against user input
  let validatedAmount = tc.amount;
  let validatedCurrency = tc.currency;
  
  if (userInputs?.amount && tc.amount !== userInputs.amount) {
    console.error(`🚨 DIAGRAM PROCESSOR CORRUPTION DETECTED: tc.amount ${tc.amount} !== user input ${userInputs.amount}`);
    validatedAmount = userInputs.amount;
    console.log(`✅ Using user input amount: ${validatedAmount}`);
  }
  
  if (userInputs?.currency && tc.currency !== userInputs.currency) {
    console.warn(`Currency mismatch: tc.currency ${tc.currency} !== user input ${userInputs.currency}`);
    validatedCurrency = userInputs.currency;
    console.log(`✅ Using user input currency: ${validatedCurrency}`);
  }

  const nodes: Node[] = [
    // Transaction Overview Node
    {
      id: 'transaction-overview',
      type: 'default',
      position: { x: 50, y: 50 },
      data: {
        label: (
          <div className="text-center p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {tc.type || 'Transaction'}
            </h3>
            <div className="text-sm text-gray-600 mb-2">
              {tc.targetName} ← {tc.buyerName}
            </div>
            {validatedAmount > 0 && (
              <div className="text-xs font-medium text-purple-600">
                {(() => {
                  console.log(`Diagram Processor: Formatting amount ${validatedAmount} for ${validatedCurrency}`);
                  
                  // CRITICAL: Additional validation at display time
                  if (userInputs?.amount && validatedAmount !== userInputs.amount) {
                    console.error(`🚨 DISPLAY CORRUPTION: Validated amount ${validatedAmount} !== user input ${userInputs.amount}`);
                    const finalAmount = userInputs.amount;
                    const finalCurrency = userInputs.currency || validatedCurrency;
                    console.log(`✅ Final display correction: using ${finalCurrency} ${(finalAmount / 1000000).toFixed(0)}M`);
                    return `${finalCurrency} ${(finalAmount / 1000000).toFixed(0)}M`;
                  }
                  
                  console.log(`✅ Display validation passed: ${validatedCurrency} ${(validatedAmount / 1000000).toFixed(0)}M`);
                  return `${validatedCurrency} ${(validatedAmount / 1000000).toFixed(0)}M`;
                })()}
              </div>
            )}
            {tc.description && (
              <div className="text-xs text-gray-500 mt-2 max-w-xs">
                {tc.description.length > 100 
                  ? `${tc.description.substring(0, 100)}...` 
                  : tc.description
                }
              </div>
            )}
          </div>
        )
      },
      style: {
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        width: 280,
        fontSize: '12px'
      }
    }
  ];

  const edges: Edge[] = [];

  // Process before structure entities
  transactionFlow.before.entities.forEach((entity, index) => {
    nodes.push({
      id: `before-${entity.id}`,
      type: 'default',
      position: { 
        x: 50 + (index % 3) * 200, 
        y: 200 + Math.floor(index / 3) * 120 
      },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{entity.name}</div>
            <div className="text-xs text-gray-500">{entity.type}</div>
            {entity.percentage && (
              <div className="text-xs text-blue-600">{entity.percentage.toFixed(1)}%</div>
            )}
            {entity.value && entity.value > 0 && (
              <div className="text-xs text-green-600">
                {validatedCurrency} {(entity.value / 1000000).toFixed(0)}M
              </div>
            )}
          </div>
        )
      },
      style: {
        background: entity.type === 'target' ? '#fef3c7' : '#f3f4f6',
        border: entity.type === 'target' ? '1px solid #f59e0b' : '1px solid #d1d5db',
        borderRadius: '8px',
        width: 160,
        fontSize: '11px'
      }
    });
  });

  // Process after structure entities with validated amounts
  transactionFlow.after.entities.forEach((entity, index) => {
    let entityValue = entity.value;
    
    // CRITICAL: Validate entity values against user input
    if (userInputs?.amount && entity.value && entity.value !== userInputs.amount && entity.type === 'consideration') {
      console.error(`🚨 ENTITY VALUE CORRUPTION: Entity ${entity.name} has value ${entity.value}, expected ${userInputs.amount}`);
      entityValue = userInputs.amount;
      console.log(`✅ Corrected entity ${entity.name} value to ${entityValue}`);
    }
    
    nodes.push({
      id: `after-${entity.id}`,
      type: 'default',
      position: { 
        x: 400 + (index % 3) * 200, 
        y: 200 + Math.floor(index / 3) * 120 
      },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{entity.name}</div>
            <div className="text-xs text-gray-500">{entity.type}</div>
            {entity.percentage && (
              <div className="text-xs text-blue-600">{entity.percentage.toFixed(1)}%</div>
            )}
            {entityValue && entityValue > 0 && (
              <div className="text-xs text-green-600">
                {validatedCurrency} {(entityValue / 1000000).toFixed(0)}M
              </div>
            )}
          </div>
        )
      },
      style: {
        background: entity.type === 'target' ? '#fef3c7' : 
                   entity.type === 'consideration' ? '#f0fdf4' : '#f3f4f6',
        border: entity.type === 'target' ? '1px solid #f59e0b' : 
               entity.type === 'consideration' ? '1px solid #16a34a' : '1px solid #d1d5db',
        borderRadius: '8px',
        width: 160,
        fontSize: '11px'
      }
    });
  });

  console.log('=== DIAGRAM PROCESSING COMPLETE ===');
  console.log('Final validated amount:', validatedAmount);
  console.log('Final validated currency:', validatedCurrency);
  console.log('Total nodes created:', nodes.length);

  return { nodes, edges };
};
