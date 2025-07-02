import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { considerationCalculator, ConsiderationCalculationResult } from './considerationCalculator';

export interface ProcessedAnalysisResults extends AnalysisResults {
  _postProcessed: boolean;
  _calculatedConsideration?: number;
}

/**
 * Post-process AI analysis results to fix field misuse and ensure data consistency
 */
export const analysisPostProcessor = {
  /**
   * Validate and clean AI-generated field content
   */
  validateAndCleanSuggestionConsideration: (content: string): string => {
    // Remove common pricing-related patterns
    const pricingPatterns = [
      /A fixed price of [^.]+\./gi,
      /HK\$[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M)?/gi,
      /\$[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M)?/gi,
      /[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M)\s*HK\$/gi,
      /consideration.*?[\d,]+/gi,
      /transaction.*?value.*?[\d,]+/gi,
      /purchase.*?price.*?[\d,]+/gi
    ];

    let cleaned = content;
    
    // Remove pricing information
    for (const pattern of pricingPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Clean up extra spaces and incomplete sentences
    cleaned = cleaned
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s*[,;.]\s*/, '')
      .replace(/\.\s*\./g, '.')
      .trim();

    // If content is now empty or too short, provide default strategic content
    if (cleaned.length < 20) {
      cleaned = 'Recommended structure optimizes transaction execution, regulatory compliance, and stakeholder value creation while minimizing market risk and execution complexity.';
    }

    return cleaned;
  },

  /**
   * Pre-display validation to ensure values are correct before showing to user
   */
  validateBeforeDisplay: (
    results: AnalysisResults,
    calculationResult?: ConsiderationCalculationResult
  ): { isValid: boolean; validationErrors: string[]; correctedValues?: any } => {
    const validationErrors: string[] = [];
    const correctedValues: any = {};

    if (!calculationResult) {
      return { isValid: true, validationErrors: [] };
    }

    const expectedAmount = calculationResult.considerationAmount;
    const tolerance = expectedAmount * 0.01; // 1% tolerance

    // Validate dealEconomics.purchasePrice
    if (results.dealEconomics?.purchasePrice && 
        Math.abs(results.dealEconomics.purchasePrice - expectedAmount) > tolerance) {
      validationErrors.push(`dealEconomics.purchasePrice (${results.dealEconomics.purchasePrice.toLocaleString()}) does not match calculated consideration (${expectedAmount.toLocaleString()})`);
      correctedValues.dealEconomicsPurchasePrice = expectedAmount;
    }

    // Validate valuation.transactionValue.amount
    if (results.valuation?.transactionValue?.amount && 
        Math.abs(results.valuation.transactionValue.amount - expectedAmount) > tolerance) {
      validationErrors.push(`valuation.transactionValue.amount (${results.valuation.transactionValue.amount.toLocaleString()}) does not match calculated consideration (${expectedAmount.toLocaleString()})`);
      correctedValues.valuationAmount = expectedAmount;
    }

    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      correctedValues: validationErrors.length > 0 ? correctedValues : undefined
    };
  },

  /**
   * Process analysis results to fix pricing misuse and apply calculated values
   */
  processAnalysisResults: (
    results: AnalysisResults,
    userInputs?: ExtractedUserInputs,
    description?: string
  ): ProcessedAnalysisResults => {
    console.log('=== POST-PROCESSING ANALYSIS RESULTS ===');
    
    const processed: ProcessedAnalysisResults = {
      ...results,
      _postProcessed: true
    };

    // Calculate proper consideration amount with authority precedence
    let calculatedConsideration: number | undefined;
    let calculationResult: ConsiderationCalculationResult | undefined;
    
    if (userInputs && description) {
      calculationResult = considerationCalculator.calculateConsideration(description, userInputs);
      if (calculationResult.isValid) {
        calculatedConsideration = calculationResult.considerationAmount;
        processed._calculatedConsideration = calculatedConsideration;
        
        // Log calculation details for transparency
        if (calculationResult.calculationMethod === 'calculated') {
          console.log('✅ Using calculated consideration (HIGHEST PRECEDENCE):', calculatedConsideration);
          console.log('📊 Calculation formula:', calculationResult.calculationDetails.calculationFormula);
        } else {
          console.log('✅ Using direct input consideration:', calculatedConsideration);
        }
      }
    }

    // PRE-DISPLAY VALIDATION: Check for incorrect AI amounts before processing
    if (calculationResult) {
      const validation = analysisPostProcessor.validateBeforeDisplay(results, calculationResult);
      if (!validation.isValid) {
        console.log('⚠️ PRE-DISPLAY VALIDATION FAILURES:');
        validation.validationErrors.forEach(error => console.log(`  - ${error}`));
        
        // Force correction of validated amounts
        if (validation.correctedValues) {
          calculatedConsideration = calculationResult.considerationAmount;
          processed._calculatedConsideration = calculatedConsideration;
        }
      }
    }

    // Fix suggestionConsideration field if it contains pricing
    if (processed.structure?.majorTerms?.suggestionConsideration) {
      const originalContent = processed.structure.majorTerms.suggestionConsideration;
      const cleanedContent = analysisPostProcessor.validateAndCleanSuggestionConsideration(originalContent);
      
      if (cleanedContent !== originalContent) {
        console.log('🔧 Cleaned pricing from suggestionConsideration');
        console.log('Original:', originalContent);
        console.log('Cleaned:', cleanedContent);
        
        processed.structure.majorTerms.suggestionConsideration = cleanedContent;
      }
    }

    // AUTHORITY ENFORCEMENT: Override ALL AI amounts with calculated/user values
    if (calculatedConsideration) {
      console.log('🔒 ENFORCING AUTHORITY PRECEDENCE - Overriding all AI amounts with:', calculatedConsideration);
      
      // 1. Update dealEconomics - COMPLETE OVERRIDE
      if (processed.dealEconomics) {
        const oldAmount = processed.dealEconomics.purchasePrice;
        processed.dealEconomics.purchasePrice = calculatedConsideration;
        if (oldAmount !== calculatedConsideration) {
          console.log(`🔧 CORRECTED dealEconomics.purchasePrice: ${oldAmount?.toLocaleString()} → ${calculatedConsideration.toLocaleString()}`);
        }
      }

      // 2. Update valuation - COMPLETE OVERRIDE
      if (processed.valuation?.transactionValue) {
        const oldAmount = processed.valuation.transactionValue.amount;
        processed.valuation.transactionValue.amount = calculatedConsideration;
        if (oldAmount !== calculatedConsideration) {
          console.log(`🔧 CORRECTED valuation.transactionValue.amount: ${oldAmount?.toLocaleString()} → ${calculatedConsideration.toLocaleString()}`);
        }
        
        // Update valuation range to match
        processed.valuation.valuationRange = {
          low: calculatedConsideration * 0.95,
          high: calculatedConsideration * 1.05,
          midpoint: calculatedConsideration
        };
      }

      // 3. Update transactionFlow context - COMPLETE OVERRIDE
      if (processed.transactionFlow?.transactionContext) {
        const oldAmount = processed.transactionFlow.transactionContext.amount;
        processed.transactionFlow.transactionContext.amount = calculatedConsideration;
        if (oldAmount !== calculatedConsideration) {
          console.log(`🔧 CORRECTED transactionFlow.transactionContext.amount: ${oldAmount?.toLocaleString()} → ${calculatedConsideration.toLocaleString()}`);
        }
      }

      // 4. Clean strategic considerations field
      if (processed.structure?.majorTerms?.suggestionConsideration) {
        processed.structure.majorTerms.suggestionConsideration = analysisPostProcessor.validateAndCleanSuggestionConsideration(
          processed.structure.majorTerms.suggestionConsideration
        );
      }

      // 5. FINAL VALIDATION: Ensure no traces of incorrect amounts remain
      analysisPostProcessor.performFinalValidation(processed, calculatedConsideration);
      
      console.log('✅ AUTHORITY ENFORCEMENT COMPLETE - All amounts standardized to:', calculatedConsideration.toLocaleString());
    }

    console.log('✅ Post-processing completed with authority precedence');
    return processed;
  },

  /**
   * Perform final validation to ensure no incorrect amounts remain in the results
   */
  performFinalValidation: (
    results: ProcessedAnalysisResults,
    expectedAmount: number
  ): void => {
    const tolerance = expectedAmount * 0.01; // 1% tolerance
    const issues: string[] = [];

    // Check all amount fields for consistency
    if (results.dealEconomics?.purchasePrice && 
        Math.abs(results.dealEconomics.purchasePrice - expectedAmount) > tolerance) {
      issues.push(`dealEconomics.purchasePrice still incorrect: ${results.dealEconomics.purchasePrice.toLocaleString()}`);
    }

    if (results.valuation?.transactionValue?.amount && 
        Math.abs(results.valuation.transactionValue.amount - expectedAmount) > tolerance) {
      issues.push(`valuation.transactionValue.amount still incorrect: ${results.valuation.transactionValue.amount.toLocaleString()}`);
    }

    if (results.transactionFlow?.transactionContext?.amount && 
        Math.abs(results.transactionFlow.transactionContext.amount - expectedAmount) > tolerance) {
      issues.push(`transactionFlow.transactionContext.amount still incorrect: ${results.transactionFlow.transactionContext.amount.toLocaleString()}`);
    }

    if (issues.length > 0) {
      console.error('🚨 FINAL VALIDATION FAILED - Incorrect amounts still present:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      console.error(`Expected amount: ${expectedAmount.toLocaleString()}`);
    } else {
      console.log('✅ FINAL VALIDATION PASSED - All amounts are consistent');
    }
  },

  /**
   * Check if analysis results contain pricing in strategic fields
   */
  hasPricingInStrategicFields: (results: AnalysisResults): boolean => {
    const content = results.structure?.majorTerms?.suggestionConsideration || '';
    
    const pricingIndicators = [
      /fixed price/i,
      /HK\$/,
      /\$[\d,]/,
      /[\d,]+\s*(?:billion|million)/i,
      /consideration.*?[\d,]/i
    ];

    return pricingIndicators.some(pattern => pattern.test(content));
  }
};