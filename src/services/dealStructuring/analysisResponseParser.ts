import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { createFallbackAnalysisResults } from './analysisFallbackData';
import { createFallbackShareholdingChanges, createFallbackCorporateStructure } from './analysisFallbackData';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { dataConsistencyService } from './dataConsistencyService';

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

// Helper function to extract executive summary
const extractExecutiveSummary = (text: string, userInputs?: ExtractedUserInputs) => {
  console.log('=== EXTRACTING EXECUTIVE SUMMARY ===');
  
  try {
    const jsonString = extractJson(text);
    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      if (parsed.executiveSummary) {
        console.log('✅ Found AI-generated executive summary');
        return parsed.executiveSummary;
      }
    }
  } catch (error) {
    console.error('Error parsing executive summary from AI response:', error);
  }

  // Generate intelligent fallback summary based on user inputs and context
  console.log('⚠️ Generating intelligent fallback executive summary');
  
  const amount = userInputs?.amount || 70000000; // Hardcoded sample: 70M
  const currency = userInputs?.currency || 'HKD';
  const targetCompany = userInputs?.targetCompanyName || 'Target Company Limited';
  const acquiringCompany = userInputs?.acquiringCompanyName || 'Acquiring Entity Limited';
  const acquisitionPercentage = userInputs?.acquisitionPercentage || 100;

  const formatAmount = (amt: number) => {
    if (amt >= 1000000000) {
      return `${(amt / 1000000000).toFixed(1)} billion`;
    } else if (amt >= 1000000) {
      return `${(amt / 1000000).toFixed(1)} million`;
    } else {
      return amt.toLocaleString();
    }
  };

  return {
    narrative: `This strategic transaction involves ${acquiringCompany} acquiring ${acquisitionPercentage}% of ${targetCompany} for ${currency} ${formatAmount(amount)}. The transaction is structured to optimize value creation while ensuring regulatory compliance and minimizing execution risk. The deal incorporates market-standard terms with appropriate consideration mix and timing to accommodate current market conditions and stakeholder requirements. Key structural features include comprehensive due diligence provisions, regulatory approval mechanisms, and risk allocation frameworks designed to ensure successful completion within the projected timeline.`,
    keyHighlights: [
      `${currency} ${formatAmount(amount)} total consideration`,
      `${acquisitionPercentage}% acquisition of ${targetCompany}`,
      'Optimized structure for current market conditions',
      'Comprehensive regulatory compliance framework'
    ],
    strategicRationale: `The transaction structure balances value maximization with execution certainty, incorporating market intelligence and precedent analysis to optimize terms for all stakeholders.`,
    marketContext: `Current market conditions support the proposed structure, with recent precedent transactions validating the approach and regulatory environment providing clear execution pathway.`
  };
};

