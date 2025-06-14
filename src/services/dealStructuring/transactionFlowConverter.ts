
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
import { transactionDataValidator } from './transactionDataValidator';

export interface EnhancedTransactionFlowData {
  analysisResults: AnalysisResults;
  optimizationResult?: OptimizationResult;
}

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults, 
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to transaction flow...');
    console.log('Deal Economics:', results.dealEconomics);
    console.log('Shareholding before:', results.shareholding?.before);
    console.log('Shareholding after:', results.shareholding?.after);

    // Extract data using proper purchase price
    const considerationAmount = this.extractConsiderationAmount(results);
    const entityNames = this.extractEntityNames(results);

    console.log('Extracted data:', {
      considerationAmount,
      entityNames
    });

    // Build transaction flow with proper shareholder mapping
    const before = this.buildBeforeStructure(results, entityNames);
    const after = this.buildAfterStructure(results, entityNames, considerationAmount);
    const transactionSteps = this.generateTransactionSteps(results, entityNames, considerationAmount);

    return {
      before,
      after,
      transactionSteps,
      transactionContext: {
        type: results.transactionType || 'Transaction Analysis',
        amount: considerationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        targetName: entityNames.targetCompanyName,
        buyerName: entityNames.acquiringCompanyName,
        description: this.generateTransactionDescription(results, considerationAmount),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      }
    };
  }

  private extractConsiderationAmount(results: AnalysisResults): number {
    // Use dealEconomics.purchasePrice as primary source
    if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
      console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
      return results.dealEconomics.purchasePrice;
    }

    // Fallback to validator logic
    return transactionDataValidator.extractConsiderationAmount(results);
  }

  private extractEntityNames(results: AnalysisResults): {
    targetCompanyName: string;
    acquiringCompanyName: string;
  } {
    // Enhanced entity name extraction with better fallbacks
    if (results.corporateStructure?.entities) {
      const targetEntity = results.corporateStructure.entities.find(e => 
        e.type === 'target' || e.name.toLowerCase().includes('target')
      );
      const acquiringEntity = results.corporateStructure.entities.find(e => 
        e.type === 'parent' || e.type === 'issuer' || 
        e.name.toLowerCase().includes('acquir') ||
        e.name.toLowerCase().includes('buyer') ||
        e.name.toLowerCase().includes('purchas')
      );
      
      if (targetEntity && acquiringEntity) {
        return {
          targetCompanyName: targetEntity.name,
          acquiringCompanyName: acquiringEntity.name
        };
      }
    }

    // Extract from shareholding data if corporate structure is incomplete
    if (results.shareholding?.after) {
      const acquirer = results.shareholding.after.find(holder =>
        holder.name.toLowerCase().includes('acquir') ||
        holder.name.toLowerCase().includes('buyer') ||
        holder.name.toLowerCase().includes('purchas')
      );
      
      if (acquirer) {
        return {
          targetCompanyName: 'Target Company',
          acquiringCompanyName: acquirer.name
        };
      }
    }

    // Fallback to meaningful defaults
    return {
      targetCompanyName: 'Target Company',
      acquiringCompanyName: 'Acquiring Company'
    };
  }

  private buildBeforeStructure(results: AnalysisResults, entityNames: any) {
    const entities = [];
    const relationships = [];

    // Add target company
    entities.push({
      id: 'before-target-company',
      name: entityNames.targetCompanyName,
      type: 'target' as const,
      description: 'Target Company'
    });

    // Use actual shareholding before data if available
    if (results.shareholding?.before && results.shareholding.before.length > 0) {
      results.shareholding.before.forEach((holder, index) => {
        const shareholderId = `before-shareholder-${index}`;
        entities.push({
          id: shareholderId,
          name: holder.name,
          type: 'stockholder' as const,
          percentage: holder.percentage,
          description: `${holder.percentage}% shareholder`
        });

        // Create ownership relationship
        relationships.push({
          source: shareholderId,
          target: 'before-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });
    } else {
      // Fallback: create a generic existing shareholders entity
      entities.push({
        id: 'before-existing-shareholders',
        name: 'Existing Shareholders',
        type: 'stockholder' as const,
        percentage: 100,
        description: '100% shareholder'
      });

      relationships.push({
        source: 'before-existing-shareholders',
        target: 'before-target-company',
        type: 'ownership' as const,
        percentage: 100
      });
    }

    return { entities, relationships };
  }

  private buildAfterStructure(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number
  ) {
    const entities = [];
    const relationships = [];

    // Add target company
    entities.push({
      id: 'after-target-company',
      name: entityNames.targetCompanyName,
      type: 'target' as const,
      description: 'Target Company (Post-Transaction)'
    });

    // Use actual shareholding after data if available
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
      // Add all shareholders from after data
      results.shareholding.after.forEach((holder, index) => {
        const shareholderId = `after-shareholder-${index}`;
        const isAcquirer = holder.name.toLowerCase().includes('acquir') || 
                          holder.name.toLowerCase().includes('buyer') ||
                          holder.name.toLowerCase().includes('purchas');
        
        entities.push({
          id: shareholderId,
          name: holder.name,
          type: isAcquirer ? 'buyer' as const : 'stockholder' as const,
          percentage: holder.percentage,
          description: `${holder.percentage}% shareholder`
        });

        // Create ownership relationship
        relationships.push({
          source: shareholderId,
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });
    } else {
      // Fallback structure
      entities.push(
        {
          id: 'after-acquiring-company',
          name: entityNames.acquiringCompanyName,
          type: 'buyer' as const,
          percentage: 70,
          description: '70% shareholder'
        },
        {
          id: 'after-remaining-shareholders',
          name: 'Remaining Shareholders',
          type: 'stockholder' as const,
          percentage: 30,
          description: '30% shareholder'
        }
      );

      relationships.push(
        {
          source: 'after-acquiring-company',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: 70
        },
        {
          source: 'after-remaining-shareholders',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: 30
        }
      );
    }

    // Add consideration if amount is available
    if (considerationAmount > 0) {
      entities.push({
        id: 'consideration-payment',
        name: `${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M`,
        type: 'consideration' as const,
        value: considerationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        description: 'Transaction Consideration'
      });

      // Find the acquirer to create consideration relationship
      const acquirer = results.shareholding?.after?.find(holder => 
        holder.name.toLowerCase().includes('acquir') || 
        holder.name.toLowerCase().includes('buyer')
      );
      
      if (acquirer) {
        const acquirerIndex = results.shareholding!.after!.indexOf(acquirer);
        relationships.push({
          source: `after-shareholder-${acquirerIndex}`,
          target: 'consideration-payment',
          type: 'consideration' as const,
          value: considerationAmount
        });
      }
    }

    return { entities, relationships };
  }

  private generateTransactionDescription(results: AnalysisResults, considerationAmount: number): string {
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
    
    const percentageText = targetPercentage ? `${targetPercentage}% acquisition` : '';
    const structure = results.structure?.recommended || 'Standard Structure';
    
    return `${transactionType} ${amountText} ${percentageText} via ${structure}`.trim();
  }

  private generateTransactionSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
    const steps = [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${entityNames.acquiringCompanyName} conducts due diligence and negotiates transaction terms`,
        entities: ['before-target-company']
      },
      {
        id: 'step-2',
        title: 'Transaction Execution',
        description: `Implementation of ${results.structure?.recommended || 'transaction structure'}`,
        entities: ['before-target-company', 'after-target-company']
      }
    ];

    if (considerationAmount > 0) {
      steps.push({
        id: 'step-3',
        title: 'Completion & Payment',
        description: `Transfer of ownership and payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration`,
        entities: ['after-target-company', 'consideration-payment']
      });
    } else {
      steps.push({
        id: 'step-3',
        title: 'Completion',
        description: 'Transfer of ownership and transaction completion',
        entities: ['after-target-company']
      });
    }

    return steps;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
