import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export interface AuthorityEnforcementResult {
  enforcedResults: AnalysisResults;
  corrections: string[];
  corruptionDetected: boolean;
  protectionLevel: 'full' | 'partial' | 'none';
}

export interface AuthorityValidation {
  isAuthoritative: boolean;
  protectedFields: string[];
  corruptionRisks: string[];
  enforcementActions: string[];
}

export class InputAuthorityService {
  private static instance: InputAuthorityService;
  
  static getInstance(): InputAuthorityService {
    if (!InputAuthorityService.instance) {
      InputAuthorityService.instance = new InputAuthorityService();
    }
    return InputAuthorityService.instance;
  }

  /**
   * PHASE 3: Pre-processing authority enforcement
   * Ensures user inputs have absolute authority over AI-generated data
   */
  enforceInputAuthority(
    analysisResults: AnalysisResults, 
    userInputs: ExtractedUserInputs
  ): AuthorityEnforcementResult {
    console.log('=== INPUT AUTHORITY ENFORCEMENT SERVICE ===');
    console.log('User inputs to enforce:', userInputs);
    console.log('Original AI results preview:');
    console.log('- dealEconomics.purchasePrice:', analysisResults.dealEconomics?.purchasePrice);
    console.log('- valuation.transactionValue.amount:', analysisResults.valuation?.transactionValue?.amount);
    console.log('- transactionFlow.transactionContext.amount:', analysisResults.transactionFlow?.transactionContext?.amount);
    
    const corrections: string[] = [];
    let corruptionDetected = false;
    const enforcedResults = JSON.parse(JSON.stringify(analysisResults)) as AnalysisResults;
    
    // CRITICAL: Amount enforcement with corruption detection
    if (userInputs.amount && userInputs.amount > 0) {
      const targetAmount = userInputs.amount;
      
      // Detect and correct dealEconomics corruption
      if (enforcedResults.dealEconomics?.purchasePrice !== targetAmount) {
        const aiAmount = enforcedResults.dealEconomics?.purchasePrice;
        if (aiAmount && Math.abs(aiAmount - targetAmount) > 1000) {
          console.error('🚨 MAJOR CORRUPTION DETECTED in dealEconomics.purchasePrice');
          console.error(`AI generated: ${aiAmount}, User input: ${targetAmount}`);
          console.error('Difference:', Math.abs(aiAmount - targetAmount));
          corruptionDetected = true;
        }
        
        if (enforcedResults.dealEconomics) {
          enforcedResults.dealEconomics.purchasePrice = targetAmount;
          corrections.push(`🔒 ENFORCED dealEconomics.purchasePrice: ${aiAmount} → ${targetAmount}`);
        } else {
          enforcedResults.dealEconomics = {
            purchasePrice: targetAmount,
            currency: userInputs.currency || 'HKD',
            paymentStructure: 'Cash',
            valuationBasis: 'User Specified',
            targetPercentage: userInputs.acquisitionPercentage || 100
          };
          corrections.push(`🆕 CREATED dealEconomics with user amount: ${targetAmount}`);
        }
      }
      
      // Detect and correct valuation corruption
      if (enforcedResults.valuation?.transactionValue?.amount !== targetAmount) {
        const aiValuation = enforcedResults.valuation?.transactionValue?.amount;
        if (aiValuation && Math.abs(aiValuation - targetAmount) > 1000) {
          console.error('🚨 CORRUPTION DETECTED in valuation.transactionValue.amount');
          console.error(`AI generated: ${aiValuation}, User input: ${targetAmount}`);
          corruptionDetected = true;
        }
        
        if (enforcedResults.valuation) {
          enforcedResults.valuation.transactionValue.amount = targetAmount;
          enforcedResults.valuation.transactionValue.currency = userInputs.currency || enforcedResults.valuation.transactionValue.currency || 'HKD';
          enforcedResults.valuation.valuationRange = {
            low: targetAmount * 0.9,
            high: targetAmount * 1.1,
            midpoint: targetAmount
          };
          corrections.push(`🔒 ENFORCED valuation.transactionValue.amount: ${aiValuation} → ${targetAmount}`);
        }
      }
      
      // CRITICAL: Enforce transactionFlow.transactionContext.amount
      if (enforcedResults.transactionFlow?.transactionContext?.amount !== targetAmount) {
        const aiFlowAmount = enforcedResults.transactionFlow?.transactionContext?.amount;
        if (aiFlowAmount && Math.abs(aiFlowAmount - targetAmount) > 1000) {
          console.error('🚨 MAJOR CORRUPTION in transactionFlow.transactionContext.amount');
          console.error(`AI generated: ${aiFlowAmount}, User input: ${targetAmount}`);
          console.error('This is the ROOT CAUSE of Transaction Flow Diagram issues!');
          corruptionDetected = true;
        }
        
        if (enforcedResults.transactionFlow?.transactionContext) {
          enforcedResults.transactionFlow.transactionContext.amount = targetAmount;
          enforcedResults.transactionFlow.transactionContext.currency = userInputs.currency || 'HKD';
          corrections.push(`🔒 CRITICAL FIX: transactionFlow.transactionContext.amount: ${aiFlowAmount} → ${targetAmount}`);
        } else if (enforcedResults.transactionFlow) {
          enforcedResults.transactionFlow.transactionContext = {
            amount: targetAmount,
            currency: userInputs.currency || 'HKD'
          };
          corrections.push(`🆕 CREATED transactionFlow.transactionContext with user amount: ${targetAmount}`);
        }
      }
    }
    
    // Enforce currency consistency
    if (userInputs.currency) {
      const targetCurrency = userInputs.currency;
      
      if (enforcedResults.dealEconomics?.currency !== targetCurrency) {
        if (enforcedResults.dealEconomics) {
          enforcedResults.dealEconomics.currency = targetCurrency;
          corrections.push(`🔒 ENFORCED dealEconomics.currency: → ${targetCurrency}`);
        }
      }
      
      if (enforcedResults.valuation?.transactionValue?.currency !== targetCurrency) {
        if (enforcedResults.valuation?.transactionValue) {
          enforcedResults.valuation.transactionValue.currency = targetCurrency;
          corrections.push(`🔒 ENFORCED valuation.transactionValue.currency: → ${targetCurrency}`);
        }
      }
      
      if (enforcedResults.transactionFlow?.transactionContext?.currency !== targetCurrency) {
        if (enforcedResults.transactionFlow?.transactionContext) {
          enforcedResults.transactionFlow.transactionContext.currency = targetCurrency;
          corrections.push(`🔒 ENFORCED transactionFlow.transactionContext.currency: → ${targetCurrency}`);
        }
      }
    }
    
    // Enforce acquisition percentage
    if (userInputs.acquisitionPercentage && userInputs.acquisitionPercentage > 0) {
      const targetPercentage = userInputs.acquisitionPercentage;
      
      if (enforcedResults.dealEconomics?.targetPercentage !== targetPercentage) {
        if (enforcedResults.dealEconomics) {
          enforcedResults.dealEconomics.targetPercentage = targetPercentage;
          corrections.push(`🔒 ENFORCED dealEconomics.targetPercentage: → ${targetPercentage}%`);
        }
      }
    }
    
    // Determine protection level
    let protectionLevel: 'full' | 'partial' | 'none';
    if (userInputs.amount && userInputs.currency) {
      protectionLevel = 'full';
    } else if (userInputs.amount || userInputs.acquisitionPercentage) {
      protectionLevel = 'partial';
    } else {
      protectionLevel = 'none';
    }
    
    console.log('=== AUTHORITY ENFORCEMENT COMPLETE ===');
    console.log('Corrections applied:', corrections.length);
    console.log('Corruption detected:', corruptionDetected);
    console.log('Protection level:', protectionLevel);
    console.log('Final amounts:');
    console.log('- dealEconomics.purchasePrice:', enforcedResults.dealEconomics?.purchasePrice);
    console.log('- valuation.transactionValue.amount:', enforcedResults.valuation?.transactionValue?.amount);
    console.log('- transactionFlow.transactionContext.amount:', enforcedResults.transactionFlow?.transactionContext?.amount);
    
    if (corruptionDetected) {
      console.log('🛡️ USER INPUT CORRUPTION DETECTED AND CORRECTED');
    }
    
    return {
      enforcedResults,
      corrections,
      corruptionDetected,
      protectionLevel
    };
  }

