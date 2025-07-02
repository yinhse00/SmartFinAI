import { TransactionAnalysisRequest } from './aiAnalysisService';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';

export interface InputValidationResult {
  isValid: boolean;
  confidence: number;
  extractedInputs: ExtractedUserInputs;
  validationLog: string[];
  warnings: string[];
  authorityLevel: 'user_authority' | 'ai_fallback' | 'no_data';
}

export interface InputExtractionPattern {
  name: string;
  pattern: RegExp;
  multiplier?: number;
  validator: (match: RegExpMatchArray) => number | null;
}

export class InputValidationService {
  private static instance: InputValidationService;
  
  static getInstance(): InputValidationService {
    if (!InputValidationService.instance) {
      InputValidationService.instance = new InputValidationService();
    }
    return InputValidationService.instance;
  }

  /**
   * PHASE 1: Enhanced input extraction with robust pattern matching
   */
  private getAmountExtractionPatterns(): InputExtractionPattern[] {
    return [
      {
        name: 'HKD with million/billion suffix',
        pattern: /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)\b/gi,
        validator: (match) => this.validateAndApplyMultiplier(match[1], match[2])
      },
      {
        name: 'Amount with HKD suffix',
        pattern: /([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)\s*(?:hk\$|hkd|hong kong dollars?)\b/gi,
        validator: (match) => this.validateAndApplyMultiplier(match[1], match[2])
      },
      {
        name: 'Generic $ with multiplier',
        pattern: /\$\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)\b/gi,
        validator: (match) => this.validateAndApplyMultiplier(match[1], match[2])
      },
      {
        name: 'Plain amount with multiplier',
        pattern: /\b([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)\b/gi,
        validator: (match) => this.validateAndApplyMultiplier(match[1], match[2])
      },
      {
        name: 'HKD exact amount',
        pattern: /(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\b/gi,
        validator: (match) => this.validateExactAmount(match[1])
      },
      {
        name: 'Amount with HKD',
        pattern: /([\d,]+(?:\.\d+)?)\s*(?:hk\$|hkd|hong kong dollars?)\b/gi,
        validator: (match) => this.validateExactAmount(match[1])
      }
    ];
  }

  private validateAndApplyMultiplier(amountStr: string, multiplierStr: string): number | null {
    const rawAmount = parseFloat(amountStr.replace(/,/g, ''));
    
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return null;
    }

    // Validate raw amount range for multiplied values
    if (rawAmount > 999999) { // > 999M before multiplication
      return null;
    }

    const multiplier = multiplierStr.toLowerCase();
    let finalAmount: number;

    if (multiplier === 'billion' || multiplier === 'b') {
      finalAmount = rawAmount * 1000000000;
    } else if (multiplier === 'million' || multiplier === 'm') {
      finalAmount = rawAmount * 1000000;
    } else {
      return null;
    }

    // Final validation
    if (finalAmount > 1000000000000) { // > 1 trillion
      return null;
    }

    return finalAmount;
  }

  private validateExactAmount(amountStr: string): number | null {
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    // For exact amounts, accept reasonable range
    if (amount > 1000000000000) { // > 1 trillion
      return null;
    }

    return amount;
  }

