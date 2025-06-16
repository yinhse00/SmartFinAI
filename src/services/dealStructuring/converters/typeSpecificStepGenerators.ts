
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEnhancedTransactionSteps } from '../converterUtils/transactionDetailsBuilder';
import { CapitalRaisingStepGenerator } from '../capitalRaising/capitalRaisingStepGenerator';

export class TypeSpecificStepGenerators {
  static generateTypeSpecificSteps(
    results: AnalysisResults, 
    entityNames: any, 
    considerationAmount: number, 
    transactionType: string,
    description?: string
  ) {
    if (transactionType === 'CAPITAL_RAISING') {
      return CapitalRaisingStepGenerator.generateCapitalRaisingSteps(
        results, 
        description || ''
      );
    } else if (transactionType === 'HYBRID') {
      return TypeSpecificStepGenerators.generateHybridSteps(results, entityNames, considerationAmount);
    } else {
      // M&A steps
      return generateEnhancedTransactionSteps(results, entityNames, considerationAmount);
    }
  }

  private static generateHybridSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
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
}
