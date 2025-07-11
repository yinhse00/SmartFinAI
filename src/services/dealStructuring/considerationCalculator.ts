import { ExtractedUserInputs } from './enhancedAiAnalysisService';

export interface ConsiderationCalculationResult {
  considerationAmount: number;
  calculationMethod: 'calculated' | 'direct_input' | 'ai_fallback';
  calculationDetails: {
    targetValuation?: number;
    acquisitionPercentage?: number;
    calculationFormula?: string;
    directAmount?: number;
  };
  confidence: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface ExtractedValues {
  marketCap?: number;
  targetValuation?: number;
  directConsideration?: number;
  acquisitionPercentage?: number;
  currency?: string;
}

/**
 * Service to calculate consideration amount from extracted values
 */
export const considerationCalculator = {
  /**
   * Extract multiple values from description with context awareness
   */
  extractValues: (description: string): ExtractedValues => {
    console.log('=== EXTRACTING MULTIPLE VALUES WITH CONTEXT ===');
    console.log('Description:', description);
    
    const values: ExtractedValues = {};
    
    // Extract market cap (look for market cap context)
    const marketCapPatterns = [
      /(?:market\s+cap|market\s+capitalization|company\s+valued?\s+at)\s+(?:of\s+)?(?:approximately\s+)?(?:hk\$|hkd|hong kong dollars?|\$)?\s*([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)/i,
      /([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)\s+(?:market\s+cap|market\s+capitalization)/i
    ];
    
    for (const pattern of marketCapPatterns) {
      const match = description.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2].toLowerCase();
        values.marketCap = unit.startsWith('b') ? value * 1000000000 : value * 1000000;
        console.log('✅ Market cap extracted:', values.marketCap);
        break;
      }
    }
    
    // Extract target valuation (look for target/valuation context)
    const targetValuationPatterns = [
      /(?:total\s+valuation|target\s+valuation|valuation\s+of\s+target|target\s+company\s+valued?\s+at)\s+(?:of\s+)?(?:approximately\s+)?(?:hk\$|hkd|hong kong dollars?|\$)?\s*([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)/i,
      /([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)\s+(?:target\s+valuation|valuation)/i
    ];
    
    for (const pattern of targetValuationPatterns) {
      const match = description.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2].toLowerCase();
        values.targetValuation = unit.startsWith('b') ? value * 1000000000 : value * 1000000;
        console.log('✅ Target valuation extracted:', values.targetValuation);
        break;
      }
    }
    
    // Extract direct consideration (look for purchase/consideration context)
    const considerationPatterns = [
      /(?:purchase\s+price|consideration|total\s+consideration|buying\s+for)\s+(?:of\s+)?(?:approximately\s+)?(?:hk\$|hkd|hong kong dollars?|\$)?\s*([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)/i,
      /([\d,]+(?:\.\d+)?)\s*(billion|b|million|m)\s+(?:consideration|purchase\s+price)/i
    ];
    
    for (const pattern of considerationPatterns) {
      const match = description.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2].toLowerCase();
        values.directConsideration = unit.startsWith('b') ? value * 1000000000 : value * 1000000;
        console.log('✅ Direct consideration extracted:', values.directConsideration);
        break;
      }
    }
    
    // Extract acquisition percentage
    const percentagePatterns = [
      /(?:purchase|acquire|buy|obtaining?)\s+(?:a\s+)?([\d,]+(?:\.\d+)?)%/i,
      /([\d,]+(?:\.\d+)?)%\s+(?:equity|stake|ownership|shares?)/i
    ];
    
    for (const pattern of percentagePatterns) {
      const match = description.match(pattern);
      if (match) {
        values.acquisitionPercentage = parseFloat(match[1]);
        console.log('✅ Acquisition percentage extracted:', values.acquisitionPercentage);
        break;
      }
    }
    
    // Extract currency
    if (/hk\$|hkd|hong kong dollar/i.test(description)) {
      values.currency = 'HKD';
    } else if (/usd|us\$|dollar/i.test(description)) {
      values.currency = 'USD';
    } else {
      values.currency = 'HKD'; // Default
    }
    
    console.log('🔍 Extracted values summary:', values);
    return values;
  },

