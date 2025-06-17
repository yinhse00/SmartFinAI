
import { GrokResponse } from '@/types/grok';
import { enhanceWithClickableLinks } from '@/utils/regulatoryReferenceFormatter';
import { databaseContentValidator } from './databaseContentValidator';
import { boldFormatter } from './boldFormatter';
import { htmlFormatter } from './htmlFormatter';
import { responseMetadataBuilder } from './responseMetadataBuilder';

/**
 * Service for formatting final responses with enhanced database accuracy preservation
 * and bold text highlighting for key concepts
 */
export const responseFormatter = {
  /**
   * Format the final response with database content preservation validation
   * and enhanced bold formatting for better readability
   */
  formatResponse: (
    text: string, 
    queryType: string,
    contextUsed: boolean,
    relevanceScore: number,
    tradingArrangementInfoUsed: boolean,
    takeoversCodeUsed: boolean,
    isWhitewashQuery: boolean,
    hasRefDocuments: boolean,
    isBackupResponse?: boolean,
    originalContext?: string,
    skipBoldFormatting?: boolean
  ): GrokResponse => {
    // ENHANCED: Validate database content preservation before formatting
    if (originalContext && contextUsed) {
      console.log('Validating database content preservation in final response...');
      const validationResult = databaseContentValidator.validateDatabaseAccuracy(
        text,
        originalContext,
        'final_response_validation'
      );
      
      // Fix TypeScript error: Add proper null checks
      if (!validationResult.isAccurate && 
          validationResult.corrections && 
          Array.isArray(validationResult.corrections) && 
          validationResult.corrections.length > 0) {
        console.log('Applying final corrections to preserve database accuracy...');
        text = databaseContentValidator.applyCorrections(text, validationResult.corrections);
      }
    }
    
    // Start with the original text - database content takes precedence
    let formattedText = text;
    
    // Apply clickable links to regulatory references
    console.log('Applying clickable links to regulatory references...');
    formattedText = enhanceWithClickableLinks(formattedText);
    console.log('Regulatory references enhanced with links');
    
    // Enhanced bold formatting for key regulatory concepts (skip if requested)
    formattedText = boldFormatter.enhanceWithBoldFormatting(formattedText, skipBoldFormatting);
    
    // Apply HTML formatting (skip bold conversion if requested)
    formattedText = htmlFormatter.applyHtmlFormatting(formattedText, skipBoldFormatting);
    
    // Build metadata
    const metadata = responseMetadataBuilder.buildMetadata(
      text,
      queryType,
      contextUsed,
      relevanceScore,
      tradingArrangementInfoUsed,
      takeoversCodeUsed,
      isWhitewashQuery,
      hasRefDocuments,
      isBackupResponse
    );
    
    console.log('Response formatting complete - database accuracy preserved with enhanced bold formatting');
    
    return {
      text: formattedText,
      queryType: queryType,
      metadata: metadata
    };
  },

  // Keep the enhanceWithBoldFormatting method for backward compatibility
  enhanceWithBoldFormatting: boldFormatter.enhanceWithBoldFormatting
};
