
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { transactionDataValidator } from './transactionDataValidator';

export class TransactionFlowConverter {
  convertToTransactionFlow(results: AnalysisResults): TransactionFlow | undefined {
    // Validate data first
    const validation = transactionDataValidator.validateConsistency(results);
    
    if (!validation.isValid) {
      console.warn('Transaction data validation failed:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('Transaction data warnings:', validation.warnings);
    }

    // Extract validated data
    const considerationAmount = transactionDataValidator.extractConsiderationAmount(results);
    const { acquisitionPercentage, remainingPercentage } = transactionDataValidator.extractOwnershipPercentages(results);
    const { targetCompanyName, acquiringCompanyName } = transactionDataValidator.extractEntityNames(results);

    // Build transaction flow with validated data
    const before = this.buildBeforeStructure(results, acquiringCompanyName, targetCompanyName);
    const after = this.buildAfterStructure(
      results, 
      acquiringCompanyName, 
      targetCompanyName, 
      acquisitionPercentage, 
      remainingPercentage, 
      considerationAmount
    );

    const transactionSteps = this.generateTransactionSteps(
      acquiringCompanyName, 
      acquisitionPercentage, 
      considerationAmount
    );

    return {
      before,
      after,
      transactionSteps,
      transactionContext: {
        type: results.transactionType,
        amount: considerationAmount,
        currency: 'HKD',
        targetName: targetCompanyName,
        buyerName: acquiringCompanyName,
        description: `${acquisitionPercentage}% acquisition for HKD ${(considerationAmount / 1000000).toFixed(0)}M`
      }
    };
  }

  private buildBeforeStructure(
    results: AnalysisResults, 
    acquiringCompanyName: string, 
    targetCompanyName: string
  ) {
    // Use shareholding data to determine controlling percentages
    const controllingPercentage = results.shareholding?.before?.[0]?.percentage || 65;
    const publicPercentage = 100 - controllingPercentage;

    return {
      entities: [
        { 
          id: 'before-controlling-shareholder', 
          name: 'Controlling Shareholder', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-public-shareholders', 
          name: 'Public Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-acquiring-company', 
          name: acquiringCompanyName, 
          type: 'buyer' as const,
          description: 'Listed Entity'
        },
        { 
          id: 'before-target-shareholders', 
          name: 'Existing Target Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-target-company', 
          name: targetCompanyName, 
          type: 'target' as const 
        }
      ],
      relationships: [
        {
          source: 'before-controlling-shareholder',
          target: 'before-acquiring-company',
          type: 'ownership' as const,
          percentage: controllingPercentage
        },
        {
          source: 'before-public-shareholders',
          target: 'before-acquiring-company',
          type: 'ownership' as const,
          percentage: publicPercentage
        },
        {
          source: 'before-target-shareholders',
          target: 'before-target-company',
          type: 'ownership' as const,
          percentage: 100
        }
      ]
    };
  }

  private buildAfterStructure(
    results: AnalysisResults,
    acquiringCompanyName: string,
    targetCompanyName: string,
    acquisitionPercentage: number,
    remainingPercentage: number,
    considerationAmount: number
  ) {
    // Use shareholding data for controlling structure
    const controllingPercentage = results.shareholding?.before?.[0]?.percentage || 65;
    const publicPercentage = 100 - controllingPercentage;

    return {
      entities: [
        { 
          id: 'after-target-company', 
          name: targetCompanyName, 
          type: 'target' as const 
        },
        { 
          id: 'after-acquiring-company', 
          name: acquiringCompanyName, 
          type: 'buyer' as const
        },
        { 
          id: 'after-remaining-shareholders', 
          name: 'Remaining Target Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'after-controlling-shareholder', 
          name: 'Controlling Shareholder', 
          type: 'stockholder' as const
        },
        { 
          id: 'after-public-shareholders', 
          name: 'Public Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'consideration-payment', 
          name: `HKD ${(considerationAmount / 1000000).toFixed(0)}M Consideration`, 
          type: 'consideration' as const,
          value: considerationAmount,
          currency: 'HKD'
        }
      ],
      relationships: [
        {
          source: 'after-acquiring-company',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: acquisitionPercentage
        },
        {
          source: 'after-remaining-shareholders',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: remainingPercentage
        },
        {
          source: 'after-controlling-shareholder',
          target: 'after-acquiring-company',
          type: 'ownership' as const,
          percentage: controllingPercentage
        },
        {
          source: 'after-public-shareholders',
          target: 'after-acquiring-company',
          type: 'ownership' as const,
          percentage: publicPercentage
        },
        {
          source: 'after-acquiring-company',
          target: 'consideration-payment',
          type: 'consideration' as const,
          value: considerationAmount
        }
      ]
    };
  }

  private generateTransactionSteps(
    acquiringCompanyName: string,
    acquisitionPercentage: number,
    considerationAmount: number
  ) {
    return [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${acquiringCompanyName} conducts due diligence and negotiates acquisition terms`,
        entities: ['before-acquiring-company', 'before-target-company']
      },
      {
        id: 'step-2',
        title: 'Share Purchase Agreement',
        description: `Execution of share purchase for ${acquisitionPercentage}% stake`,
        entities: ['before-acquiring-company', 'before-target-company']
      },
      {
        id: 'step-3',
        title: 'Completion & Payment',
        description: `Transfer of ${acquisitionPercentage}% ownership and payment of HKD ${(considerationAmount / 1000000).toFixed(0)}M consideration`,
        entities: ['after-acquiring-company', 'after-target-company', 'consideration-payment']
      }
    ];
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
