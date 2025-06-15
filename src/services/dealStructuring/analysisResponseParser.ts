
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
      if (!parsed.transactionFlow) { // Ensure transactionFlow fallback
        parsed.transactionFlow = createFallbackTransactionFlow();
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
      } else {
        // console.warn('No dealEconomics found in AI response, which is acceptable.');
      }
      
      return parsed as AnalysisResults; // Cast to ensure type conformity
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    // Fallback to text processing if JSON parsing fails
  }
  
  // Fallback: create structured response from text
  console.warn('Falling back to text-based analysis structuring due to JSON parsing issue or missing JSON.');
  return createFallbackAnalysis(responseText);
}
