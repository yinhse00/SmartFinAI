
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { 
  createFallbackShareholdingChanges, 
  createFallbackCorporateStructure,
  createFallbackTransactionFlow,
  createFallbackAnalysis 
} from './analysisFallbackData';

/**
 * Parse AI response into structured analysis results with proper dealEconomics handling
 */
export function parseAnalysisResponse(responseText: string): AnalysisResults {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure diagram data exists with fallback
      if (!parsed.shareholdingChanges) {
        parsed.shareholdingChanges = createFallbackShareholdingChanges();
      }
      if (!parsed.corporateStructure) {
        parsed.corporateStructure = createFallbackCorporateStructure();
      }
      if (!parsed.transactionFlow) {
        parsed.transactionFlow = createFallbackTransactionFlow();
      }
      
      // Ensure costs object has all required properties
      if (parsed.costs) {
        parsed.costs.regulatory = parsed.costs.regulatory || 0;
        parsed.costs.professional = parsed.costs.professional || 0;
        parsed.costs.timing = parsed.costs.timing || 0;
        parsed.costs.total = parsed.costs.total || 0;
        parsed.costs.breakdown = parsed.costs.breakdown || [];
      } else {
        parsed.costs = {
          regulatory: 0,
          professional: 0,
          timing: 0,
          total: 0,
          breakdown: []
        };
      }
      
      // Ensure timetable object has all required properties
      if (parsed.timetable) {
        parsed.timetable.keyMilestones = parsed.timetable.keyMilestones || [];
        parsed.timetable.criticalPath = parsed.timetable.criticalPath || [];
      } else {
        parsed.timetable = {
          totalDuration: 'To be determined',
          keyMilestones: [],
          criticalPath: []
        };
      }
      
      // Ensure structure.majorTerms has proper fallback
      if (parsed.structure && parsed.structure.majorTerms) {
        if (!parsed.structure.majorTerms.paymentStructure) {
          parsed.structure.majorTerms.paymentStructure = {
            cashPercentage: 0,
            stockPercentage: 0
          };
        } else {
          // Ensure paymentStructure has required properties
          parsed.structure.majorTerms.paymentStructure.cashPercentage = 
            parsed.structure.majorTerms.paymentStructure.cashPercentage || 0;
          parsed.structure.majorTerms.paymentStructure.stockPercentage = 
            parsed.structure.majorTerms.paymentStructure.stockPercentage || 0;
        }
        
        parsed.structure.majorTerms.keyConditions = parsed.structure.majorTerms.keyConditions || [];
        parsed.structure.majorTerms.structuralDecisions = parsed.structure.majorTerms.structuralDecisions || [];
      }
      
      // Ensure alternatives array exists
      if (parsed.structure) {
        parsed.structure.alternatives = parsed.structure.alternatives || [];
      }
      
      // Standardize the compliance object to ensure consistency
      if (parsed.compliance) {
        const compliance = parsed.compliance;
        // Map legacy or alternative field names to the standardized names
        compliance.listingRules = compliance.listingRules || compliance.keyListingRules || [];
        compliance.takeoversCode = compliance.takeoversCode || [];
        compliance.risks = compliance.risks || compliance.criticalRisks || [];
        compliance.recommendations = compliance.recommendations || compliance.actionableRecommendations || [];
        
        // Clean up legacy properties to avoid confusion
        delete compliance.keyListingRules;
        delete compliance.criticalRisks;
        delete compliance.actionableRecommendations;
      } else {
        // If compliance section is missing entirely, create a default structure
        parsed.compliance = {
          listingRules: [],
          takeoversCode: [],
          risks: [],
          recommendations: []
        };
      }
      
      // Log extracted deal economics for debugging (dealEconomics is optional in AnalysisResults)
      if (parsed.dealEconomics) {
        console.log('Extracted deal economics:', parsed.dealEconomics);
      }
      
      return parsed as AnalysisResults;
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    // Fallback to text processing if JSON parsing fails
  }
  
  // Fallback: create structured response from text
  console.warn('Falling back to text-based analysis structuring due to JSON parsing issue or missing JSON.');
  return createFallbackAnalysis(responseText);
}
