
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { EnhancedTransactionEntity, EnhancedTransactionRelationship, EnhancedTransactionFlow } from '@/types/enhancedTransactionFlow';

export class GrokStructureExtractor {
  extractEnhancedTransactionFlow(results: AnalysisResults): EnhancedTransactionFlow {
    console.log('Extracting enhanced transaction flow from Grok analysis...');

    // Parse entities from structure recommendation and shareholding data
    const beforeEntities = this.extractEntitiesFromAnalysis(results, 'before');
    const afterEntities = this.extractEntitiesFromAnalysis(results, 'after');
    
    // Parse relationships from shareholding and corporate structure data
    const beforeRelationships = this.extractRelationshipsFromAnalysis(results, 'before');
    const afterRelationships = this.extractRelationshipsFromAnalysis(results, 'after');

    // Build corporate hierarchies
    const beforeHierarchy = this.buildCorporateHierarchy(beforeEntities, beforeRelationships);
    const afterHierarchy = this.buildCorporateHierarchy(afterEntities, afterRelationships);

    // Extract transaction steps from timeline
    const transactionSteps = this.extractTransactionSteps(results);

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(results, afterRelationships);

    // Validate data consistency
    const validationResults = this.validateTransactionData(results, beforeEntities, afterEntities);

    return {
      transactionId: `txn-${Date.now()}`,
      title: `${results.transactionType} Transaction`,
      description: this.extractTransactionDescription(results),
      transactionType: results.transactionType,
      before: {
        entities: beforeEntities,
        relationships: beforeRelationships,
        corporateStructure: beforeHierarchy
      },
      after: {
        entities: afterEntities,
        relationships: afterRelationships,
        corporateStructure: afterHierarchy
      },
      transactionSteps,
      keyMetrics,
      validationResults
    };
  }

  private extractEntitiesFromAnalysis(results: AnalysisResults, phase: 'before' | 'after'): EnhancedTransactionEntity[] {
    const entities: EnhancedTransactionEntity[] = [];
    
    // Extract from shareholding data
    const shareholdingData = phase === 'before' ? results.shareholding?.before : results.shareholding?.after;
    if (shareholdingData) {
      shareholdingData.forEach((shareholder, index) => {
        entities.push({
          id: `${phase}-shareholder-${index}`,
          name: shareholder.name,
          type: this.classifyShareholderType(shareholder.name),
          entityClass: this.classifyEntityClass(shareholder.name),
          percentage: shareholder.percentage,
          isControlling: shareholder.percentage > 50,
          votingRights: shareholder.percentage
        });
      });
    }

    // Extract from corporate structure
    if (results.corporateStructure?.entities) {
      results.corporateStructure.entities.forEach(entity => {
        entities.push({
          id: `${phase}-${entity.id}`,
          name: entity.name,
          type: entity.type as any,
          entityClass: entity.type === 'target' ? 'corporate' : 'corporate',
          description: entity.name.includes('Listed') ? 'Listed Entity' : undefined,
          listingStatus: entity.name.includes('Listed') ? 'listed' : 'private'
        });
      });
    }

    // Add consideration entity for after phase
    if (phase === 'after' && results.costs?.total) {
      entities.push({
        id: 'consideration-payment',
        name: `Consideration Payment`,
        type: 'consideration',
        entityClass: 'corporate',
        value: results.costs.total,
        currency: 'HKD',
        description: `Total consideration of HKD ${(results.costs.total / 1000000).toFixed(0)}M`
      });
    }

    return entities;
  }

  private extractRelationshipsFromAnalysis(results: AnalysisResults, phase: 'before' | 'after'): EnhancedTransactionRelationship[] {
    const relationships: EnhancedTransactionRelationship[] = [];
    
    // Extract ownership relationships from shareholding
    const shareholdingData = phase === 'before' ? results.shareholding?.before : results.shareholding?.after;
    if (shareholdingData && shareholdingData.length > 1) {
      const targetEntity = shareholdingData.find(s => s.name.toLowerCase().includes('target') || s.percentage < 100);
      
      shareholdingData.forEach((shareholder, index) => {
        if (shareholder.percentage > 0 && shareholder.percentage < 100) {
          relationships.push({
            id: `${phase}-ownership-${index}`,
            source: `${phase}-shareholder-${index}`,
            target: targetEntity ? `${phase}-target-company` : `${phase}-company`,
            type: 'ownership',
            percentage: shareholder.percentage,
            isPreTransaction: phase === 'before',
            isPostTransaction: phase === 'after'
          });
        }
      });
    }

    // Extract consideration relationships for after phase
    if (phase === 'after' && results.costs?.total) {
      const acquiringEntity = shareholdingData?.find(s => 
        s.name.toLowerCase().includes('acquir') || s.name.toLowerCase().includes('buyer')
      );
      
      if (acquiringEntity) {
        relationships.push({
          id: 'consideration-flow',
          source: `${phase}-shareholder-0`, // Assuming first is acquirer
          target: 'consideration-payment',
          type: 'consideration',
          value: results.costs.total,
          currency: 'HKD',
          paymentMethod: 'cash',
          terms: `Payment of HKD ${(results.costs.total / 1000000).toFixed(0)}M consideration`,
          timing: 'At completion',
          isPostTransaction: true
        });
      }
    }

    return relationships;
  }

