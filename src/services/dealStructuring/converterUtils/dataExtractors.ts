
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from '../enhancedAiAnalysisService';
import { dataConsistencyService } from '../dataConsistencyService';

export const extractConsiderationAmount = (
  results: AnalysisResults, 
  userInputs?: ExtractedUserInputs
): number => {
  console.log('=== DEBUGGING extractConsiderationAmount ===');
  console.log('Input results.dealEconomics:', results.dealEconomics);
  console.log('UserInputs received in extractor:', userInputs);
  
  // Use data consistency service to get authoritative amount with user input priority
  const consistentData = dataConsistencyService.extractConsistentData(results, userInputs);
  
  console.log('Data consistency service result:', {
    amount: consistentData.considerationAmount,
    source: consistentData.source,
    currency: consistentData.currency
  });
  
  return consistentData.considerationAmount;
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
      const rawAmount = parseFloat(match[1].replace(/,/g, ''));
      const multiplier = match[2] ? match[2].toLowerCase() : null;
      
      console.log('Pattern matched:', pattern);
      console.log('Raw amount:', rawAmount);
      console.log('Multiplier found:', multiplier);
      
      // Apply multiplier first, then validate the final amount
      let finalAmount = rawAmount;
      
      if (multiplier) {
        if (multiplier === 'billion' || multiplier === 'b') {
          finalAmount = rawAmount * 1000000000;
          console.log('Applied billion multiplier, final amount:', finalAmount);
        } else if (multiplier === 'million' || multiplier === 'm') {
          finalAmount = rawAmount * 1000000;
          console.log('Applied million multiplier, final amount:', finalAmount);
        }
      } else {
        console.log('No multiplier in match, using raw amount:', finalAmount);
      }
      
      // Validation AFTER multiplier application - this is the key fix
      if (finalAmount <= 0) {
        console.log('❌ Final amount is zero or negative, rejecting:', finalAmount);
        continue;
      }
      
      if (finalAmount > 1000000000000) { // 1 trillion cap
        console.log('❌ Final amount exceeds reasonable bounds (1 trillion), rejecting:', finalAmount);
        continue;
      }
      
      // Additional validation: ensure raw amount was reasonable before multiplication
      if (rawAmount <= 0 || rawAmount > 1000000) {
        console.log('❌ Raw amount failed validation (should be 1-1M range for multiplied values):', rawAmount);
        continue;
      }
      
      console.log('✅ Successfully extracted and validated amount:', finalAmount);
      return finalAmount;
    }
  }

  console.log('❌ No patterns matched, returning null');
  return null;
};