  /**
   * Validate input authority before processing
   */
  validateInputAuthority(userInputs: ExtractedUserInputs): AuthorityValidation {
    console.log('=== VALIDATING INPUT AUTHORITY ===');
    
    const protectedFields: string[] = [];
    const corruptionRisks: string[] = [];
    const enforcementActions: string[] = [];
    
    let authorityScore = 0;
    
    if (userInputs.amount && userInputs.amount > 0) {
      protectedFields.push('amount');
      enforcementActions.push('Amount will be protected from AI override');
      authorityScore += 50; // Highest priority
      
      if (userInputs.amount > 1000000000) { // > 1B
        corruptionRisks.push('Large amount may trigger AI to generate alternative values');
      }
    } else {
      corruptionRisks.push('No amount specified - AI will generate potentially incorrect amounts');
    }
    
    if (userInputs.currency) {
      protectedFields.push('currency');
      enforcementActions.push('Currency will be enforced across all fields');
      authorityScore += 20;
    }
    
    if (userInputs.acquisitionPercentage && userInputs.acquisitionPercentage > 0) {
      protectedFields.push('acquisitionPercentage');
      enforcementActions.push('Acquisition percentage will be protected');
      authorityScore += 20;
    }
    
    if (userInputs.targetCompanyName) {
      protectedFields.push('targetCompanyName');
      enforcementActions.push('Target company name will be used');
      authorityScore += 5;
    }
    
    if (userInputs.acquiringCompanyName) {
      protectedFields.push('acquiringCompanyName');
      enforcementActions.push('Acquiring company name will be used');
      authorityScore += 5;
    }
    
    const isAuthoritative = authorityScore >= 50; // Need amount for authority
    
    console.log('Authority validation result:');
    console.log('- Is authoritative:', isAuthoritative);
    console.log('- Authority score:', authorityScore);
    console.log('- Protected fields:', protectedFields);
    console.log('- Enforcement actions:', enforcementActions);
    console.log('- Corruption risks:', corruptionRisks);
    
    return {
      isAuthoritative,
      protectedFields,
      corruptionRisks,
      enforcementActions
    };
  }