  /**
   * PHASE 1: Comprehensive input extraction with validation
   */
  extractAndValidateInputs(request: TransactionAnalysisRequest): InputValidationResult {
    console.log('=== INPUT VALIDATION SERVICE - EXTRACTION PHASE ===');
    console.log('Description:', request.description);
    
    const validationLog: string[] = [];
    const warnings: string[] = [];
    const extractedInputs: ExtractedUserInputs = {};
    
    // Extract consideration amount with enhanced pattern matching
    const amountResult = this.extractConsiderationAmount(request.description, validationLog);
    if (amountResult) {
      extractedInputs.amount = amountResult.amount;
      validationLog.push(`Amount extracted: ${amountResult.amount} (${amountResult.confidence}% confidence)`);
    } else {
      warnings.push('No consideration amount found in description');
    }

    // Extract currency
    const currencyResult = this.extractCurrency(request.description, validationLog);
    if (currencyResult) {
      extractedInputs.currency = currencyResult;
      validationLog.push(`Currency extracted: ${currencyResult}`);
    }

    // Extract acquisition percentage
    const percentageResult = this.extractAcquisitionPercentage(request.description, validationLog);
    if (percentageResult) {
      extractedInputs.acquisitionPercentage = percentageResult;
      validationLog.push(`Acquisition percentage extracted: ${percentageResult}%`);
    }

    // Extract company names
    const companyNames = this.extractCompanyNames(request.description, validationLog);
    if (companyNames.target) {
      extractedInputs.targetCompanyName = companyNames.target;
      validationLog.push(`Target company extracted: ${companyNames.target}`);
    }
    if (companyNames.acquiring) {
      extractedInputs.acquiringCompanyName = companyNames.acquiring;
      validationLog.push(`Acquiring company extracted: ${companyNames.acquiring}`);
    }

    // Calculate confidence and authority level
    const extractedFieldCount = Object.keys(extractedInputs).length;
    const totalPossibleFields = 5; // amount, currency, percentage, target, acquirer
    const confidence = extractedFieldCount / totalPossibleFields;
    
    let authorityLevel: 'user_authority' | 'ai_fallback' | 'no_data';
    if (extractedInputs.amount && extractedInputs.amount > 0) {
      authorityLevel = 'user_authority';
      validationLog.push('🔒 USER AUTHORITY: Amount detected - user input will be protected');
    } else if (extractedFieldCount > 0) {
      authorityLevel = 'ai_fallback';
      validationLog.push('⚠️ PARTIAL DATA: Some fields extracted - will use hybrid approach');
    } else {
      authorityLevel = 'no_data';
      validationLog.push('❌ NO DATA: No user inputs detected - will rely on AI generation');
    }

    const isValid = authorityLevel !== 'no_data';

    console.log('=== EXTRACTION RESULTS ===');
    console.log('Extracted inputs:', extractedInputs);
    console.log('Confidence:', confidence);
    console.log('Authority level:', authorityLevel);
    console.log('Validation log:', validationLog);

    return {
      isValid,
      confidence,
      extractedInputs,
      validationLog,
      warnings,
      authorityLevel
    };
  }

  private extractConsiderationAmount(description: string, log: string[]): { amount: number; confidence: number } | null {
    const patterns = this.getAmountExtractionPatterns();
    
    for (const pattern of patterns) {
      const matches = Array.from(description.matchAll(pattern.pattern));
      
      for (const match of matches) {
        log.push(`Trying pattern: ${pattern.name} - Match: "${match[0]}"`);
        
        const amount = pattern.validator(match);
        if (amount && amount > 0) {
          log.push(`✅ Successfully extracted amount: ${amount} using pattern: ${pattern.name}`);
          return { 
            amount, 
            confidence: 95 // High confidence for successful pattern match
          };
        } else {
          log.push(`❌ Pattern matched but validation failed: ${pattern.name}`);
        }
      }
    }
    
    log.push('❌ No valid amount patterns matched');
    return null;
  }

  private extractCurrency(description: string, log: string[]): string | null {
    const desc = description.toLowerCase();
    
    if (desc.includes('hk$') || desc.includes('hkd') || desc.includes('hong kong dollar')) {
      log.push('Currency detected: HKD');
      return 'HKD';
    } else if (desc.includes('usd') || desc.includes('us$') || desc.includes('dollar') && !desc.includes('hong kong')) {
      log.push('Currency detected: USD');
      return 'USD';
    } else if (desc.includes('cny') || desc.includes('rmb') || desc.includes('yuan')) {
      log.push('Currency detected: CNY');
      return 'CNY';
    }
    
    log.push('No specific currency detected, will use default');
    return null;
  }

