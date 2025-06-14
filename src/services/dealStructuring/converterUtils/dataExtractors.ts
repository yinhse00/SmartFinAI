
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator } from '../transactionDataValidator';

export const extractConsiderationAmount = (results: AnalysisResults): number => {
  if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
    console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
    return results.dealEconomics.purchasePrice;
  }
  return transactionDataValidator.extractConsiderationAmount(results);
};