  /**
   * Create input protection markers for AI prompt
   */
  createProtectionMarkers(userInputs: ExtractedUserInputs): string {
    const markers: string[] = [];
    
    if (userInputs.amount) {
      markers.push(`🔒 PROTECTED AMOUNT: ${userInputs.currency || 'HKD'} ${userInputs.amount.toLocaleString()} - DO NOT CHANGE`);
    }
    
    if (userInputs.acquisitionPercentage) {
      markers.push(`🔒 PROTECTED PERCENTAGE: ${userInputs.acquisitionPercentage}% - DO NOT CHANGE`);
    }
    
    if (userInputs.targetCompanyName) {
      markers.push(`🔒 PROTECTED TARGET: ${userInputs.targetCompanyName} - DO NOT CHANGE`);
    }
    
    if (userInputs.acquiringCompanyName) {
      markers.push(`🔒 PROTECTED ACQUIRER: ${userInputs.acquiringCompanyName} - DO NOT CHANGE`);
    }
    
    if (markers.length > 0) {
      return `\n🛡️ USER INPUT PROTECTION ACTIVE:\n${markers.join('\n')}\n\n⚠️ CRITICAL: These values are AUTHORITATIVE user inputs. You MUST use them exactly as specified. DO NOT generate alternative amounts or percentages.\n`;
    }
    
    return '';
  }
}

export const inputAuthorityService = InputAuthorityService.getInstance();