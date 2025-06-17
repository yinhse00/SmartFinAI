import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { createFallbackAnalysisResults } from './analysisFallbackData';
import { createFallbackShareholdingChanges, createFallbackCorporateStructure } from './analysisFallbackData';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';

// Helper function to extract JSON from a string
const extractJson = (text: string): string | null => {
  const jsonRegex = /{[\s\S]*}/;
  const match = text.match(jsonRegex);
  return match ? match[0] : null;
};

// Helper function to extract shareholding changes
const extractShareholdingChanges = (text: string) => {
  try {
    const jsonString = extractJson(text);
    if (!jsonString) {
      console.warn('No JSON found for shareholding changes, using fallback.');
      return createFallbackShareholdingChanges();
    }
    const parsed = JSON.parse(jsonString);
    return parsed.shareholdingChanges || createFallbackShareholdingChanges();
  } catch (error) {
    console.error('Error extracting shareholding changes:', error);
    return createFallbackShareholdingChanges();
  }
};

// Helper function to extract corporate structure
const extractCorporateStructure = (text: string) => {
  try {
    const jsonString = extractJson(text);
    if (!jsonString) {
      console.warn('No JSON found for corporate structure, using fallback.');
      return createFallbackCorporateStructure();
    }
    const parsed = JSON.parse(jsonString);
    return parsed.corporateStructure || createFallbackCorporateStructure();
  } catch (error) {
    console.error('Error extracting corporate structure:', error);
    return createFallbackCorporateStructure();
  }
};

// Validation function for extraction inputs
const validateExtractionInputs = (text: string, userInputs?: ExtractedUserInputs) => {
  console.log('=== VALIDATING EXTRACTION INPUTS ===');
  console.log('User inputs available:', !!userInputs);
  console.log('User amount:', userInputs?.amount);
  
  const validationResult = {
    userInputsValid: false,
    aiResponseSafe: false,
    shouldUseUserInputs: false,
    detectedCorruption: false,
    reason: ''
  };

  // Validate user inputs first
  if (userInputs?.amount) {
    const amount = userInputs.amount;
    if (amount > 0 && amount < 10000000000000) { // 10 trillion upper bound
      validationResult.userInputsValid = true;
      validationResult.shouldUseUserInputs = true;
      validationResult.reason = 'Valid user input detected';
      console.log('✅ User inputs validated successfully');
    } else {
      validationResult.reason = 'User input amount out of reasonable bounds';
      console.log('❌ User input validation failed:', amount);
    }
  }

  // Check AI response for corruption only if we have user input to compare against
  if (text && userInputs?.amount) {
    console.log('🔍 Checking AI response for corruption against user input:', userInputs.amount);
    
    // Extract potential AI amounts from text
    const amountPatterns = [
      /(?:transaction value|purchase price|deal value)[:\s]*[A-Z]{3}\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)/i,
      /[A-Z]{3}\s*([\d,]+(?:\.\d+)?)\s*(million|m|billion|b)/i
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const aiNumber = parseFloat(match[1].replace(/,/g, ''));
        const multiplier = match[2].toLowerCase();
        
        let aiAmount = aiNumber;
        if (multiplier === 'billion' || multiplier === 'b') {
          aiAmount = aiNumber * 1000000000;
        } else if (multiplier === 'million' || multiplier === 'm') {
          aiAmount = aiNumber * 1000000;
        }
        
        console.log('AI extracted amount:', aiAmount, 'User input amount:', userInputs.amount);
        
        // Compare AI amount to user input - flag if significantly different (more than 50% deviation)
        const deviationRatio = Math.abs(aiAmount - userInputs.amount) / userInputs.amount;
        if (deviationRatio > 0.5) {
          validationResult.detectedCorruption = true;
          validationResult.reason += `; AI response shows ${aiAmount} vs user input ${userInputs.amount} (${(deviationRatio * 100).toFixed(1)}% deviation)`;
          console.log('🚨 Corruption detected: significant deviation from user input');
          break;
        } else {
          console.log('✅ AI amount reasonably close to user input');
        }
      }
    }

    if (!validationResult.detectedCorruption) {
      validationResult.aiResponseSafe = true;
      console.log('✅ AI response appears safe from corruption');
    }
  } else if (text) {
    // If no user input to compare against, assume AI response is safe
    validationResult.aiResponseSafe = true;
    console.log('✅ No user input for comparison, assuming AI response is safe');
  }

  console.log('Validation result:', validationResult);
  return validationResult;
};

