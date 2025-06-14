import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
import { transactionDataValidator } from './transactionDataValidator';
import { CorporateEntity } from '@/types/dealStructuring';

export interface EnhancedTransactionFlowData {
  analysisResults: AnalysisResults;
  optimizationResult?: OptimizationResult;
}

// Define a union type for relationships to be used in addCorporateChildren
type AnyTransactionRelationship = TransactionFlow['before']['relationships'][0] | TransactionFlow['after']['relationships'][0];

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    console.log('Converting analysis results to comprehensive transaction flow (v2)...');
    console.log('AnalysisResults Input:', JSON.stringify(results, null, 2));

    const considerationAmount = this.extractConsiderationAmount(results);
    const entityNames = this.extractEntityNames(results); // Target and Acquirer names

    // Process corporate structure first to enrich entity information
    const corporateStructureMap = this.processCorporateStructure(results.corporateStructure);

    const before = this.buildBeforeStructure(results, entityNames, corporateStructureMap);
    const after = this.buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    const transactionSteps = this.generateEnhancedTransactionSteps(results, entityNames, considerationAmount);

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
        description: this.generateTransactionDescription(results, considerationAmount),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      }
    };
    console.log('Generated TransactionFlow:', JSON.stringify(transactionFlow, null, 2));
    return transactionFlow;
  }

  private extractConsiderationAmount(results: AnalysisResults): number {
    // ... keep existing code (extractConsiderationAmount method)
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
    let targetName = 'Target Company';
    let acquirerName = 'Acquiring Company';

    // Prioritize names from corporate structure if available
    if (results.corporateStructure?.entities) {
      const targetEntity = results.corporateStructure.entities.find(e => e.type === 'target');
      if (targetEntity) targetName = targetEntity.name;

      const acquirerEntity = results.corporateStructure.entities.find(e => 
        e.type === 'parent' || e.type === 'issuer' || 
        e.name.toLowerCase().includes('acquir') ||
        e.name.toLowerCase().includes('buyer') ||
        e.name.toLowerCase().includes('purchas')
      );
      if (acquirerEntity) acquirerName = acquirerEntity.name;
    }

    // Fallback or supplement with deal economics if names still generic
    if (targetName === 'Target Company' && results.dealEconomics?.targetPercentage) {
      // Attempt to find target from shareholding if not set by corporate structure
      if(results.shareholding?.before && results.shareholding.before.length > 0){
        // Assuming target is the company being sold, often implied, not explicitly listed as a shareholder.
        // This part of logic might need refinement based on how target is represented.
      }
    }

    if (acquirerName === 'Acquiring Company' && results.shareholding?.after) {
      const potentialAcquirer = results.shareholding.after.find(
        holder => holder.percentage > (results.dealEconomics?.targetPercentage || 50) - 5 && // Acquired significant stake
                  (holder.name.toLowerCase().includes('acquir') || 
                   holder.name.toLowerCase().includes('buyer') ||
                   holder.name.toLowerCase().includes('purchas'))
      );
      if (potentialAcquirer) acquirerName = potentialAcquirer.name;
    }
    
    console.log(`Extracted Entity Names: Target - ${targetName}, Acquirer - ${acquirerName}`);
    return { targetCompanyName: targetName, acquiringCompanyName: acquirerName };
  }

  private processCorporateStructure(corporateStructureData?: AnalysisResults['corporateStructure']): Map<string, CorporateEntity & { children?: string[], parentLink?: string }> {
    const structureMap = new Map<string, CorporateEntity & { children?: string[], parentLink?: string }>();
    if (!corporateStructureData?.entities) return structureMap;

    corporateStructureData.entities.forEach(entity => {
      structureMap.set(entity.id, { ...entity, children: [] });
    });

    corporateStructureData.relationships?.forEach(rel => {
      const parent = structureMap.get(rel.parent);
      const child = structureMap.get(rel.child);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(rel.child);
      }
      if (child) {
        child.parentLink = rel.parent; // Store parent relationship
      }
    });
    console.log('Processed Corporate Structure Map:', structureMap);
    return structureMap;
  }

  private generateEntityId(type: string, name: string, prefix: string): string {
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
    return `${prefix}-${type.toLowerCase()}-${sanitizedName}`; // Ensure type is lowercase for consistency
  }
  
  private buildBeforeStructure(
    results: AnalysisResults,
    entityNames: { targetCompanyName: string; acquiringCompanyName: string },
    corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
  ): TransactionFlow['before'] {
    const entities: TransactionEntity[] = [];
    const relationships: TransactionFlow['before']['relationships'] = [];
    const prefix = 'before';

    // 1. Add Target Company
    const targetId = this.generateEntityId('target', entityNames.targetCompanyName, prefix);
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Pre-Transaction)',
    });

    // 2. Add Shareholders of Target from shareholding.before
    if (results.shareholding?.before && results.shareholding.before.length > 0) {
      results.shareholding.before.forEach((holder) => {
        const shareholderId = this.generateEntityId('stockholder', holder.name, prefix);
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: `${holder.percentage}% Shareholder`,
          });
        }
        relationships.push({
          source: shareholderId,
          target: targetId,
          type: 'ownership',
          percentage: holder.percentage,
        });
      });
    } else {
      // Fallback if no explicit shareholders
      const genericShareholderId = this.generateEntityId('stockholder', 'ExistingShareholders', prefix);
      entities.push({
        id: genericShareholderId,
        name: 'Existing Shareholders',
        type: 'stockholder',
        percentage: 100,
        description: '100% collective ownership',
      });
      relationships.push({
        source: genericShareholderId,
        target: targetId,
        type: 'ownership',
        percentage: 100,
      });
    }

    // 3. Add Acquirer's pre-transaction structure (if relevant and distinct from target's shareholders)
    const acquirerCorpEntityFromMap = Array.from(corporateStructureMap.values()).find(
      ce => ce.name === entityNames.acquiringCompanyName
    );

    if (acquirerCorpEntityFromMap) {
        const acquirerRootId = this.generateEntityId(acquirerCorpEntityFromMap.type as TransactionEntity['type'], acquirerCorpEntityFromMap.name, prefix);
         if (!entities.find(e => e.id === acquirerRootId)) {
           entities.push({
             id: acquirerRootId,
             name: acquirerCorpEntityFromMap.name,
             type: acquirerCorpEntityFromMap.type as TransactionEntity['type'], // Use CorporateEntity type, ensure it's valid TransactionEntity type
             description: `Acquiring Entity Root (${acquirerCorpEntityFromMap.type})`,
           });
        }
        // Add its parents/children if defined in corporate structure
        this.addCorporateChildren(acquirerCorpEntityFromMap, acquirerRootId, entities, relationships, corporateStructureMap, prefix, new Set());
    }


    // 4. Integrate other relevant corporate structure entities related to the Target
    const targetCorpEntity = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.targetCompanyName && ce.type === 'target');
    if (targetCorpEntity) {
        this.addCorporateChildren(targetCorpEntity, targetId, entities, relationships, corporateStructureMap, prefix, new Set());
        
        let currentCorpParentId = targetCorpEntity.parentLink;
        let childNodeIdForParentLink = targetId; 
        while(currentCorpParentId) {
            const parentCorpData = corporateStructureMap.get(currentCorpParentId);
            if (parentCorpData) {
                const parentEntityId = this.generateEntityId(parentCorpData.type as TransactionEntity['type'], parentCorpData.name, prefix);
                 if (!entities.find(e => e.id === parentEntityId)) {
                    entities.push({
                        id: parentEntityId,
                        name: parentCorpData.name,
                        type: parentCorpData.type as TransactionEntity['type'], 
                        description: `${parentCorpData.type} of ${entities.find(e=>e.id === childNodeIdForParentLink)?.name || 'child'}`,
                    });
                }
                relationships.push({
                    source: parentEntityId,
                    target: childNodeIdForParentLink, 
                    type: 'ownership', 
                });
                childNodeIdForParentLink = parentEntityId; 
                currentCorpParentId = parentCorpData.parentLink;
            } else {
                currentCorpParentId = undefined;
            }
        }
    }
    
    console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
    return { entities, relationships };
  }

  private addCorporateChildren(
    parentCorpEntity: CorporateEntity & { children?: string[] },
    parentElementId: string,
    entities: TransactionEntity[],
    relationships: AnyTransactionRelationship[], // Updated to use the union type
    corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
    prefix: string,
    visited: Set<string>
  ) {
    if (!parentCorpEntity.children || visited.has(parentCorpEntity.id)) {
      return;
    }
    visited.add(parentCorpEntity.id);

    parentCorpEntity.children.forEach(childId => {
      const childCorpEntity = corporateStructureMap.get(childId);
      if (childCorpEntity) {
        // Ensure childCorpEntity.type is a valid TransactionEntity['type']
        const childEntityType = childCorpEntity.type === 'issuer' ? 'subsidiary' : childCorpEntity.type; // Example mapping
        const childEntityId = this.generateEntityId(childEntityType, childCorpEntity.name, prefix);
        
        if (!entities.find(e => e.id === childEntityId)) {
          entities.push({
            id: childEntityId,
            name: childCorpEntity.name,
            type: childEntityType as TransactionEntity['type'],
            description: `${childCorpEntity.type} of ${parentCorpEntity.name}`,
          });
        }
        relationships.push({
          source: parentElementId,
          target: childEntityId,
          type: 'control', 
        } as AnyTransactionRelationship); // Cast to ensure compatibility, 'control' is common
        // Recursively add children of this child
        this.addCorporateChildren(childCorpEntity, childEntityId, entities, relationships, corporateStructureMap, prefix, visited);
      }
    });
  }

  private buildAfterStructure(
    results: AnalysisResults,
    entityNames: { targetCompanyName: string; acquiringCompanyName: string },
    corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
    considerationAmount: number
  ): TransactionFlow['after'] {
    const entities: TransactionEntity[] = [];
    const relationships: TransactionFlow['after']['relationships'] = []; // Correctly typed for 'after'
    const prefix = 'after';

    // 1. Add Target Company (Post-Transaction)
    const targetId = this.generateEntityId('target', entityNames.targetCompanyName, prefix);
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Post-Transaction)',
    });

    // 2. Process new shareholding structure (shareholding.after)
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
      results.shareholding.after.forEach((holder) => {
        const isAcquirer = holder.name === entityNames.acquiringCompanyName || this.identifyAcquirer(holder, results, entityNames.acquiringCompanyName);
        const entityType = isAcquirer ? 'buyer' : 'stockholder';
        const shareholderId = this.generateEntityId(entityType, holder.name, prefix);

        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: entityType,
            percentage: holder.percentage,
            description: `${holder.percentage}% ${isAcquirer ? 'New Owner' : 'Continuing Shareholder'}`,
          });
        }
        relationships.push({
          source: shareholderId,
          target: targetId,
          type: 'ownership',
          percentage: holder.percentage,
        });
      });
    } else {
      // Fallback if no shareholding.after: Acquirer takes a stake
      const acquirerId = this.generateEntityId('buyer', entityNames.acquiringCompanyName, prefix);
      const acquiredPercentage = results.dealEconomics?.targetPercentage || 100; 
      
      if (!entities.find(e => e.id === acquirerId)) {
        entities.push({
          id: acquirerId,
          name: entityNames.acquiringCompanyName,
          type: 'buyer',
          percentage: acquiredPercentage,
          description: `${acquiredPercentage}% New Owner`,
        });
      }
      relationships.push({
        source: acquirerId,
        target: targetId,
        type: 'ownership',
        percentage: acquiredPercentage,
      });

      if (acquiredPercentage < 100) {
        const remainingShareholderId = this.generateEntityId('stockholder','RemainingShareholders',prefix);
        if (!entities.find(e => e.id === remainingShareholderId)) {
            entities.push({
                id: remainingShareholderId,
                name: "Remaining Original Shareholders",
                type: "stockholder",
                percentage: 100 - acquiredPercentage,
                description: `${100 - acquiredPercentage}% ownership`
            });
        }
        relationships.push({
            source: remainingShareholderId,
            target: targetId,
            type: "ownership",
            percentage: 100 - acquiredPercentage
        });
      }
    }
    
    // 3. Add Acquirer's post-transaction corporate structure
    const acquirerCorpEntityFromMap = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.acquiringCompanyName);
    const acquirerEntityNode = entities.find(e => e.name === entityNames.acquiringCompanyName && e.type === 'buyer');

    if (acquirerCorpEntityFromMap && acquirerEntityNode) {
        // Add acquirer's other children/parents from corporate structure
        this.addCorporateChildren(acquirerCorpEntityFromMap, acquirerEntityNode.id, entities, relationships, corporateStructureMap, prefix, new Set());
    }


    // 4. Add Consideration Entity
    if (considerationAmount > 0) {
      const considerationId = this.generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, prefix);
      entities.push({
        id: considerationId,
        name: `${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M`,
        type: 'consideration',
        value: considerationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        description: 'Transaction Consideration',
      });

      const mainBuyer = entities.find(e => e.type === 'buyer');
      if (mainBuyer) {
        relationships.push({
          source: mainBuyer.id, 
          target: considerationId, 
          type: 'consideration', 
          value: considerationAmount,
        });
      }
    }
    
    console.log(`After Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
    return { entities, relationships };
  }

  private identifyAcquirer(holder: any, results: AnalysisResults, extractedAcquirerName: string): boolean {
    const name = holder.name.toLowerCase();
    if (holder.name === extractedAcquirerName) return true;

    // ... keep existing code (rest of identifyAcquirer logic)
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
        Math.abs(percentage - results.dealEconomics.targetPercentage) < 5) { // Allow some tolerance
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
    
    const percentageText = targetPercentage ? `${targetPercentage}% acquisition` : 'acquisition';
    const structure = results.structure?.recommended || 'Standard Structure';
    
    return `${transactionType} ${amountText} ${percentageText} via ${structure}`.trim();
  }

  private generateEnhancedTransactionSteps(results: AnalysisResults, entityNames: any, considerationAmount: number) {
    // Using generated IDs for entities in steps
    const beforeTargetId = this.generateEntityId('target', entityNames.targetCompanyName, 'before');
    const afterTargetId = this.generateEntityId('target', entityNames.targetCompanyName, 'after');
    const considerationNodeId = considerationAmount > 0 ? this.generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, 'after') : undefined;
    const beforeAcquirerId = this.generateEntityId('buyer', entityNames.acquiringCompanyName, 'before'); // Assuming buyer type for acquirer entity ID generation consistency
    const afterAcquirerId = this.generateEntityId('buyer', entityNames.acquiringCompanyName, 'after');


    const steps = [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${entityNames.acquiringCompanyName} conducts due diligence and negotiates with ${entityNames.targetCompanyName}.`,
        entities: [beforeTargetId, beforeAcquirerId].filter(Boolean) as string[]
      },
      {
        id: 'step-2',
        title: 'Transaction Structuring & Approvals',
        description: `Implementation of ${results.structure?.recommended || 'optimized transaction structure'} with regulatory approvals.`,
        entities: [beforeTargetId, afterTargetId].filter(Boolean) as string[]
      },
      {
        id: 'step-3',
        title: 'Completion & Settlement',
        description: `Transfer of ${results.dealEconomics?.targetPercentage ? results.dealEconomics.targetPercentage + '%' : 'control'} and ${considerationAmount > 0 ? `payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration` : 'completion of transaction'}.`,
        entities: [afterTargetId, considerationNodeId, afterAcquirerId].filter(Boolean) as string[]
      }
    ];
    return steps;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
