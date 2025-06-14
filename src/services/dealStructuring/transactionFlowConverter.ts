
import { AnalysisResults, AITransactionFlowSection } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionStep, TransactionEntity, AnyTransactionRelationship, TransactionFlowSection } from '@/types/transactionFlow';
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

// --- NEW MAPPING UTILITIES ---

const mapStringToTransactionEntityType = (typeStr?: string): TransactionEntity['type'] => {
    const validTypes: ReadonlyArray<TransactionEntity['type']> = [
        'shareholder', 'stockholder', 'target', 'buyer', 'parent', 'subsidiary', 
        'intermediary', 'investor', 'lender', 'spv', 'jv', 'escrow', 
        'consideration', 'debt', 'equity_instrument', 'other_stakeholder', 'newco'
    ];
    if (typeStr && (validTypes as string[]).includes(typeStr)) {
        return typeStr as TransactionEntity['type'];
    }
    console.warn(`Unknown AI entity type: "${typeStr}". Defaulting to 'other_stakeholder'.`);
    return 'other_stakeholder';
};

const mapStringToRelationshipType = (typeStr?: string): AnyTransactionRelationship['type'] => {
    const validTypes: ReadonlyArray<AnyTransactionRelationship['type']> = [
        'subsidiary', 'consideration', 'ownership', 'control', 'funding', 'security', 
        'merger_into', 'receives_from', 'provides_to', 'other'
    ];
    if (typeStr && (validTypes as string[]).includes(typeStr)) {
        return typeStr as AnyTransactionRelationship['type'];
    }
    console.warn(`Unknown AI relationship type: "${typeStr}". Defaulting to 'other'.`);
    return 'other';
};

const mapAIFlowSectionToTransactionFlowSection = (aiSection: AITransactionFlowSection): TransactionFlowSection => {
    const entities: TransactionEntity[] = aiSection.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: mapStringToTransactionEntityType(e.type),
        description: e.description,
        percentage: e.percentage,
        value: e.value,
        currency: (e as any).currency,
        metadata: { role: e.role }
    }));

    const relationships: AnyTransactionRelationship[] = aiSection.relationships.map(r => ({
        source: r.source,
        target: r.target,
        type: mapStringToRelationshipType(r.type),
        label: r.nature,
        percentage: r.percentage,
        value: r.value,
    } as AnyTransactionRelationship));

    return { entities, relationships };
};


export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to comprehensive transaction flow...');
    
    const entityNames = extractEntityNames(results);
    const considerationAmount = extractConsiderationAmount(results);

    // Prioritize the structured transactionFlow from the AI response if available
    if (results.transactionFlow?.before && results.transactionFlow.after) {
      console.log('Using direct transactionFlow from AI results to build diagram...');
      
      const before = mapAIFlowSectionToTransactionFlowSection(results.transactionFlow.before);
      const after = mapAIFlowSectionToTransactionFlowSection(results.transactionFlow.after);
      
      const rawTransactionSteps = generateEnhancedTransactionSteps(results, entityNames, considerationAmount);
      const transactionSteps: TransactionStep[] = rawTransactionSteps.map((step, index) => ({
        stepNumber: index + 1,
        title: step.title,
        description: step.description,
        actors: step.entities || [],
        type: 'operational',
        durationEstimate: step.durationEstimate || undefined,
        keyDocuments: step.keyDocuments || undefined,
        details: step.details || (step.criticalPath !== undefined ? { criticalPath: step.criticalPath } : undefined),
      }));

      const transactionFlow: TransactionFlow = {
        before,
        after,
        transactionSteps,
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
      console.log('Generated TransactionFlow from AI direct flow:', JSON.stringify(transactionFlow, null, 2));
      return transactionFlow;
    }

    // Fallback to original logic if AI-provided transactionFlow is not available
    console.warn('AI-provided transactionFlow not found or incomplete. Falling back to manual construction.');
    console.log('AnalysisResults Input:', JSON.stringify(results, null, 2));

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
