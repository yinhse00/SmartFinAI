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
    console.log('Corporate structure:', results.corporateStructure);

    // Extract data using proper purchase price
    const considerationAmount = this.extractConsiderationAmount(results);
    const entityNames = this.extractEntityNames(results);
    const ownershipData = this.extractOwnershipData(results);

    console.log('Extracted data:', {
      considerationAmount,
      entityNames,
      ownershipData
    });

    // Build transaction flow with proper purchase price
    const before = this.buildBeforeStructure(results, entityNames);
    const after = this.buildAfterStructure(results, entityNames, considerationAmount, ownershipData);
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

      // If we only have target, try to extract acquirer from shareholding data
      if (targetEntity && results.shareholding?.after) {
        const potentialAcquirer = results.shareholding.after.find(holder =>
          holder.name.toLowerCase().includes('acquir') ||
          holder.name.toLowerCase().includes('buyer') ||
          holder.percentage > 50 // Assume controlling shareholder is acquirer
        );
        
        if (potentialAcquirer) {
          return {
            targetCompanyName: targetEntity.name,
            acquiringCompanyName: potentialAcquirer.name
          };
        }
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

  private extractOwnershipData(results: AnalysisResults): {
    hasBeforeData: boolean;
    hasAfterData: boolean;
    isFullAcquisition: boolean;
    acquisitionPercentage: number;
  } {
    const beforeData = results.shareholding?.before || [];
    const afterData = results.shareholding?.after || [];
    
    let acquisitionPercentage = 0;
    let isFullAcquisition = false;

    if (afterData.length > 0) {
      // Find the acquirer in after data
      const acquirer = afterData.find(holder => 
        holder.name.toLowerCase().includes('acquir') || 
        holder.name.toLowerCase().includes('buyer') ||
        holder.name.toLowerCase().includes('purchas')
      );
      
      if (acquirer) {
        acquisitionPercentage = acquirer.percentage;
        isFullAcquisition = acquisitionPercentage >= 100;
      }
    }

    return {
      hasBeforeData: beforeData.length > 0,
      hasAfterData: afterData.length > 0,
      isFullAcquisition,
      acquisitionPercentage
    };
  }

  private buildBeforeStructure(results: AnalysisResults, entityNames: any) {
    const entities = [];
    const relationships = [];

    // Use actual shareholding before data if available
    if (results.shareholding?.before && results.shareholding.before.length > 0) {
      results.shareholding.before.forEach((holder, index) => {
        entities.push({
          id: `before-shareholder-${index}`,
          name: holder.name,
          type: 'stockholder' as const
        });
      });

      // Add the acquiring company as separate entity
      entities.push({
        id: 'before-acquiring-company',
        name: entityNames.acquiringCompanyName,
        type: 'buyer' as const,
        description: 'Acquiring Entity'
      });

      // Add target company
      entities.push({
        id: 'before-target-company',
        name: entityNames.targetCompanyName,
        type: 'target' as const
      });

      // Create relationships for target company shareholding
      results.shareholding.before.forEach((holder, index) => {
        relationships.push({
          source: `before-shareholder-${index}`,
          target: 'before-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });
    } else {
      // Minimal structure when no shareholding data
      entities.push(
        {
          id: 'before-acquiring-company',
          name: entityNames.acquiringCompanyName,
          type: 'buyer' as const
        },
        {
          id: 'before-target-company',
          name: entityNames.targetCompanyName,
          type: 'target' as const
        }
      );
    }

    return { entities, relationships };
  }

  private buildAfterStructure(
    results: AnalysisResults,
    entityNames: any,
    considerationAmount: number,
    ownershipData: any
  ) {
    const entities = [];
    const relationships = [];

    // Use actual shareholding after data if available
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
      // Add all shareholders from after data
      results.shareholding.after.forEach((holder, index) => {
        entities.push({
          id: `after-shareholder-${index}`,
          name: holder.name,
          type: holder.name.toLowerCase().includes('acquir') || 
                holder.name.toLowerCase().includes('buyer') ? 'buyer' as const : 'stockholder' as const
        });
      });

      // Add target company
      entities.push({
        id: 'after-target-company',
        name: entityNames.targetCompanyName,
        type: 'target' as const
      });

      // Add consideration if amount is available
      if (considerationAmount > 0) {
        entities.push({
          id: 'consideration-payment',
          name: `HKD ${(considerationAmount / 1000000).toFixed(0)}M Consideration`,
          type: 'consideration' as const,
          value: considerationAmount,
          currency: 'HKD'
        });
      }

      // Create ownership relationships
      results.shareholding.after.forEach((holder, index) => {
        relationships.push({
          source: `after-shareholder-${index}`,
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });

      // Add consideration relationship if applicable
      if (considerationAmount > 0) {
        const acquirer = results.shareholding.after.find(holder => 
          holder.name.toLowerCase().includes('acquir') || 
          holder.name.toLowerCase().includes('buyer')
        );
        
        if (acquirer) {
          const acquirerIndex = results.shareholding.after.indexOf(acquirer);
          relationships.push({
            source: `after-shareholder-${acquirerIndex}`,
            target: 'consideration-payment',
            type: 'consideration' as const,
            value: considerationAmount
          });
        }
      }
    } else {
      // Minimal structure when no after data
      entities.push(
        {
          id: 'after-acquiring-company',
          name: entityNames.acquiringCompanyName,
          type: 'buyer' as const
        },
        {
          id: 'after-target-company',
          name: entityNames.targetCompanyName,
          type: 'target' as const
        }
      );

      if (considerationAmount > 0) {
        entities.push({
          id: 'consideration-payment',
          name: `HKD ${(considerationAmount / 1000000).toFixed(0)}M Consideration`,
          type: 'consideration' as const,
          value: considerationAmount,
          currency: 'HKD'
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
        entities: ['before-acquiring-company', 'before-target-company']
      },
      {
        id: 'step-2',
        title: 'Transaction Execution',
        description: `Implementation of ${results.structure?.recommended || 'transaction structure'}`,
        entities: ['before-acquiring-company', 'before-target-company']
      }
    ];

    if (considerationAmount > 0) {
      steps.push({
        id: 'step-3',
        title: 'Completion & Payment',
        description: `Transfer of ownership and payment of HKD ${(considerationAmount / 1000000).toFixed(0)}M consideration`,
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
