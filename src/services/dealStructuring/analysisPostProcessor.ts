import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { considerationCalculator } from './considerationCalculator';

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
    
    if (userInputs && description) {
      const calculation = considerationCalculator.calculateConsideration(description, userInputs);
      if (calculation.isValid && calculation.calculationMethod === 'calculated') {
        calculatedConsideration = calculation.considerationAmount;
        processed._calculatedConsideration = calculatedConsideration;
        console.log('✅ Using calculated consideration (precedence):', calculatedConsideration);
      }
    }

    // Use user input amount if available (higher precedence than AI)
    if (userInputs?.amount && !calculatedConsideration) {
      calculatedConsideration = userInputs.amount;
      processed._calculatedConsideration = calculatedConsideration;
      console.log('✅ Using user input consideration:', calculatedConsideration);
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

    // Override AI amounts with calculated/user values - AUTHORITY PRECEDENCE
    if (calculatedConsideration) {
      // Update dealEconomics - override AI amounts
      if (processed.dealEconomics) {
        processed.dealEconomics.purchasePrice = calculatedConsideration;
      }

      // Update valuation - override AI amounts
      if (processed.valuation?.transactionValue) {
        processed.valuation.transactionValue.amount = calculatedConsideration;
      }

      // Update transactionFlow context - override AI amounts
      if (processed.transactionFlow?.transactionContext) {
        processed.transactionFlow.transactionContext.amount = calculatedConsideration;
      }

      // Update structure majorTerms if they contain incorrect amounts
      if (processed.structure?.majorTerms) {
        // Remove any pricing from suggestion field again (extra safety)
        if (processed.structure.majorTerms.suggestionConsideration) {
          processed.structure.majorTerms.suggestionConsideration = analysisPostProcessor.validateAndCleanSuggestionConsideration(
            processed.structure.majorTerms.suggestionConsideration
          );
        }
      }

      console.log('✅ Overrode all AI amounts with authoritative consideration:', calculatedConsideration);
    }

    console.log('✅ Post-processing completed with authority precedence');
    return processed;
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