  /**
   * Calculate consideration amount using extracted values and user inputs
   */
  calculateConsideration: (
    description: string, 
    userInputs?: ExtractedUserInputs,
    aiEstimatedAmount?: number
  ): ConsiderationCalculationResult => {
    console.log('=== CALCULATING CONSIDERATION AMOUNT ===');
    console.log('User inputs:', userInputs);
    console.log('AI estimated amount:', aiEstimatedAmount);
    
    const extractedValues = considerationCalculator.extractValues(description);
    const validationErrors: string[] = [];
    
    // ABSOLUTE PRIORITY: Calculate from target valuation × acquisition percentage
    // This MUST override any AI amounts when both inputs are available
    let targetValuation: number | undefined;
    let acquisitionPercentage: number | undefined;
    
    // PRIORITY 1: User provided target valuation + acquisition percentage
    if (userInputs?.targetValuation && userInputs?.acquisitionPercentage) {
      targetValuation = userInputs.targetValuation;
      acquisitionPercentage = userInputs.acquisitionPercentage;
      const calculatedConsideration = targetValuation * (acquisitionPercentage / 100);
      
      console.log('🎯 PRIORITY 1: User provided target valuation and percentage');
      console.log(`Target Valuation: ${targetValuation.toLocaleString()}, Percentage: ${acquisitionPercentage}%`);
      console.log(`Calculated consideration: ${calculatedConsideration.toLocaleString()}`);
      
      return {
        considerationAmount: calculatedConsideration,
        calculationMethod: 'calculated',
        calculationDetails: {
          targetValuation,
          acquisitionPercentage,
          calculationFormula: `${targetValuation.toLocaleString()} × ${acquisitionPercentage}% = ${calculatedConsideration.toLocaleString()}`
        },
        confidence: 0.95,
        isValid: true,
        validationErrors: []
      };
    } 
    // PRIORITY 2: User provided consideration directly
    else if (userInputs?.amount && userInputs?.acquisitionPercentage) {
      const userConsideration = userInputs.amount;
      acquisitionPercentage = userInputs.acquisitionPercentage;
      targetValuation = userConsideration / (acquisitionPercentage / 100);
      
      console.log('🎯 PRIORITY 2: User provided consideration and percentage');
      console.log(`Consideration: ${userConsideration.toLocaleString()}, Percentage: ${acquisitionPercentage}%`);
      console.log(`Calculated target valuation: ${targetValuation.toLocaleString()}`);
      
      return {
        considerationAmount: userConsideration,
        calculationMethod: 'direct_input',
        calculationDetails: {
          targetValuation,
          acquisitionPercentage,
          calculationFormula: `${userConsideration.toLocaleString()} for ${acquisitionPercentage}% stake`
        },
        confidence: 0.95,
        isValid: true,
        validationErrors: []
      };
    } else {
      // Fallback to extracted values for traditional calculation
      targetValuation = userInputs?.targetValuation || extractedValues.targetValuation;
      acquisitionPercentage = userInputs?.acquisitionPercentage || extractedValues.acquisitionPercentage;
    }
    
    if (targetValuation && acquisitionPercentage) {
      const calculatedConsideration = targetValuation * (acquisitionPercentage / 100);
      
      console.log('🔒 CALCULATION AUTHORITY ENFORCED:');
      console.log(`${targetValuation.toLocaleString()} × ${acquisitionPercentage}% = ${calculatedConsideration.toLocaleString()}`);
      
      // Reject any AI amount that doesn't match calculation when we have valid inputs
      if (aiEstimatedAmount && Math.abs(aiEstimatedAmount - calculatedConsideration) > calculatedConsideration * 0.01) {
        console.log(`⚠️ REJECTING AI amount ${aiEstimatedAmount.toLocaleString()} - using calculated ${calculatedConsideration.toLocaleString()}`);
      }
      
      // Standard validations
      if (calculatedConsideration > targetValuation) {
        validationErrors.push(`Calculated consideration exceeds target valuation`);
      }
      
      if (extractedValues.marketCap && calculatedConsideration > extractedValues.marketCap) {
        validationErrors.push(`Calculated consideration exceeds market cap`);
      }
      
      if (acquisitionPercentage <= 0 || acquisitionPercentage > 100) {
        validationErrors.push(`Invalid acquisition percentage: ${acquisitionPercentage}%`);
      }
      
      return {
        considerationAmount: calculatedConsideration,
        calculationMethod: 'calculated',
        calculationDetails: {
          targetValuation,
          acquisitionPercentage,
          calculationFormula: `${targetValuation.toLocaleString()} × ${acquisitionPercentage}% = ${calculatedConsideration.toLocaleString()}`
        },
        confidence: 0.95,
        isValid: validationErrors.length === 0,
        validationErrors
      };
    }
    
    // Priority 2: Direct consideration input from user (when no calculation possible)
    if (userInputs?.amount && !userInputs?.acquisitionPercentage) {
      return {
        considerationAmount: userInputs.amount,
        calculationMethod: 'direct_input',
        calculationDetails: {
          directAmount: userInputs.amount
        },
        confidence: 0.9,
        isValid: true,
        validationErrors: []
      };
    }
    
    // Priority 3: Use direct consideration from extraction
    if (extractedValues.directConsideration) {
      return {
        considerationAmount: extractedValues.directConsideration,
        calculationMethod: 'direct_input',
        calculationDetails: {
          directAmount: extractedValues.directConsideration
        },
        confidence: 0.8,
        isValid: true,
        validationErrors: []
      };
    }
    
    // Priority 4: Fallback to AI estimated amount (with strict validation)
    if (aiEstimatedAmount) {
      // Check if AI amount seems reasonable (not market cap when we expect consideration)
      if (extractedValues.marketCap && Math.abs(aiEstimatedAmount - extractedValues.marketCap) < extractedValues.marketCap * 0.1) {
        validationErrors.push('AI amount appears to be market cap instead of consideration');
      }
      
      // Additional validation: AI amount should be reasonable compared to target valuation
      if (targetValuation && Math.abs(aiEstimatedAmount - targetValuation) < targetValuation * 0.1) {
        validationErrors.push('AI amount appears to be target valuation instead of consideration');
      }
      
      return {
        considerationAmount: aiEstimatedAmount,
        calculationMethod: 'ai_fallback',
        calculationDetails: {
          directAmount: aiEstimatedAmount
        },
        confidence: 0.3, // Lower confidence for AI fallback
        isValid: validationErrors.length === 0,
        validationErrors
      };
    }
    
    // No valid consideration found
    validationErrors.push('No valid consideration amount could be determined');
    return {
      considerationAmount: 0,
      calculationMethod: 'ai_fallback',
      calculationDetails: {},
      confidence: 0,
      isValid: false,
      validationErrors
    };
  },

