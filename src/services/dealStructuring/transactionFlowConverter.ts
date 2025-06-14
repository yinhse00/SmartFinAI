
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
    console.log('Converting analysis results to comprehensive transaction flow...');
    console.log('Deal Economics:', results.dealEconomics);
    console.log('Corporate Structure:', results.corporateStructure);
    console.log('Shareholding before:', results.shareholding?.before);
    console.log('Shareholding after:', results.shareholding?.after);

    // Extract comprehensive data
    const considerationAmount = this.extractConsiderationAmount(results);
    const entityNames = this.extractEntityNames(results);
    const corporateEntities = this.extractCorporateStructure(results);

    console.log('Extracted comprehensive data:', {
      considerationAmount,
      entityNames,
      corporateEntities
    });

    // Build comprehensive transaction flow with hierarchical structure
    const before = this.buildComprehensiveBeforeStructure(results, entityNames, corporateEntities);
    const after = this.buildComprehensiveAfterStructure(results, entityNames, corporateEntities, considerationAmount);
    const transactionSteps = this.generateEnhancedTransactionSteps(results, entityNames, considerationAmount);

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
    if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
      console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
      return results.dealEconomics.purchasePrice;
    }
    return transactionDataValidator.extractConsiderationAmount(results);
  }

  private extractEntityNames(results: AnalysisResults): {
    targetCompanyName: string;
    acquiringCompanyName: string;
  } {
    // Enhanced entity name extraction with corporate structure integration
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

    // Extract from shareholding data with enhanced logic
    if (results.shareholding?.after) {
      const acquirer = results.shareholding.after.find(holder =>
        holder.percentage > 50 || // Majority holder likely to be acquirer
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

    return {
      targetCompanyName: 'Target Company',
      acquiringCompanyName: 'Acquiring Company'
    };
  }

  private extractCorporateStructure(results: AnalysisResults) {
    const corporateEntities = new Map();
    const relationships = new Map();

    // Process corporate structure entities
    if (results.corporateStructure?.entities) {
      results.corporateStructure.entities.forEach(entity => {
        corporateEntities.set(entity.id, {
          ...entity,
          isMainIssuer: entity.id === results.corporateStructure?.mainIssuer,
          isTarget: results.corporateStructure?.targetEntities?.includes(entity.id)
        });
      });

      // Process relationships
      if (results.corporateStructure.relationships) {
        results.corporateStructure.relationships.forEach(rel => {
          relationships.set(`${rel.parent}-${rel.child}`, rel);
        });
      }
    }

    return { entities: corporateEntities, relationships };
  }

  private buildComprehensiveBeforeStructure(results: AnalysisResults, entityNames: any, corporateEntities: any) {
    const entities = [];
    const relationships = [];

    // Add target company with enhanced information
    const targetCompany = {
      id: 'before-target-company',
      name: entityNames.targetCompanyName,
      type: 'target' as const,
      description: 'Target Company'
    };
    entities.push(targetCompany);

    // Process shareholders with enhanced data integration
    if (results.shareholding?.before && results.shareholding.before.length > 0) {
      results.shareholding.before.forEach((holder, index) => {
        const shareholderId = `before-shareholder-${index}`;
        const shareholderEntity = {
          id: shareholderId,
          name: holder.name,
          type: 'stockholder' as const,
          percentage: holder.percentage,
          description: `${holder.percentage}% shareholder`
        };
        entities.push(shareholderEntity);

        // Create hierarchical ownership relationship (shareholder → company)
        relationships.push({
          source: shareholderId,
          target: 'before-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });
    } else {
      // Enhanced fallback with more realistic structure
      const existingShareholdersEntity = {
        id: 'before-existing-shareholders',
        name: 'Existing Shareholders',
        type: 'stockholder' as const,
        percentage: 100,
        description: '100% collective ownership'
      };
      entities.push(existingShareholdersEntity);

      relationships.push({
        source: 'before-existing-shareholders',
        target: 'before-target-company',
        type: 'ownership' as const,
        percentage: 100
      });
    }

    // Add corporate structure entities if available
    if (corporateEntities.entities.size > 0) {
      corporateEntities.entities.forEach((entity: any) => {
        if (entity.type === 'subsidiary' || entity.type === 'parent') {
          entities.push({
            id: `before-${entity.id}`,
            name: entity.name,
            type: entity.type === 'parent' ? 'stockholder' as const : 'subsidiary' as const,
            description: `${entity.type} entity`
          });
        }
      });
    }

    return { entities, relationships };
  }

  private buildComprehensiveAfterStructure(
    results: AnalysisResults,
    entityNames: any,
    corporateEntities: any,
    considerationAmount: number
  ) {
    const entities = [];
    const relationships = [];

    // Add target company (post-transaction)
    const afterTargetCompany = {
      id: 'after-target-company',
      name: entityNames.targetCompanyName,
      type: 'target' as const,
      description: 'Target Company (Post-Transaction)'
    };
    entities.push(afterTargetCompany);

    // Process new shareholding structure with enhanced data
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
      results.shareholding.after.forEach((holder, index) => {
        const shareholderId = `after-shareholder-${index}`;
        const isAcquirer = this.identifyAcquirer(holder, results);
        
        const shareholderEntity = {
          id: shareholderId,
          name: holder.name,
          type: isAcquirer ? 'buyer' as const : 'stockholder' as const,
          percentage: holder.percentage,
          description: `${holder.percentage}% ${isAcquirer ? 'new owner' : 'continuing shareholder'}`
        };
        entities.push(shareholderEntity);

        // Create hierarchical ownership relationship (shareholder → company)
        relationships.push({
          source: shareholderId,
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: holder.percentage
        });
      });
    } else {
      // Enhanced fallback structure with realistic ownership split
      const acquirerPercentage = results.dealEconomics?.targetPercentage || 70;
      const remainingPercentage = 100 - acquirerPercentage;

      entities.push(
        {
          id: 'after-acquiring-company',
          name: entityNames.acquiringCompanyName,
          type: 'buyer' as const,
          percentage: acquirerPercentage,
          description: `${acquirerPercentage}% new owner`
        },
        {
          id: 'after-remaining-shareholders',
          name: 'Remaining Shareholders',
          type: 'stockholder' as const,
          percentage: remainingPercentage,
          description: `${remainingPercentage}% continuing shareholders`
        }
      );

      relationships.push(
        {
          source: 'after-acquiring-company',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: acquirerPercentage
        },
        {
          source: 'after-remaining-shareholders',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: remainingPercentage
        }
      );
    }

    // Add consideration entity with enhanced information
    if (considerationAmount > 0) {
      const considerationEntity = {
        id: 'consideration-payment',
        name: `${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M`,
        type: 'consideration' as const,
        value: considerationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        description: 'Transaction Consideration'
      };
      entities.push(considerationEntity);

      // Connect consideration to the acquirer
      const acquirer = results.shareholding?.after?.find(holder => 
        this.identifyAcquirer(holder, results)
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

  private identifyAcquirer(holder: any, results: AnalysisResults): boolean {
    // Enhanced logic to identify the acquiring entity
    const name = holder.name.toLowerCase();
    const percentage = holder.percentage;
    
    // Check if it's explicitly identified as acquirer
    if (name.includes('acquir') || name.includes('buyer') || name.includes('purchas')) {
      return true;
    }
    
    // Check if it's a majority holder (likely acquirer)
    if (percentage > 50) {
      return true;
    }
    
    // Check if it matches the target percentage from deal economics
    if (results.dealEconomics?.targetPercentage && 
        Math.abs(percentage - results.dealEconomics.targetPercentage) < 5) {
      return true;
    }
    
    return false;
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

  private generateEnhancedTransactionSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
    const steps = [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${entityNames.acquiringCompanyName} conducts comprehensive due diligence and negotiates transaction terms with ${entityNames.targetCompanyName}`,
        entities: ['before-target-company']
      },
      {
        id: 'step-2',
        title: 'Transaction Structuring',
        description: `Implementation of ${results.structure?.recommended || 'optimized transaction structure'} with regulatory approvals`,
        entities: ['before-target-company', 'after-target-company']
      },
      {
        id: 'step-3',
        title: 'Completion & Settlement',
        description: `Transfer of ${results.dealEconomics?.targetPercentage || 'majority'} ownership and ${considerationAmount > 0 ? `payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration` : 'completion of transaction'}`,
        entities: considerationAmount > 0 ? ['after-target-company', 'consideration-payment'] : ['after-target-company']
      }
    ];

    return steps;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
