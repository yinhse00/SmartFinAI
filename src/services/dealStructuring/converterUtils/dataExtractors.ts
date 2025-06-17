
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
  
  // Improved patterns that capture both number and multiplier together
  const patterns = [
    // HK$75 million, HKD 75M, etc. - captures number and multiplier
    /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)/i,
    // 75 million HKD, 75M HKD, etc. - captures number and multiplier
    /([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)\s*(?:hk\$|hkd|hong kong dollars?)/i,
    // Generic $75 million - captures number and multiplier
    /\$\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)/i,
    // 75 million (without currency) - captures number and multiplier
    /([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)/i,
    // Fallback patterns without multipliers (for exact amounts)
    /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)/i,
    /([\d,]+(?:\.\d+)?)\s*(?:hk\$|hkd|hong kong dollars?)/i,
    /\$\s*([\d,]+(?:\.\d+)?)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = description.match(pattern);
    
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const multiplier = match[2] ? match[2].toLowerCase() : null;
      
      console.log('Pattern matched:', pattern);
      console.log('Raw amount:', amount);
      console.log('Multiplier found:', multiplier);
      
      // Validation: check for reasonable bounds
      if (amount <= 0 || amount > 1000000) {
        console.log('Amount failed validation (out of reasonable bounds):', amount);
        continue;
      }
      
      let finalAmount = amount;
      
      // Apply multiplier only if it was captured in the same match
      if (multiplier) {
        if (multiplier === 'billion' || multiplier === 'b') {
          finalAmount = amount * 1000000000;
          console.log('Applied billion multiplier, final amount:', finalAmount);
        } else if (multiplier === 'million' || multiplier === 'm') {
          finalAmount = amount * 1000000;
          console.log('Applied million multiplier, final amount:', finalAmount);
        }
      } else {
        console.log('No multiplier in match, using raw amount:', finalAmount);
      }
      
      // Final validation: ensure we don't return impossible amounts
      if (finalAmount > 1000000000000) { // 1 trillion cap
        console.log('Final amount exceeds reasonable bounds, rejecting:', finalAmount);
        continue;
      }
      
      console.log('✅ Successfully extracted amount:', finalAmount);
      return finalAmount;
    }
  }

  console.log('No patterns matched, returning null');
  return null;
};
