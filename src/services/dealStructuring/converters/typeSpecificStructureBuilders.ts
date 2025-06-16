
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { buildBeforeStructure } from '../converterUtils/beforeStructureBuilder';
import { buildAfterStructure } from '../converterUtils/afterStructureBuilder';
import { CapitalRaisingStructureBuilder } from '../capitalRaising/capitalRaisingStructureBuilder';

export class TypeSpecificStructureBuilders {
  static buildTypeSpecificBeforeStructure(
    results: AnalysisResults, 
    entityNames: any, 
    corporateStructureMap: any, 
    transactionType: string,
    description?: string
  ): TransactionFlow['before'] {
    if (transactionType === 'CAPITAL_RAISING') {
      // Use capital raising specific structure builder
      return CapitalRaisingStructureBuilder.buildCapitalRaisingBeforeStructure(
        results, 
        description || ''
      );
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
    transactionType: string,
    description?: string
  ): TransactionFlow['after'] {
    if (transactionType === 'CAPITAL_RAISING') {
      // Use capital raising specific structure builder
      return CapitalRaisingStructureBuilder.buildCapitalRaisingAfterStructure(
        results, 
        description || ''
      );
    } else {
      // For M&A, use standard after structure
      return buildAfterStructure(results, entityNames, corporateStructureMap, considerationAmount);
    }
  }
}
