
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { buildBeforeStructure } from '../converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from '../converterUtils/afterStructureBuilder';

export class TypeSpecificStructureBuilders {
  static buildTypeSpecificBeforeStructure(
    results: AnalysisResults, 
    entityNames: any, 
    corporateStructureMap: any, 
    transactionType: string
  ): TransactionFlow['before'] {
    if (transactionType === 'CAPITAL_RAISING') {
      // For capital raising, before structure shows current shareholders of issuing company
      return buildBeforeStructure(results, entityNames, corporateStructureMap);
    } else {
      // For M&A, use standard before structure with proper entity names
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
      // For capital raising, after structure shows diluted shareholding
      return buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    } else {
      // For M&A, use standard after structure
      return buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    }
  }
}
