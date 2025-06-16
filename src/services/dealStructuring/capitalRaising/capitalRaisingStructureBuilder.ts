
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CapitalRaisingContext, ShareholderAnalysis } from '@/types/capitalRaising';
import { CapitalRaisingClassifier } from './capitalRaisingClassifier';
import { ShareholderAnalyzer } from './shareholderAnalyzer';

export class CapitalRaisingStructureBuilder {
  static buildCapitalRaisingBeforeStructure(
    results: AnalysisResults,
    description: string
  ): TransactionFlow['before'] {
    const context = CapitalRaisingClassifier.extractCapitalRaisingContext(description, results);
    const shareholderAnalysis = ShareholderAnalyzer.analyzeShareholderStructure(results);
    
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    
    // 1. Create individual shareholder entities
    if (shareholderAnalysis.controllingShareholderName) {
      entities.push({
        id: `before-controlling-shareholder`,
        name: shareholderAnalysis.controllingShareholderName,
        type: 'shareholder',
        percentage: shareholderAnalysis.controllingPercentage,
        description: `Controlling shareholder (${shareholderAnalysis.controllingPercentage?.toFixed(1)}%)`
      });
      
      relationships.push({
        source: `before-controlling-shareholder`,
        target: `before-issuing-company`,
        type: 'ownership',
        percentage: shareholderAnalysis.controllingPercentage
      });
    }
    
    // Add other significant shareholders individually
    shareholderAnalysis.publicShareholders.forEach((shareholder, index) => {
      if (shareholder.percentage >= 5) { // Only show significant shareholders
        const entityId = `before-shareholder-${index}`;
        entities.push({
          id: entityId,
          name: shareholder.name,
          type: 'shareholder',
          percentage: shareholder.percentage,
          description: `${shareholder.percentage.toFixed(1)}% shareholder`
        });
        
        relationships.push({
          source: entityId,
          target: `before-issuing-company`,
          type: 'ownership',
          percentage: shareholder.percentage
        });
      }
    });
    
    // Group small shareholders
    const smallShareholders = shareholderAnalysis.publicShareholders.filter(sh => sh.percentage < 5);
    if (smallShareholders.length > 0) {
      const totalSmallPercentage = smallShareholders.reduce((sum, sh) => sum + sh.percentage, 0);
      entities.push({
        id: `before-other-shareholders`,
        name: 'Other Public Shareholders',
        type: 'shareholder',
        percentage: totalSmallPercentage,
        description: `Other shareholders (${totalSmallPercentage.toFixed(1)}%)`
      });
      
      relationships.push({
        source: `before-other-shareholders`,
        target: `before-issuing-company`,
        type: 'ownership',
        percentage: totalSmallPercentage
      });
    }
    
    // 2. Create issuing company entity
    entities.push({
      id: `before-issuing-company`,
      name: context.issuingCompany,
      type: 'target', // Using 'target' type for diagram processing compatibility
      description: `Listed company before ${context.type.replace('_', ' ')}`
    });
    
    return { entities, relationships };
  }
  
  static buildCapitalRaisingAfterStructure(
    results: AnalysisResults,
    description: string
  ): TransactionFlow['after'] {
    const context = CapitalRaisingClassifier.extractCapitalRaisingContext(description, results);
    const shareholderAnalysis = ShareholderAnalyzer.analyzeShareholderStructure(results);
    
    const entities: TransactionEntity[] = [];
    const relationships: AnyTransactionRelationship[] = [];
    
    // Calculate dilution based on after shareholding data
    const afterShareholders = results.shareholding?.after || [];
    
    // 1. Create issuing company entity (post-capital raising)
    entities.push({
      id: `after-issuing-company`,
      name: context.issuingCompany,
      type: 'target',
      description: `Listed company after ${context.type.replace('_', ' ')}`
    });
    
    // 2. Create diluted shareholder entities
    afterShareholders.forEach((shareholder, index) => {
      const beforeShareholder = results.shareholding?.before?.find(sh => sh.name === shareholder.name);
      const isExisting = !!beforeShareholder;
      
      let entityType: TransactionEntity['type'] = 'shareholder';
      let description = `${shareholder.percentage.toFixed(1)}% ownership`;
      
      if (isExisting) {
        const change = shareholder.percentage - (beforeShareholder?.percentage || 0);
        if (change > 0) {
          description += ` (increased by ${change.toFixed(1)}%)`;
          entityType = 'new_equity_recipient';
        } else if (change < 0) {
          description += ` (diluted by ${Math.abs(change).toFixed(1)}%)`;
        }
      } else {
        description = `New investor (${shareholder.percentage.toFixed(1)}%)`;
        entityType = 'new_equity_recipient';
      }
      
      // Don't create separate entity if controlling shareholder is underwriter and percentage increased
      const isControllingUnderwriter = shareholderAnalysis.isControllingShareholderUnderwriter && 
        shareholder.name === shareholderAnalysis.controllingShareholderName;
      
      if (!isControllingUnderwriter || !isExisting) {
        entities.push({
          id: `after-shareholder-${index}`,
          name: shareholder.name,
          type: entityType,
          percentage: shareholder.percentage,
          description
        });
        
        relationships.push({
          source: `after-shareholder-${index}`,
          target: `after-issuing-company`,
          type: 'ownership',
          percentage: shareholder.percentage
        });
      }
    });
    
    // 3. Add proceeds flow
    if (context.proceedsAmount > 0) {
      entities.push({
        id: `proceeds-flow`,
        name: 'Capital Proceeds',
        type: 'consideration',
        value: context.proceedsAmount,
        currency: context.currency,
        description: `${context.currency} ${(context.proceedsAmount / 1000000).toFixed(0)}M raised`
      });
      
      relationships.push({
        source: `proceeds-flow`,
        target: `after-issuing-company`,
        type: 'funding',
        value: context.proceedsAmount,
        currency: context.currency
      });
    }
    
    return { entities, relationships };
  }
}
