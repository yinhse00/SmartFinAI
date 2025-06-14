import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow, TransactionEntity } from '@/types/transactionFlow';
import { OptimizationResult } from './optimizationEngine';
import { transactionDataValidator } from './transactionDataValidator';
import { CorporateEntity } from '@/types/dealStructuring';

export interface EnhancedTransactionFlowData {
  analysisResults: AnalysisResults;
  optimizationResult?: OptimizationResult;
}

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
    return `${prefix}-${type}-${sanitizedName}`;
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
    // For now, we assume the acquirer is an external entity not detailed in the 'before' shareholding of the target.
    // If acquirer's own structure is needed pre-transaction, logic would go here.
    // Example: if the acquirer itself is part of a group visible in corporateStructureMap
    corporateStructureMap.forEach((corpEntity, corpId) => {
      if (corpEntity.name === entityNames.acquiringCompanyName) {
        const acquirerRootId = this.generateEntityId(corpEntity.type, corpEntity.name, prefix);
        if (!entities.find(e => e.id === acquirerRootId)) {
           entities.push({
             id: acquirerRootId,
             name: corpEntity.name,
             type: corpEntity.type === 'parent' ? 'buyer' : 'stockholder', // or a more generic type
             description: `Acquiring Entity (Pre-Transaction Root)`,
           });
        }
        // Add its parents/children if defined in corporate structure
        this.addCorporateChildren(corpEntity, acquirerRootId, entities, relationships, corporateStructureMap, prefix, new Set());
      }
    });


    // 4. Integrate other relevant corporate structure entities related to the Target
    const targetCorpEntity = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.targetCompanyName && ce.type === 'target');
    if (targetCorpEntity) {
        this.addCorporateChildren(targetCorpEntity, targetId, entities, relationships, corporateStructureMap, prefix, new Set());
        // Add parents of the target if any
        let currentParentId = targetCorpEntity.parentLink;
        let childForParentLink = targetId; // The ID of the entity the parent owns
        while(currentParentId) {
            const parentCorpEntity = corporateStructureMap.get(currentParentId);
            if (parentCorpEntity) {
                const parentEntityId = this.generateEntityId(parentCorpEntity.type, parentCorpEntity.name, prefix);
                 if (!entities.find(e => e.id === parentEntityId)) {
                    entities.push({
                        id: parentEntityId,
                        name: parentCorpEntity.name,
                        type: parentCorpEntity.type === 'parent' ? 'stockholder' : 'subsidiary', // Or map to TransactionEntity types
                        description: `${parentCorpEntity.type} of ${entityNames.targetCompanyName}`
                    });
                }
                relationships.push({
                    source: parentEntityId,
                    target: childForParentLink, // Link to the child it owns
                    type: 'ownership', // or 'control'
                    // percentage: parentCorpEntity.ownership, // If available
                });
                childForParentLink = parentEntityId; // Next parent will own this entity
                currentParentId = parentCorpEntity.parentLink;
            } else {
                currentParentId = undefined;
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
    relationships: TransactionFlow['before']['relationships'], // Use the correct relationship type
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
        const childEntityId = this.generateEntityId(childCorpEntity.type, childCorpEntity.name, prefix);
        if (!entities.find(e => e.id === childEntityId)) {
          entities.push({
            id: childEntityId,
            name: childCorpEntity.name,
            type: childCorpEntity.type === 'subsidiary' ? 'subsidiary' : 'stockholder', // Adjust type as needed
            description: `${childCorpEntity.type} of ${parentCorpEntity.name}`,
            // percentage: childCorpEntity.ownership, // If available
          });
        }
        relationships.push({
          source: parentElementId,
          target: childEntityId,
          type: 'control', // Or 'ownership' if percentage is known
          // percentage: childCorpEntity.ownership, // If available
        });
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
    const relationships: TransactionFlow['after']['relationships'] = [];
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
      // Fallback if no shareholding.after: Acquirer takes a stake, previous shareholders might be diluted/exit
      const acquirerId = this.generateEntityId('buyer', entityNames.acquiringCompanyName, prefix);
      const acquiredPercentage = results.dealEconomics?.targetPercentage || 100; // Assume 100% if not specified
      
      entities.push({
        id: acquirerId,
        name: entityNames.acquiringCompanyName,
        type: 'buyer',
        percentage: acquiredPercentage,
        description: `${acquiredPercentage}% New Owner`,
      });
      relationships.push({
        source: acquirerId,
        target: targetId,
        type: 'ownership',
        percentage: acquiredPercentage,
      });

      if (acquiredPercentage < 100) {
        const remainingShareholderId = this.generateEntityId('stockholder','RemainingShareholders',prefix);
        entities.push({
            id: remainingShareholderId,
            name: "Remaining Original Shareholders",
            type: "stockholder",
            percentage: 100 - acquiredPercentage,
            description: `${100 - acquiredPercentage}% ownership`
        });
        relationships.push({
            source: remainingShareholderId,
            target: targetId,
            type: "ownership",
            percentage: 100 - acquiredPercentage
        });
      }
    }
    
    // 3. Add Acquirer's post-transaction corporate structure if it changes or integrates target
    // This part would involve showing the Target as a new subsidiary of the Acquirer, if applicable.
    const acquirerCorpEntity = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.acquiringCompanyName);
    const acquirerEntityNode = entities.find(e => e.name === entityNames.acquiringCompanyName && e.type === 'buyer');

    if (acquirerCorpEntity && acquirerEntityNode) {
        // Check if target becomes child of acquirer in corporate structure
        const targetIsChildOfAcquirer = results.corporateStructure?.relationships?.some(
            rel => rel.parent === acquirerCorpEntity.id && 
                   corporateStructureMap.get(rel.child)?.name === entityNames.targetCompanyName
        );

        if (targetIsChildOfAcquirer) {
            // Relationship might already be implicitly handled by target's ownership change.
            // If explicit corporate link needed:
            // relationships.push({ source: acquirerEntityNode.id, target: targetId, type: 'control' });
        }
        // Add acquirer's other children/parents from corporate structure
        this.addCorporateChildren(acquirerCorpEntity, acquirerEntityNode.id, entities, relationships, corporateStructureMap, prefix, new Set());
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

      // Link consideration from Buyer to former Target Shareholders (or Target itself if it's a share buyback by Target)
      // For simplicity, linking from main buyer to a generic "Sellers" or the Target
      const mainBuyer = entities.find(e => e.type === 'buyer');
      if (mainBuyer) {
        relationships.push({
          source: mainBuyer.id, // Buyer pays
          target: considerationId, // The payment itself
          type: 'consideration', // This edge type might need specific handling in diagram
          value: considerationAmount,
        });
        // Typically, consideration flows TO sellers. If sellers are explicit:
        const sellers = results.shareholding?.before?.map(s => this.generateEntityId('stockholder', s.name, 'before')) || [];
        // This part is complex as sellers in 'before' structure are distinct from 'after' structure entities.
        // For the diagram, it might be simpler to show payment from buyer, and then perhaps another edge from payment to target/sellers if needed.
        // Or, the payment is an outcome benefiting the sellers of the 'before' state.
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

    const steps = [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${entityNames.acquiringCompanyName} conducts due diligence and negotiates with ${entityNames.targetCompanyName}.`,
        entities: [beforeTargetId, this.generateEntityId('buyer', entityNames.acquiringCompanyName, 'before')].filter(Boolean) as string[]
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
        description: `Transfer of ${results.dealEconomics?.targetPercentage || 'control'} and ${considerationAmount > 0 ? `payment of ${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M consideration` : 'completion of transaction'}.`,
        entities: [afterTargetId, considerationNodeId, this.generateEntityId('buyer', entityNames.acquiringCompanyName, 'after')].filter(Boolean) as string[]
      }
    ];
    return steps;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