  private buildCorporateHierarchy(entities: EnhancedTransactionEntity[], relationships: EnhancedTransactionRelationship[]) {
    // Find root entities (those that aren't targets of ownership relationships)
    const ownedEntities = new Set(relationships.filter(r => r.type === 'ownership').map(r => r.target));
    const rootEntities = entities.filter(e => !ownedEntities.has(e.id) && e.type !== 'consideration');
    
    const hierarchy = [];
    let level = 0;

    // Build hierarchy levels
    const processedEntities = new Set();
    const currentLevel = rootEntities.map(e => e.id);
    
    while (currentLevel.length > 0 && level < 5) { // Prevent infinite loops
      const nextLevel = [];
      
      hierarchy.push({
        parent: level === 0 ? 'root' : currentLevel[0],
        children: [...currentLevel],
        level
      });

      currentLevel.forEach(entityId => {
        processedEntities.add(entityId);
        // Find children (entities this one owns)
        const children = relationships
          .filter(r => r.source === entityId && r.type === 'ownership')
          .map(r => r.target)
          .filter(id => !processedEntities.has(id));
        
        nextLevel.push(...children);
      });

      currentLevel.length = 0;
      currentLevel.push(...nextLevel);
      level++;
    }

    return {
      rootEntity: rootEntities[0]?.id || 'unknown',
      hierarchy
    };
  }

  private extractTransactionSteps(results: AnalysisResults): any[] {
    const steps = [];
    
    if (results.timeline?.milestones) {
      results.timeline.milestones.forEach((milestone, index) => {
        steps.push({
          id: `step-${index + 1}`,
          title: milestone.milestone,
          description: milestone.description || milestone.milestone,
          timing: milestone.timeframe || 'TBD',
          entities: [], // Will be populated based on step analysis
          relationships: [],
          considerations: results.costs?.total ? [{
            amount: results.costs.total,
            currency: 'HKD',
            method: 'cash'
          }] : []
        });
      });
    }

    return steps;
  }

  private calculateKeyMetrics(results: AnalysisResults, relationships: EnhancedTransactionRelationship[]) {
    const acquisitionRel = relationships.find(r => r.type === 'ownership' && r.percentage && r.percentage > 0);
    const considerationRel = relationships.find(r => r.type === 'consideration');
    
    return {
      totalConsideration: considerationRel?.value || results.costs?.total || 0,
      currency: 'HKD',
      acquisitionPercentage: acquisitionRel?.percentage || 0,
      controlChange: (acquisitionRel?.percentage || 0) > 50,
      listingImpact: (acquisitionRel?.percentage || 0) > 30 ? 'Material' : 'Non-material'
    };
  }

  private validateTransactionData(results: AnalysisResults, beforeEntities: EnhancedTransactionEntity[], afterEntities: EnhancedTransactionEntity[]) {
    const warnings = [];
    const errors = [];
    
    // Check shareholding consistency
    const beforeTotal = beforeEntities.reduce((sum, e) => sum + (e.percentage || 0), 0);
    const afterTotal = afterEntities.reduce((sum, e) => sum + (e.percentage || 0), 0);
    
    if (Math.abs(beforeTotal - 100) > 1) {
      warnings.push(`Before transaction shareholding totals ${beforeTotal.toFixed(1)}% instead of 100%`);
    }
    
    if (Math.abs(afterTotal - 100) > 1) {
      warnings.push(`After transaction shareholding totals ${afterTotal.toFixed(1)}% instead of 100%`);
    }

    // Check entity consistency
    if (beforeEntities.length === 0) {
      errors.push('No entities found in before transaction state');
    }
    
    if (afterEntities.length === 0) {
      errors.push('No entities found in after transaction state');
    }

    const dataCompleteness = Math.min(1, (beforeEntities.length + afterEntities.length) / 6);

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      dataCompleteness
    };
  }

  private classifyShareholderType(name: string): EnhancedTransactionEntity['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('acquir') || lowerName.includes('buyer') || lowerName.includes('purchas')) {
      return 'buyer';
    }
    if (lowerName.includes('target')) {
      return 'target';
    }
    if (lowerName.includes('management') || lowerName.includes('director')) {
      return 'management';
    }
    return 'stockholder';
  }

  private classifyEntityClass(name: string): EnhancedTransactionEntity['entityClass'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fund') || lowerName.includes('investment')) {
      return 'fund';
    }
    if (lowerName.includes('public') || lowerName.includes('retail')) {
      return 'public';
    }
    if (lowerName.includes('institution') || lowerName.includes('bank')) {
      return 'institutional';
    }
    if (lowerName.includes('connected') || lowerName.includes('related')) {
      return 'connected';
    }
    return 'corporate';
  }

  private extractTransactionDescription(results: AnalysisResults): string {
    if (results.shareholding?.after && results.costs?.total) {
      const acquirer = results.shareholding.after.find(s => 
        s.name.toLowerCase().includes('acquir') || s.name.toLowerCase().includes('buyer')
      );
      
      if (acquirer) {
        return `${acquirer.name} acquiring ${acquirer.percentage}% stake for HKD ${(results.costs.total / 1000000).toFixed(0)}M`;
      }
    }
    
    return `${results.transactionType} transaction`;
  }
}

export const grokStructureExtractor = new GrokStructureExtractor();
