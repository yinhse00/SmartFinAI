
import { GrokResponse } from '@/types/grok';
import { getTruncationDiagnostics } from '@/utils/truncation';

/**
 * Service for formatting final responses
 */
export const responseFormatter = {
  /**
   * Format the final response with metadata
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
    isBackupResponse?: boolean  // Added optional parameter
  ): GrokResponse => {
    // Enhanced response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    // Improve formatting by replacing markdown-style headers and separators with proper HTML
    let formattedText = text;
    
    // Replace markdown headers with bold paragraphs
    formattedText = formattedText
      .replace(/^###\s+(.*?)$/gm, '<p><strong>$1</strong></p>')
      .replace(/^##\s+(.*?)$/gm, '<p><strong>$1</strong></p>')
      .replace(/^#\s+(.*?)$/gm, '<p><strong>$1</strong></p>');
    
    // Replace horizontal rules with paragraph breaks
    formattedText = formattedText
      .replace(/^---+$/gm, '<p></p>')
      .replace(/^\*\*\*+$/gm, '<p></p>')
      .replace(/^___+$/gm, '<p></p>');
    
    // Enhanced paragraph and bullet point formatting
    // First convert bullet points with proper spacing
    formattedText = formattedText
      .replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<p class="bullet-point">$1•$2$3</p>');
    
    // Ensure proper paragraph breaks with spacing
    formattedText = formattedText
      .replace(/\n\n/g, '</p><p>')
      .replace(/(<\/p><p>)+/g, '</p><p>');
    
    // Wrap the whole text in paragraphs if not already wrapped
    if (!formattedText.startsWith('<p>')) {
      formattedText = `<p>${formattedText}</p>`;
    }
    
    // For Rule 7.19A(1) aggregation questions, ensure content completeness
    const isAggregationResponse = text.toLowerCase().includes('7.19a') && 
                               text.toLowerCase().includes('aggregate') &&
                               queryType === 'listing_rules';
    
    let completenessOverride = false;
    
    // Check if the response looks complete despite truncation indicators
    if (isAggregationResponse && 
        diagnostics.isTruncated && 
        text.toLowerCase().includes('50%') && 
        text.toLowerCase().includes('within 12 months') &&
        text.toLowerCase().includes('independent shareholders') &&
        text.toLowerCase().includes('conclusion')) {
      // For Rule 7.19A responses that contain key elements, override truncation detection
      completenessOverride = true;
    }
    
    return {
      text: formattedText,
      queryType: queryType,
      metadata: {
        contextUsed: contextUsed,
        relevanceScore: relevanceScore,
        tradingArrangementInfoUsed: tradingArrangementInfoUsed,
        takeoversCodeUsed: takeoversCodeUsed,
        whitewashInfoIncluded: isWhitewashQuery && 
          (text.toLowerCase().includes('whitewash') && 
           text.toLowerCase().includes('dealing')),
        referenceDocumentsUsed: hasRefDocuments,
        isBackupResponse: isBackupResponse,  // Added the property
        responseCompleteness: {
          isComplete: completenessOverride || !diagnostics.isTruncated,
          confidence: diagnostics.confidence,
          reasons: diagnostics.reasons
        }
      }
    };
  }
};
