
import { mappingSpreadsheetService } from '../mappingSpreadsheetService';

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  corrections?: string;
  sourceMaterials: string[];
}

/**
 * Service for validating responses against regulatory context
 */
export const validationContextService = {
  /**
   * Validates a generated response against listing rules context
   */
  validateResponseAgainstListingRules: async (response: string, query: string): Promise<ValidationResult> => {
    try {
      console.log('Validating response against listing rules context...');
      
      // Check if mapping guidance documents are available
      const guidanceDocument = await mappingSpreadsheetService.getListingGuidanceDocument();
      
      if (!guidanceDocument) {
        // No validation documents available
        console.log('No guidance documents available for validation');
        return {
          isValid: true, // Default to true if we can't validate
          confidence: 0.5,
          sourceMaterials: []
        };
      }
      
      // Extract context from guidance documents
      const relevantGuidance = await mappingSpreadsheetService.extractRelevantGuidance(query, guidanceDocument);
      
      // If no relevant guidance found, consider valid
      if (!relevantGuidance) {
        console.log('No relevant guidance found for validation');
        return {
          isValid: true,
          confidence: 0.7,
          sourceMaterials: []
        };
      }
      
      // Validate the response against listing guidance using the mapping service
      return await mappingSpreadsheetService.validateAgainstListingGuidance(response, query);
      
    } catch (error) {
      console.error('Error validating response against listing rules:', error);
      
      // Default to valid in case of errors
      return {
        isValid: true,
        confidence: 0.5,
        sourceMaterials: []
      };
    }
  }
};

export default validationContextService;
