import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { TransactionAnalysisRequest } from './aiAnalysisService';

export interface InputValidationResult {
  isValid: boolean;
  confidence: number;
  extractedInputs: ExtractedUserInputs;
  warnings: string[];
  suggestions: string[];
  validationDetails: {
    amountValidation: {
      found: boolean;
      source: string;
      confidence: number;
      rawValue?: string;
      processedValue?: number;
    };
    companyValidation: {
      targetFound: boolean;
      acquirerFound: boolean;
      confidence: number;
    };
    percentageValidation: {
      found: boolean;
      value?: number;
      confidence: number;
    };
  };
}

export interface InputExtractionPattern {
  pattern: RegExp;
  multiplier?: (value: number) => number;
  description: string;
  priority: number;
}

/**
 * Enhanced input validation service with robust extraction and confidence scoring
 */
export const inputValidationService = {
  /**
   * Extract and validate user inputs with comprehensive pattern matching
   */
  extractAndValidateInputs: (request: TransactionAnalysisRequest): InputValidationResult => {
    console.log('=== ENHANCED INPUT EXTRACTION & VALIDATION ===');
    console.log('Input description:', request.description);
    
    const extractedInputs: ExtractedUserInputs = {};
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Enhanced amount extraction with multiple pattern priorities
    const amountValidation = inputValidationService.extractAmount(request.description);
    if (amountValidation.found && amountValidation.processedValue) {
      extractedInputs.amount = amountValidation.processedValue;
      extractedInputs.currency = inputValidationService.extractCurrency(request.description);
    }
    
    // Enhanced company name extraction
    const companyValidation = inputValidationService.extractCompanyNames(request.description);
    if (companyValidation.targetFound) {
      // Extract from description - implementation would go here
    }
    if (companyValidation.acquirerFound) {
      // Extract from description - implementation would go here
    }
    
    // Enhanced percentage extraction
    const percentageValidation = inputValidationService.extractPercentage(request.description);
    if (percentageValidation.found && percentageValidation.value) {
      extractedInputs.acquisitionPercentage = percentageValidation.value;
    }
    
    // Calculate overall confidence and validation
    const overallConfidence = inputValidationService.calculateConfidence(
      amountValidation, companyValidation, percentageValidation
    );
    
    const isValid = overallConfidence > 0.6 && amountValidation.found;
    
    // Generate warnings and suggestions
    if (!amountValidation.found) {
      warnings.push('No transaction amount detected');
      suggestions.push('Include transaction amount (e.g., "HKD 75 million")');
    } else if (amountValidation.confidence < 0.8) {
      warnings.push('Transaction amount detection has low confidence');
      suggestions.push('Use clearer amount format (e.g., "HKD 75 million")');
    }
    
    if (!percentageValidation.found) {
      warnings.push('No acquisition percentage detected');
      suggestions.push('Specify percentage being acquired (e.g., "acquiring 51%")');
    }
    
    console.log('✅ Input validation completed:', {
      isValid,
      confidence: overallConfidence,
      extractedAmount: extractedInputs.amount,
      extractedPercentage: extractedInputs.acquisitionPercentage
    });
    
    return {
      isValid,
      confidence: overallConfidence,
      extractedInputs,
      warnings,
      suggestions,
      validationDetails: {
        amountValidation,
        companyValidation,
        percentageValidation
      }
    };
  },

  /**
   * Enhanced amount extraction with multiple pattern matching
   */
  extractAmount: (description: string) => {
    console.log('=== ENHANCED AMOUNT EXTRACTION ===');
    
    const patterns: InputExtractionPattern[] = [
      {
        pattern: /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(billion|b)/i,
        multiplier: (val) => val * 1000000000,
        description: 'HKD billion format',
        priority: 10
      },
      {
        pattern: /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(million|m)/i,
        multiplier: (val) => val * 1000000,
        description: 'HKD million format',
        priority: 9
      },
      {
        pattern: /([\d,]+(?:\.\d+)?)\s*(billion|b)\s*(?:hk\$|hkd|hong kong dollars?)/i,
        multiplier: (val) => val * 1000000000,
        description: 'Billion HKD format',
        priority: 8
      },
      {
        pattern: /([\d,]+(?:\.\d+)?)\s*(million|m)\s*(?:hk\$|hkd|hong kong dollars?)/i,
        multiplier: (val) => val * 1000000,
        description: 'Million HKD format',
        priority: 7
      },
      {
        pattern: /\$\s*([\d,]+(?:\.\d+)?)\s*(billion|b)/i,
        multiplier: (val) => val * 1000000000,
        description: 'Generic billion format',
        priority: 6
      },
      {
        pattern: /\$\s*([\d,]+(?:\.\d+)?)\s*(million|m)/i,
        multiplier: (val) => val * 1000000,
        description: 'Generic million format',
        priority: 5
      },
      {
        pattern: /([\d,]+(?:\.\d+)?)\s*(billion|b)/i,
        multiplier: (val) => val * 1000000000,
        description: 'Number billion format',
        priority: 4
      },
      {
        pattern: /([\d,]+(?:\.\d+)?)\s*(million|m)/i,
        multiplier: (val) => val * 1000000,
        description: 'Number million format',
        priority: 3
      }
    ];
    
    // Sort by priority and try each pattern
    patterns.sort((a, b) => b.priority - a.priority);
    
    for (const patternObj of patterns) {
      const match = description.match(patternObj.pattern);
      if (match) {
        const rawAmount = parseFloat(match[1].replace(/,/g, ''));
        const finalAmount = patternObj.multiplier ? patternObj.multiplier(rawAmount) : rawAmount;
        
        // Validation checks
        if (rawAmount <= 0 || rawAmount > 1000000) {
          console.log(`❌ Raw amount validation failed for ${patternObj.description}:`, rawAmount);
          continue;
        }
        
        if (finalAmount <= 0 || finalAmount > 1000000000000) {
          console.log(`❌ Final amount validation failed for ${patternObj.description}:`, finalAmount);
          continue;
        }
        
        console.log(`✅ Amount extracted using ${patternObj.description}:`, {
          raw: rawAmount,
          final: finalAmount,
          pattern: patternObj.pattern
        });
        
        return {
          found: true,
          source: patternObj.description,
          confidence: 0.9,
          rawValue: match[1],
          processedValue: finalAmount
        };
      }
    }
    
    console.log('❌ No amount patterns matched');
    return {
      found: false,
      source: 'none',
      confidence: 0
    };
  },

  /**
   * Extract currency from description
   */
  extractCurrency: (description: string): string => {
    if (/hk\$|hkd|hong kong dollar/i.test(description)) return 'HKD';
    if (/usd|us\$|dollar/i.test(description)) return 'USD';
    return 'HKD'; // Default
  },

  /**
   * Extract company names
   */
  extractCompanyNames: (description: string) => {
    const targetMatch = description.match(/(?:target|acquire|purchase|buy)\s+(?:company\s+)?([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))/i);
    const acquirerMatch = description.match(/([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))\s+(?:is|will)\s+(?:acquiring|purchasing|buying)/i);
    
    return {
      targetFound: !!targetMatch,
      acquirerFound: !!acquirerMatch,
      confidence: (targetMatch && acquirerMatch) ? 0.9 : (targetMatch || acquirerMatch) ? 0.6 : 0
    };
  },

  /**
   * Extract acquisition percentage
   */
  extractPercentage: (description: string) => {
    const match = description.match(/(?:acquire|purchase|buy|obtaining?)\s+(?:a\s+)?(\d+(?:\.\d+)?)%/i);
    
    if (match) {
      const percentage = parseFloat(match[1]);
      if (percentage > 0 && percentage <= 100) {
        return {
          found: true,
          value: percentage,
          confidence: 0.9
        };
      }
    }
    
    return {
      found: false,
      confidence: 0
    };
  },

  /**
   * Calculate overall confidence score
   */
  calculateConfidence: (amountValidation: any, companyValidation: any, percentageValidation: any): number => {
    let confidence = 0;
    let factors = 0;
    
    if (amountValidation.found) {
      confidence += amountValidation.confidence * 0.5; // Amount is 50% of confidence
      factors += 0.5;
    }
    
    if (percentageValidation.found) {
      confidence += percentageValidation.confidence * 0.3; // Percentage is 30% of confidence
      factors += 0.3;
    }
    
    if (companyValidation.targetFound || companyValidation.acquirerFound) {
      confidence += companyValidation.confidence * 0.2; // Companies are 20% of confidence
      factors += 0.2;
    }
    
    return factors > 0 ? confidence / factors : 0;
  }
};