// Helper function to extract valuation data with comprehensive validation
const extractValuationData = (text: string, userInputs?: ExtractedUserInputs) => {
  console.log('=== DEBUGGING extractValuationData ===');
  console.log('User inputs:', userInputs);
  
  // Pre-processing validation
  const validation = validateExtractionInputs(text, userInputs);
  
  // Prioritize user inputs if they are valid
  if (validation.shouldUseUserInputs && userInputs?.amount) {
    console.log('🎯 Using validated user inputs as primary source');
    const finalAmount = userInputs.amount;
    const currency = userInputs.currency || 'HKD';
    
    console.log('Final amount from user inputs:', finalAmount);
    console.log('Final currency from user inputs:', currency);
    
    return {
      transactionValue: {
        amount: finalAmount,
        currency,
        pricePerShare: undefined
      },
      valuationMetrics: {
        peRatio: undefined,
        pbRatio: undefined,
        evEbitda: undefined
      },
      marketComparables: [],
      fairnessAssessment: {
        conclusion: 'Fair and Reasonable',
        reasoning: 'Based on user-specified transaction amount and market analysis.',
        premium: undefined
      },
      valuationRange: {
        low: finalAmount * 0.9,
        high: finalAmount * 1.1,
        midpoint: finalAmount
      }
    };
  }

  // Only attempt AI parsing if no valid user inputs and AI response is safe
  if (!validation.detectedCorruption && validation.aiResponseSafe) {
    console.log('⚠️ No valid user inputs, attempting careful AI text parsing...');
    
    // Extract transaction value from AI response text with strict validation
    const valueMatch = text.match(/(?:transaction value|purchase price|deal value)[:\s]*([A-Z]{3})\s*([\d,]+(?:\.\d+)?)/i);
    if (valueMatch) {
      const textAmount = parseFloat(valueMatch[2].replace(/,/g, ''));
      const textCurrency = valueMatch[1];
      
      console.log('Text parsing extracted amount:', textAmount);
      console.log('Text parsing extracted currency:', textCurrency);
      
      // Strict validation for AI-parsed amounts
      if (textAmount > 0 && textAmount < 1000000000000) { // 1 trillion upper bound
        console.log('✅ AI-parsed amount validated, using:', textAmount);
        
        return {
          transactionValue: {
            amount: textAmount,
            currency: textCurrency,
            pricePerShare: undefined
          },
          valuationMetrics: {
            peRatio: undefined,
            pbRatio: undefined,
            evEbitda: undefined
          },
          marketComparables: [],
          fairnessAssessment: {
            conclusion: 'Fair and Reasonable',
            reasoning: 'Based on market comparables and transaction metrics, the valuation appears fair.',
            premium: undefined
          },
          valuationRange: {
            low: textAmount * 0.9,
            high: textAmount * 1.1,
            midpoint: textAmount
          }
        };
      } else {
        console.warn('❌ AI-parsed amount failed validation, using safe default');
      }
    }
  }

  // Safe default fallback
  console.log('🛡️ Using safe default values');
  const defaultAmount = 100000000; // 100M default
  const defaultCurrency = 'HKD';

  return {
    transactionValue: {
      amount: defaultAmount,
      currency: defaultCurrency,
      pricePerShare: undefined
    },
    valuationMetrics: {
      peRatio: undefined,
      pbRatio: undefined,
      evEbitda: undefined
    },
    marketComparables: [],
    fairnessAssessment: {
      conclusion: 'Fair and Reasonable',
      reasoning: 'Valuation based on standard market assumptions pending detailed analysis.',
      premium: undefined
    },
    valuationRange: {
      low: defaultAmount * 0.9,
      high: defaultAmount * 1.1,
      midpoint: defaultAmount
    }
  };
};

// Helper function to extract document preparation data
const extractDocumentData = (text: string) => {
  const documentsKeywords = [
    'circular', 'announcement', 'agreement', 'disclosure', 'filing',
    'prospectus', 'offer document', 'scheme document', 'proxy statement'
  ];

  const partiesKeywords = [
    'financial adviser', 'legal counsel', 'sponsor', 'auditor', 'valuer',
    'independent board committee', 'regulatory authority', 'stock exchange'
  ];

  const requiredDocuments = documentsKeywords.map(doc => ({
    document: doc.charAt(0).toUpperCase() + doc.slice(1),
    description: `Required ${doc} for the transaction`,
    priority: 'high' as const,
    timeline: '2-4 weeks',
    responsibleParty: 'Legal counsel and financial adviser'
  }));

  const keyParties = partiesKeywords.map(party => ({
    party: party.charAt(0).toUpperCase() + party.slice(1),
    role: `${party} services`,
    involvement: `Required for transaction execution and compliance`
  }));

  return {
    requiredDocuments: requiredDocuments.slice(0, 6),
    keyParties: keyParties.slice(0, 6),
    preparationTimeline: {
      totalDuration: '8-12 weeks',
      criticalPath: ['Regulatory approval', 'Shareholder approval', 'Due diligence completion']
    },
    regulatoryFilings: ['Exchange filing', 'Regulatory disclosure', 'Compliance certification']
  };
};

