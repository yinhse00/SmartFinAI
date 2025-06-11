
import { GrokResponse } from '@/types/grok';
import { getTruncationDiagnostics } from '@/utils/truncation';
import { enhanceWithClickableLinks } from '@/utils/regulatoryReferenceFormatter';

/**
 * Service for formatting final responses with simplified, clean formatting
 */
export const responseFormatter = {
  /**
   * Format the final response with minimal, clean formatting
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
    isBackupResponse?: boolean
  ): GrokResponse => {
    // Enhanced response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    // Start with the original text
    let formattedText = text;
    
    // ONLY apply clickable links to regulatory references - no other formatting
    console.log('Applying clickable links to regulatory references...');
    formattedText = enhanceWithClickableLinks(formattedText);
    console.log('Regulatory references enhanced with links');
    
    // SIMPLIFIED: Only apply minimal formatting if no HTML is present
    const hasHtmlFormatting = /<h[1-6]|<p|<strong|<em|<ul|<li|<table|<tr|<th|<td/.test(formattedText);
    
    if (!hasHtmlFormatting) {
      // Only convert basic markdown to minimal HTML - no CSS classes
      formattedText = formattedText
        .replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
        .replace(/\*\*((?!<a\s).*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*((?!<a\s).*?)\*/g, '<em>$1</em>')
        .replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<li>$3</li>');
      
      // Simple paragraph wrapping without CSS classes
      const paragraphs = formattedText.split(/\n\n+/);
      formattedText = paragraphs.map(p => {
        if (p.trim().startsWith('<') || p.trim().length === 0) return p;
        return `<p>${p.trim()}</p>`;
      }).join('\n\n');
    }
    
    // Correct the profit test requirements for HKEX listing
    formattedText = formattedText
      .replace(/Profit attributable to shareholders of at least HK\$50 million in the most recent financial year/g, 
               'Profit attributable to shareholders of at least HK$35 million in the most recent financial year')
      .replace(/Aggregate profit of at least HK\$30 million for the two preceding financial years/g, 
               'Aggregate profit of at least HK$45 million for the two preceding financial years');
    
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
      completenessOverride = true;
    }
    
    console.log('Response formatting complete - clean layout restored');
    
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
        isBackupResponse: isBackupResponse,
        responseCompleteness: {
          isComplete: completenessOverride || !diagnostics.isTruncated,
          confidence: diagnostics.confidence,
          reasons: diagnostics.reasons
        }
      }
    };
  }
};