// Helper function to extract valuation data with user input authority
const extractValuationData = (text: string, userInputs?: ExtractedUserInputs) => {
  console.log('=== EXTRACTING VALUATION DATA WITH USER INPUT AUTHORITY ===');
  console.log('User inputs:', userInputs);
  
  // If we have user inputs, use them as the authoritative source
  if (userInputs?.amount && userInputs.amount > 0) {
    const amount = userInputs.amount;
    const currency = userInputs.currency || 'HKD';
    
    console.log('✅ Using authoritative user input for valuation:', amount);
    
    return {
      transactionValue: {
        amount,
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
        low: amount * 0.9,
        high: amount * 1.1,
        midpoint: amount
      }
    };
  }

  // Fallback to hardcoded sample if no user input
  console.log('⚠️ No user input for valuation, using hardcoded sample');
  const sampleAmount = 70000000; // Hardcoded sample: 70M HKD
  const sampleCurrency = 'HKD';

  return {
    transactionValue: {
      amount: sampleAmount,
      currency: sampleCurrency,
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
      reasoning: 'Valuation based on sample transaction amount for testing purposes.',
      premium: undefined
    },
    valuationRange: {
      low: sampleAmount * 0.9,
      high: sampleAmount * 1.1,
      midpoint: sampleAmount
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

// Helper function to validate and correct AI response against user inputs
const validateAndCorrectAiResponse = (responseText: string, userInputs?: ExtractedUserInputs): string => {
  console.log('=== VALIDATING AI RESPONSE AGAINST USER INPUTS ===');
  
  if (!userInputs?.amount || userInputs.amount <= 0) {
    console.log('No user inputs to validate against, proceeding with AI response');
    return responseText;
  }
  
  const expectedAmount = userInputs.amount;
  console.log('Expected amount from user input:', expectedAmount);
  
  // Check for corrupted purchasePrice in AI response
  const purchasePricePattern = /"purchasePrice":\s*(\d+)/g;
  let correctedText = responseText;
  let correctionsMade = false;
  
  const matches = Array.from(responseText.matchAll(purchasePricePattern));
  matches.forEach(match => {
    const aiAmount = parseInt(match[1]);
    console.log('AI generated purchasePrice:', aiAmount);
    
    if (aiAmount !== expectedAmount) {
      console.error(`🚨 CORRUPTION DETECTED: AI generated ${aiAmount}, expected ${expectedAmount}`);
      correctedText = correctedText.replace(match[0], `"purchasePrice": ${expectedAmount}`);
      correctionsMade = true;
    }
  });
  
  // Check for corrupted transaction value amounts
  const transactionValuePattern = /"amount":\s*(\d+)/g;
  const valueMatches = Array.from(responseText.matchAll(transactionValuePattern));
  valueMatches.forEach(match => {
    const aiAmount = parseInt(match[1]);
    // Only correct if the amount is significantly different and likely corrupted (>1B suggests corruption)
    if (aiAmount > 1000000000 && expectedAmount < 1000000000) {
      console.error(`🚨 LARGE AMOUNT CORRUPTION: AI generated ${aiAmount}, correcting to ${expectedAmount}`);
      correctedText = correctedText.replace(match[0], `"amount": ${expectedAmount}`);
      correctionsMade = true;
    }
  });
  
  if (correctionsMade) {
    console.log('✅ AI response corrected to match user input');
  } else {
    console.log('✅ AI response validated - no corruption detected');
  }
  
  return correctedText;
};

export const parseAnalysisResponse = (responseText: string, userInputs?: ExtractedUserInputs): AnalysisResults => {
  console.log('=== PARSING ANALYSIS RESPONSE WITH PRE-VALIDATION ===');
  console.log('User inputs received:', userInputs);
  
  // CRITICAL: Validate and correct AI response before parsing
  const validatedResponseText = validateAndCorrectAiResponse(responseText, userInputs);
  
  // Early validation: Check if the response is empty or too short
  if (!validatedResponseText || validatedResponseText.length < 100) {
    console.warn('Response text is too short or empty, using fallback with user inputs.');
    const fallbackResults = createFallbackAnalysisResults(userInputs);
    fallbackResults.executiveSummary = extractExecutiveSummary(validatedResponseText, userInputs);
    return dataConsistencyService.enforceDataConsistency(fallbackResults, userInputs);
  }

  try {
    const cleanedText = validatedResponseText.replace(/```json\s*|\s*```/g, '').trim();
    
    let parsed;
    if (cleanedText.startsWith('{')) {
      parsed = JSON.parse(cleanedText);
    } else {
      const jsonString = extractJson(validatedResponseText);
      if (jsonString) {
        parsed = JSON.parse(jsonString);
      } else {
        console.warn('No JSON found in response, using fallback with user inputs.');
        const fallbackResults = createFallbackAnalysisResults(userInputs);
        fallbackResults.executiveSummary = extractExecutiveSummary(validatedResponseText, userInputs);
        return dataConsistencyService.enforceDataConsistency(fallbackResults, userInputs);
      }
    }

    console.log('🔍 Parsed AI response dealEconomics:', parsed.dealEconomics);

    const shareholdingChanges = extractShareholdingChanges(validatedResponseText);
    const corporateStructure = extractCorporateStructure(validatedResponseText);
    const valuation = extractValuationData(validatedResponseText, userInputs);
    const documentPreparation = extractDocumentData(validatedResponseText);
    const executiveSummary = extractExecutiveSummary(validatedResponseText, userInputs);

    // Build initial results from validated AI response
    const results: AnalysisResults = {
      executiveSummary,
      transactionType: parsed.transactionType || 'General Transaction',
      dealEconomics: parsed.dealEconomics || {
        purchasePrice: userInputs?.amount || 70000000, // Hardcoded sample: 70M
        currency: userInputs?.currency || 'HKD',
        paymentStructure: 'Cash',
        valuationBasis: 'Market Comparables',
        targetPercentage: userInputs?.acquisitionPercentage || 100
      },
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

    // CRITICAL: Apply data consistency enforcement with user input authority
    const consistentResults = dataConsistencyService.enforceDataConsistency(results, userInputs);
    
    // Validate consistency
    const validation = dataConsistencyService.validateDataConsistency(consistentResults);
    if (!validation.isConsistent) {
      console.warn('Data inconsistencies detected:', validation.inconsistencies);
    }
    
    console.log('=== FINAL RESULTS WITH EXECUTIVE SUMMARY ===');
    console.log('Executive summary:', consistentResults.executiveSummary?.narrative?.substring(0, 100) + '...');
    console.log('Final dealEconomics.purchasePrice:', consistentResults.dealEconomics?.purchasePrice);
    console.log('Final valuation.transactionValue.amount:', consistentResults.valuation?.transactionValue?.amount);
    
    return consistentResults;

  } catch (error) {
    console.error('Error parsing analysis response:', error);
    console.log('Response text preview:', validatedResponseText.substring(0, 500));
    
    const shareholdingChanges = createFallbackShareholdingChanges();
    const corporateStructure = createFallbackCorporateStructure();
    const fallbackResults = createFallbackAnalysisResults(userInputs);
    fallbackResults.valuation = extractValuationData(validatedResponseText, userInputs);
    fallbackResults.documentPreparation = extractDocumentData(validatedResponseText);
    fallbackResults.executiveSummary = extractExecutiveSummary(validatedResponseText, userInputs);
    
    return dataConsistencyService.enforceDataConsistency(fallbackResults, userInputs);
  }
};