  /**
   * Create enhanced user inputs with calculated consideration
   */
  enhanceUserInputs: (
    description: string,
    userInputs?: ExtractedUserInputs
  ): ExtractedUserInputs & { calculationResult?: ConsiderationCalculationResult } => {
    const calculation = considerationCalculator.calculateConsideration(description, userInputs);
    
    const enhanced: ExtractedUserInputs & { calculationResult?: ConsiderationCalculationResult } = {
      ...userInputs,
      calculationResult: calculation
    };
    
    // CRITICAL: Always preserve user input consideration amount
    enhanced.amount = calculation.considerationAmount;
    if (calculation.calculationDetails.acquisitionPercentage) {
      enhanced.acquisitionPercentage = calculation.calculationDetails.acquisitionPercentage;
    }
    console.log('🎯 Enhanced with authoritative consideration:', enhanced.amount);
    
    console.log('🚀 Enhanced user inputs:', enhanced);
    return enhanced;
  },

  /**
   * Validate amount before display to prevent incorrect values
   */
  validateAmountForDisplay: (
    amount: number,
    calculationResult?: ConsiderationCalculationResult
  ): { isValid: boolean; correctedAmount?: number; validationMessage?: string } => {
    if (!calculationResult) {
      return { isValid: true };
    }

    const expectedAmount = calculationResult.considerationAmount;
    const tolerance = expectedAmount * 0.01; // 1% tolerance

    if (Math.abs(amount - expectedAmount) > tolerance) {
      return {
        isValid: false,
        correctedAmount: expectedAmount,
        validationMessage: `Amount ${amount.toLocaleString()} does not match calculated consideration ${expectedAmount.toLocaleString()}`
      };
    }

    return { isValid: true };
  }
};