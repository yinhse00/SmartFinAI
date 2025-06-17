
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator } from '../transactionDataValidator';

export const extractConsiderationAmount = (results: AnalysisResults): number => {
  console.log('=== DEBUGGING extractConsiderationAmount ===');
  console.log('Input results.dealEconomics:', results.dealEconomics);
  
  if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice > 0) {
    console.log('Using purchase price from dealEconomics:', results.dealEconomics.purchasePrice);
    return results.dealEconomics.purchasePrice;
  }
  
  const validatorAmount = transactionDataValidator.extractConsiderationAmount(results);
  console.log('Validator extracted amount:', validatorAmount);
  return validatorAmount;
};

export const extractUserInputAmount = (description: string): number | null => {
  console.log('=== DEBUGGING extractUserInputAmount ===');
  console.log('Input description:', description);
  
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
      console.log('Pattern matched:', pattern, 'Raw amount:', amount);
      
      let finalAmount;
      if (description.toLowerCase().includes('billion') || description.toLowerCase().includes(' b ')) {
        finalAmount = amount * 1000000000;
        console.log('Billion detected, final amount:', finalAmount);
      } else if (description.toLowerCase().includes('million') || description.toLowerCase().includes(' m ')) {
        finalAmount = amount * 1000000;
        console.log('Million detected, final amount:', finalAmount);
      } else {
        finalAmount = amount;
        console.log('No multiplier, final amount:', finalAmount);
      }
      
      return finalAmount;
    }
  }

  console.log('No patterns matched, returning null');
  return null;
};
