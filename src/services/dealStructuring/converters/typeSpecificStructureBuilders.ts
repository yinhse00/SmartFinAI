
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { buildBeforeStructure } from '../converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from '../converterUtils/afterStructureBuilder';
import { CapitalRaisingStructureBuilders } from './capitalRaisingStructureBuilders';

export class TypeSpecificStructureBuilders {
  static buildTypeSpecificBeforeStructure(
    results: AnalysisResults, 
    entityNames: any, 
    corporateStructureMap: any, 
    transactionType: string
  ): TransactionFlow['before'] {
    if (transactionType === 'CAPITAL_RAISING') {
      // Use dedicated capital raising structure builder
      return CapitalRaisingStructureBuilders.buildCapitalRaisingBeforeStructure(
        results, 
        entityNames, 
        corporateStructureMap
      );
    } else {
      // For M&A and HYBRID, use standard structure
      return buildBeforeStructure(results, entityNames, corporateStructureMap);
    }
  }

  static buildTypeSpecificAfterStructure(
    results: AnalysisResults, 
    entityNames: any, 
    corporateStructureMap: any, 
    considerationAmount: number, 
    transactionType: string
  ): TransactionFlow['after'] {
    if (transactionType === 'CAPITAL_RAISING') {
      // Use dedicated capital raising structure builder
      return CapitalRaisingStructureBuilders.buildCapitalRaisingAfterStructure(
        results, 
        entityNames, 
        corporateStructureMap, 
        considerationAmount
      );
    } else {
      // For M&A and HYBRID, use standard structure
      return buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    }
  }
}