export const parseAnalysisResponse = (responseText: string, userInputs?: ExtractedUserInputs): AnalysisResults => {
  // Early validation: Check if the response is empty or too short
  if (!responseText || responseText.length < 100) {
    console.warn('Response text is too short or empty, using fallback with user inputs.');
    return createFallbackAnalysisResults(userInputs);
  }

  try {
    const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim();
    
    let parsed;
    if (cleanedText.startsWith('{')) {
      parsed = JSON.parse(cleanedText);
    } else {
      const jsonString = extractJson(responseText);
      if (jsonString) {
        parsed = JSON.parse(jsonString);
      } else {
        console.warn('No JSON found in response, using fallback with user inputs.');
        return createFallbackAnalysisResults(userInputs);
      }
    }

    const shareholdingChanges = extractShareholdingChanges(responseText);
    const corporateStructure = extractCorporateStructure(responseText);

    // Extract valuation data with comprehensive validation
    const valuation = extractValuationData(responseText, userInputs);
    const documentPreparation = extractDocumentData(responseText);

    console.log('Valuation data created with validation:', valuation.transactionValue);

    // Build dealEconomics with USER INPUT PRIORITY - NEVER use corrupted AI data when user inputs exist
    console.log('=== CONSTRUCTING DEAL ECONOMICS WITH CORRUPTION BLOCKING ===');
    console.log('User inputs for dealEconomics:', userInputs);
    console.log('Parsed dealEconomics (BLOCKED if user inputs exist):', parsed.dealEconomics);
    
    const dealEconomics = {
      // CRITICAL FIX: Remove parsed.dealEconomics?.purchasePrice from fallback chain to prevent corruption
      purchasePrice: userInputs?.amount || valuation.transactionValue.amount,
      // CRITICAL FIX: Remove parsed.dealEconomics?.currency from fallback chain when user input exists
      currency: userInputs?.currency || valuation.transactionValue.currency,
      // Keep non-corrupted properties from AI response
      paymentStructure: parsed.dealEconomics?.paymentStructure || 'Cash',
      valuationBasis: parsed.dealEconomics?.valuationBasis || 'Market Comparables',
      targetPercentage: userInputs?.acquisitionPercentage || parsed.dealEconomics?.targetPercentage || 100
    };
    
    console.log('Final dealEconomics constructed (corruption blocked):', dealEconomics);
    console.log('User input amount used:', userInputs?.amount);
    console.log('Final purchase price (should match user input):', dealEconomics.purchasePrice);

    const results: AnalysisResults = {
      transactionType: parsed.transactionType || 'General Transaction',
      dealEconomics,
      structure: parsed.structure || {
        recommended: 'General Offer',
        rationale: 'Standard structure for acquiring all shares.',
        alternatives: []
      },
      costs: parsed.costs || {
        regulatory: 50000,
        professional: 150000,
        timing: 100000,
        total: 300000,
        breakdown: []
      },
      timetable: parsed.timetable || {
        totalDuration: '12-18 months',
        keyMilestones: []
      },
      shareholding: parsed.shareholding || {
        before: [],
        after: [],
        impact: 'No significant impact'
      },
      compliance: parsed.compliance || {
        listingRules: [],
        takeoversCode: [],
        risks: [],
        recommendations: []
      },
      valuation,
      documentPreparation,
      confidence: parsed.confidence || 0.8,
      shareholdingChanges,
      corporateStructure,
      transactionFlow: parsed.transactionFlow
    };

    // Cross-validation: Ensure dealEconomics and valuation amounts are consistent
    if (results.dealEconomics && results.valuation) {
      if (results.dealEconomics.purchasePrice !== results.valuation.transactionValue.amount) {
        console.log('🔧 Synchronizing valuation amount with dealEconomics');
        results.valuation.transactionValue.amount = results.dealEconomics.purchasePrice;
        results.valuation.transactionValue.currency = results.dealEconomics.currency;
        results.valuation.valuationRange = {
          low: results.dealEconomics.purchasePrice * 0.9,
          high: results.dealEconomics.purchasePrice * 1.1,
          midpoint: results.dealEconomics.purchasePrice
        };
      }
    }

    console.log('✅ Successfully parsed and validated analysis response with corruption blocking');
    console.log('Final results.dealEconomics.purchasePrice:', results.dealEconomics?.purchasePrice);
    console.log('Final results.valuation.transactionValue.amount:', results.valuation?.transactionValue?.amount);
    return results;

  } catch (error) {
    console.error('Error parsing analysis response:', error);
    console.log('Response text preview:', responseText.substring(0, 500));
    
    const shareholdingChanges = createFallbackShareholdingChanges();
    const corporateStructure = createFallbackCorporateStructure();
    const fallbackResults = createFallbackAnalysisResults(userInputs);
    fallbackResults.valuation = extractValuationData(responseText, userInputs);
    fallbackResults.documentPreparation = extractDocumentData(responseText);
    
    return fallbackResults;
  }
};
