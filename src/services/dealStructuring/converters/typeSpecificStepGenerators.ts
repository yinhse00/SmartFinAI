
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEnhancedTransactionSteps } from '../converterUtils/transactionDetailsBuilder';

export class TypeSpecificStepGenerators {
  static generateTypeSpecificSteps(
    results: AnalysisResults, 
    entityNames: any, 
    considerationAmount: number, 
    transactionType: string
  ) {
    if (transactionType === 'CAPITAL_RAISING') {
      return TypeSpecificStepGenerators.generateCapitalRaisingSteps(results, entityNames, considerationAmount);
    } else if (transactionType === 'HYBRID') {
      return TypeSpecificStepGenerators.generateHybridSteps(results, entityNames, considerationAmount);
    } else {
      // M&A steps
      return generateEnhancedTransactionSteps(results, entityNames, considerationAmount);
    }
  }

  private static generateCapitalRaisingSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
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