  private extractAcquisitionPercentage(description: string, log: string[]): number | null {
    const patterns = [
      /(?:acquire|purchase|buy|obtaining?|acquiring)\s+(?:a\s+)?(\d+(?:\.\d+)?)%/gi,
      /(\d+(?:\.\d+)?)%\s+(?:of|stake|interest|shares)/gi,
      /(?:stake|interest|shares)\s+of\s+(\d+(?:\.\d+)?)%/gi
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const percentage = parseFloat(match[1]);
        if (percentage > 0 && percentage <= 100) {
          log.push(`Acquisition percentage extracted: ${percentage}%`);
          return percentage;
        }
      }
    }
    
    log.push('No acquisition percentage found');
    return null;
  }

  private extractCompanyNames(description: string, log: string[]): { target?: string; acquiring?: string } {
    const result: { target?: string; acquiring?: string } = {};
    
    // Enhanced company name patterns
    const companyPatterns = [
      /([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company|AG|SA|plc|PLC))/g,
      /([A-Z][A-Za-z\s&]{2,}(?:\s+(?:Ltd|Limited|Corp|Corporation|Inc|Company|AG|SA|plc|PLC))?)/g
    ];
    
    // Extract target company
    const targetPatterns = [
      /(?:target|acquire|purchase|buy|acquiring)\s+(?:company\s+)?([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))/gi,
      /([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))\s+(?:will be|is being)\s+(?:acquired|purchased|bought)/gi
    ];
    
    for (const pattern of targetPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        result.target = match[1].trim();
        log.push(`Target company identified: ${result.target}`);
        break;
      }
    }
    
    // Extract acquiring company
    const acquiringPatterns = [
      /([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))\s+(?:is|will)\s+(?:acquiring|purchasing|buying)/gi,
      /([A-Z][A-Za-z\s&]+(?:Ltd|Limited|Corp|Corporation|Inc|Company))\s+(?:plans to|intends to|seeks to)\s+(?:acquire|purchase|buy)/gi
    ];
    
    for (const pattern of acquiringPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        result.acquiring = match[1].trim();
        log.push(`Acquiring company identified: ${result.acquiring}`);
        break;
      }
    }
    
    return result;
  }

  /**
   * PHASE 2: Input authority validation before AI processing
   */
  validateInputAuthority(inputs: ExtractedUserInputs): {
    hasAuthority: boolean;
    protectedFields: string[];
    authorityScore: number;
  } {
    console.log('=== VALIDATING INPUT AUTHORITY ===');
    
    const protectedFields: string[] = [];
    let authorityScore = 0;
    
    if (inputs.amount && inputs.amount > 0) {
      protectedFields.push('amount');
      authorityScore += 40; // Amount is most critical
      console.log('🔒 AMOUNT PROTECTION ACTIVE:', inputs.amount);
    }
    
    if (inputs.currency) {
      protectedFields.push('currency');
      authorityScore += 20;
      console.log('🔒 CURRENCY PROTECTION ACTIVE:', inputs.currency);
    }
    
    if (inputs.acquisitionPercentage && inputs.acquisitionPercentage > 0) {
      protectedFields.push('acquisitionPercentage');
      authorityScore += 25;
      console.log('🔒 PERCENTAGE PROTECTION ACTIVE:', inputs.acquisitionPercentage);
    }
    
    if (inputs.targetCompanyName) {
      protectedFields.push('targetCompanyName');
      authorityScore += 10;
      console.log('🔒 TARGET COMPANY PROTECTION ACTIVE:', inputs.targetCompanyName);
    }
    
    if (inputs.acquiringCompanyName) {
      protectedFields.push('acquiringCompanyName');
      authorityScore += 5;
      console.log('🔒 ACQUIRING COMPANY PROTECTION ACTIVE:', inputs.acquiringCompanyName);
    }
    
    const hasAuthority = authorityScore >= 40; // Need at least amount or strong combination
    
    console.log('Authority validation result:');
    console.log('- Has authority:', hasAuthority);
    console.log('- Authority score:', authorityScore);
    console.log('- Protected fields:', protectedFields);
    
    return {
      hasAuthority,
      protectedFields,
      authorityScore
    };
  }
}

export const inputValidationService = InputValidationService.getInstance();