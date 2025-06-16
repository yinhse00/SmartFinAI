
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionStep } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
import { TransactionClassification } from './transactionTypeClassifier';

// Import existing utility functions
import { extractConsiderationAmount } from './converterUtils/dataExtractors';
import { typeSpecificEntityExtractor } from './typeSpecificEntityExtractor';
import { processCorporateStructure } from './converterUtils/corporateStructureProcessor';
import { buildBeforeStructure } from './converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from './converterUtils/afterStructureBuilder';
import { 
  generateTransactionDescription, 
  generateEnhancedTransactionSteps 
} from './converterUtils/transactionDetailsBuilder';

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
    const transactionType = classification?.type || this.inferTransactionTypeFromResults(results);
    console.log('Processing as transaction type:', transactionType);

    // Extract entities based on transaction type
    const entityNames = typeSpecificEntityExtractor.extractEntitiesForType(results, transactionType);
    console.log('Extracted entities:', entityNames);

    // Get consideration/proceeds amount
    const considerationAmount = extractConsiderationAmount(results);
    
    const corporateStructureMap = processCorporateStructure(results.corporateStructure);

    // Build before/after structures based on transaction type
    const before = this.buildTypeSpecificBeforeStructure(results, entityNames, corporateStructureMap, transactionType);
    const after = this.buildTypeSpecificAfterStructure(results, entityNames, corporateStructureMap, considerationAmount, transactionType);
    
    // Generate transaction steps based on type
    const rawTransactionSteps = this.generateTypeSpecificSteps(results, entityNames, considerationAmount, transactionType);
    
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
    const transactionContext = this.buildTypeSpecificContext(
      results, 
      entityNames, 
      considerationAmount, 
      transactionType, 
      optimizationResult
    );

    const transactionFlow: TransactionFlow = {
      before,
      after,
      transactionSteps,
      transactionContext
    };

    console.log('Generated TransactionFlow:', JSON.stringify(transactionFlow, null, 2));
    return transactionFlow;
  }

  private inferTransactionTypeFromResults(results: AnalysisResults): 'M&A' | 'CAPITAL_RAISING' | 'HYBRID' {
    const transactionType = results.transactionType?.toLowerCase() || '';
    
    if (transactionType.includes('rights issue') || transactionType.includes('open offer') || transactionType.includes('capital raising')) {
      return 'CAPITAL_RAISING';
    }
    
    if (transactionType.includes('acquire') || transactionType.includes('merger') || transactionType.includes('takeover')) {
      return 'M&A';
    }
    
    return 'M&A'; // Default fallback
  }

  private buildTypeSpecificBeforeStructure(results: AnalysisResults, entityNames: any, corporateStructureMap: any, transactionType: string) {
    if (transactionType === 'CAPITAL_RAISING') {
      // For capital raising, before structure shows current shareholders of issuing company
      return buildBeforeStructure(results, {
        targetCompanyName: entityNames.issuingCompanyName,
        acquiringCompanyName: entityNames.issuingCompanyName
      }, corporateStructureMap);
    } else {
      // For M&A, use standard before structure
      return buildBeforeStructure(results, entityNames, corporateStructureMap);
    }
  }

  private buildTypeSpecificAfterStructure(results: AnalysisResults, entityNames: any, corporateStructureMap: any, considerationAmount: number, transactionType: string) {
    if (transactionType === 'CAPITAL_RAISING') {
      // For capital raising, after structure shows diluted shareholding
      return buildAfterStructure(results, {
        targetCompanyName: entityNames.issuingCompanyName,
        acquiringCompanyName: entityNames.issuingCompanyName
      }, corporateStructureMap, considerationAmount);
    } else {
      // For M&A, use standard after structure
      return buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    }
  }

  private generateTypeSpecificSteps(results: AnalysisResults, entityNames: any, considerationAmount: number, transactionType: string) {
    if (transactionType === 'CAPITAL_RAISING') {
      return this.generateCapitalRaisingSteps(results, entityNames, considerationAmount);
    } else if (transactionType === 'HYBRID') {
      return this.generateHybridSteps(results, entityNames, considerationAmount);
    } else {
      // M&A steps
      return generateEnhancedTransactionSteps(results, entityNames, considerationAmount);
    }
  }

  private generateCapitalRaisingSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
    const issuingCompany = entityNames.issuingCompanyName || entityNames.primaryCompanyName;
    const currency = results.dealEconomics?.currency || 'HKD';
    const proceedsText = considerationAmount > 0 ? 
      `${currency} ${(considerationAmount / 1000000).toFixed(0)}M` : 'capital';

    return [
      {
        id: 'step-1',
        title: 'Announcement & Record Date',
        description: `${issuingCompany} announces ${results.structure?.recommended || 'capital raising'} to raise ${proceedsText}. Record date set for determining shareholders' entitlements.`,
        entities: [issuingCompany],
        type: 'regulatory',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Rights Trading & Application',
        description: `Rights trading period begins. Existing shareholders exercise rights or trade in the market. New applications accepted from investors.`,
        entities: [issuingCompany, 'Existing Shareholders', 'New Investors'],
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Allotment & Settlement',
        description: `New shares allotted to subscribing shareholders. Settlement of ${proceedsText} proceeds to ${issuingCompany}. New shares commence trading.`,
        entities: [issuingCompany, 'New Shareholders'],
        type: 'financial',
        criticalPath: true
      }
    ];
  }

  private generateHybridSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
    return [
      {
        id: 'step-1',
        title: 'Capital Raising Component',
        description: `${entityNames.issuingCompanyName || entityNames.primaryCompanyName} conducts capital raising to fund acquisition.`,
        entities: [entityNames.issuingCompanyName || entityNames.primaryCompanyName],
        type: 'financial',
        criticalPath: true
      },
      {
        id: 'step-2',
        title: 'Acquisition Component',
        description: `Using raised capital, ${entityNames.acquiringCompanyName || entityNames.primaryCompanyName} acquires ${entityNames.targetCompanyName || entityNames.secondaryCompanyName}.`,
        entities: [entityNames.acquiringCompanyName, entityNames.targetCompanyName].filter(Boolean),
        type: 'operational',
        criticalPath: true
      },
      {
        id: 'step-3',
        title: 'Integration & Completion',
        description: `Integration of acquired entity and completion of combined transaction structure.`,
        entities: [entityNames.primaryCompanyName],
        type: 'operational',
        criticalPath: true
      }
    ];
  }

  private buildTypeSpecificContext(results: AnalysisResults, entityNames: any, considerationAmount: number, transactionType: string, optimizationResult?: OptimizationResult) {
    const currency = results.dealEconomics?.currency || 'HKD';
    
    if (transactionType === 'CAPITAL_RAISING') {
      return {
        type: results.transactionType || 'Capital Raising',
        amount: considerationAmount,
        currency,
        targetName: entityNames.issuingCompanyName || entityNames.primaryCompanyName,
        buyerName: '', // Not applicable for capital raising
        description: `${entityNames.issuingCompanyName || entityNames.primaryCompanyName} ${results.structure?.recommended || 'capital raising'} to raise ${currency} ${(considerationAmount / 1000000).toFixed(0)}M`,
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      };
    } else {
      return {
        type: results.transactionType || 'Transaction Analysis',
        amount: considerationAmount,
        currency,
        targetName: entityNames.targetCompanyName || entityNames.secondaryCompanyName || 'Target Company',
        buyerName: entityNames.acquiringCompanyName || entityNames.primaryCompanyName || 'Acquiring Company',
        description: generateTransactionDescription(results, considerationAmount),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      };
    }
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
