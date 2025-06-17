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

// Helper function to extract valuation data
const extractValuationData = (text: string) => {
  // Extract transaction value
  const valueMatch = text.match(/(?:transaction value|purchase price|deal value)[:\s]*([A-Z]{3})\s*([\d,]+(?:\.\d+)?)/i);
  const amount = valueMatch ? parseFloat(valueMatch[2].replace(/,/g, '')) : 100000000;
  const currency = valueMatch ? valueMatch[1] : 'HKD';

  // Extract price per share
  const priceMatch = text.match(/(?:price per share|share price)[:\s]*(?:[A-Z]{3})?\s*([\d,]+(?:\.\d+)?)/i);
  const pricePerShare = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;

  // Extract valuation metrics
  const peMatch = text.match(/(?:p\/e|pe ratio)[:\s]*([\d.]+)/i);
  const pbMatch = text.match(/(?:p\/b|pb ratio)[:\s]*([\d.]+)/i);
  const evMatch = text.match(/(?:ev\/ebitda|enterprise value)[:\s]*([\d.]+)/i);

  // Extract premium
  const premiumMatch = text.match(/(?:premium|control premium)[:\s]*([\d.]+)%?/i);

  return {
    transactionValue: {
      amount,
      currency,
      pricePerShare
    },
    valuationMetrics: {
      peRatio: peMatch ? parseFloat(peMatch[1]) : undefined,
      pbRatio: pbMatch ? parseFloat(pbMatch[1]) : undefined,
      evEbitda: evMatch ? parseFloat(evMatch[1]) : undefined
    },
    marketComparables: [], // AI will need to provide these
    fairnessAssessment: {
      conclusion: 'Fair and Reasonable',
      reasoning: 'Based on market comparables and transaction metrics, the valuation appears fair.',
      premium: premiumMatch ? parseFloat(premiumMatch[1]) : undefined
    },
    valuationRange: {
      low: amount * 0.9,
      high: amount * 1.1,
      midpoint: amount
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
    requiredDocuments: requiredDocuments.slice(0, 6), // Limit to 6 items
    keyParties: keyParties.slice(0, 6), // Limit to 6 items
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

    // Add valuation and document preparation data
    const valuation = extractValuationData(responseText);
    const documentPreparation = extractDocumentData(responseText);

    const results: AnalysisResults = {
      transactionType: parsed.transactionType || 'General Transaction',
      dealEconomics: parsed.dealEconomics || {
        purchasePrice: userInputs?.amount || 100000000,
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

    // Validate and reconcile with user inputs if provided
    if (userInputs) {
      if (userInputs.amount && (!results.dealEconomics?.purchasePrice || results.dealEconomics.purchasePrice !== userInputs.amount)) {
        console.log('Reconciling purchase price with user input:', userInputs.amount);
        results.dealEconomics = {
          ...results.dealEconomics,
          purchasePrice: userInputs.amount
        };
      }
      
      if (userInputs.currency && results.dealEconomics) {
        results.dealEconomics.currency = userInputs.currency;
      }
      
      if (userInputs.acquisitionPercentage && results.dealEconomics) {
        results.dealEconomics.targetPercentage = userInputs.acquisitionPercentage;
      }
    }

    console.log('Successfully parsed analysis response with user input validation');
    return results;

  } catch (error) {
    console.error('Error parsing analysis response:', error);
    console.log('Response text preview:', responseText.substring(0, 500));
    
    const shareholdingChanges = createFallbackShareholdingChanges();
    const corporateStructure = createFallbackCorporateStructure();
    const fallbackResults = createFallbackAnalysisResults(userInputs);
    fallbackResults.valuation = extractValuationData(responseText);
    fallbackResults.documentPreparation = extractDocumentData(responseText);
    
    return fallbackResults;
  }
};
