
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator } from '../transactionDataValidator';

export const extractConsiderationAmount = (results: AnalysisResults): number => {
  if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
    console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
    return results.dealEconomics.purchasePrice;
  }
  return transactionDataValidator.extractConsiderationAmount(results);
};

export const extractUserInputAmount = (description: string): number | null => {
  // Extract amounts in various formats
  const patterns = [
    // HK$75 million, HKD 75M, etc.
    /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(?:million|m)/i,
    // 75 million HKD, 75M HKD, etc.
    /([\d,]+(?:\.\d+)?)\s*(?:million|m)\s*(?:hk\$|hkd|hong kong dollars?)/i,
    // Generic $75 million
    /\$\s*([\d,]+(?:\.\d+)?)\s*(?:million|m)/i,
    // 75 million (without currency)
    /([\d,]+(?:\.\d+)?)\s*(?:million|m)/i,
    // Billion amounts
    /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(?:billion|b)/i,
    /([\d,]+(?:\.\d+)?)\s*(?:billion|b)\s*(?:hk\$|hkd|hong kong dollars?)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (description.toLowerCase().includes('billion') || description.toLowerCase().includes(' b ')) {
        return amount * 1000000000;
      } else if (description.toLowerCase().includes('million') || description.toLowerCase().includes(' m ')) {
        return amount * 1000000;
      } else {
        return amount;
      }
    }
  }

  return null;
};
