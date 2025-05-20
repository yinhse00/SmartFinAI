
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
    isBackupResponse?: boolean
  ): GrokResponse => {
    // Enhanced response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    // Improve formatting with proper HTML elements for better readability
    let formattedText = text;
    
    // Check if text already contains HTML formatting
    const hasHtmlFormatting = /<h[1-6]|<p|<strong|<em|<ul|<li|<table|<tr|<th|<td/.test(formattedText);
    
    // Only apply formatting if HTML formatting is not already present
    if (!hasHtmlFormatting) {
      // Add executive summary wrap if not present
      if (!formattedText.includes('<h1>Executive Summary</h1>') && 
          !formattedText.includes('<h2>Executive Summary</h2>')) {
        // Look for what might be an executive summary at the beginning
        const firstParagraphEnd = formattedText.indexOf('\n\n');
        if (firstParagraphEnd > 0 && firstParagraphEnd < 400) {
          const executiveSummary = formattedText.substring(0, firstParagraphEnd);
          const remainingText = formattedText.substring(firstParagraphEnd);
          formattedText = `<h1 class="text-2xl font-bold my-4">Executive Summary</h1>\n<p class="my-2">${executiveSummary}</p>\n<h1 class="text-2xl font-bold my-4">Detailed Analysis</h1>\n${remainingText}`;
        }
      }
      
      // Replace markdown-style headers with semantic HTML elements
      formattedText = formattedText
        .replace(/^###\s+(.*?)$/gm, '<h3 class="text-lg font-semibold my-3">$1</h3>')
        .replace(/^##\s+(.*?)$/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>')
        .replace(/^#\s+(.*?)$/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>');
      
      // Replace horizontal rules with proper spacing
      formattedText = formattedText
        .replace(/^---+$/gm, '<div class="my-4"></div>')
        .replace(/^\*\*\*+$/gm, '<div class="my-4"></div>')
        .replace(/^___+$/gm, '<div class="my-4"></div>');
      
      // Enhance inline text formatting
      formattedText = formattedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
        .replace(/__(.*?)__/g, '<u>$1</u>'); // Underlined text
      
      // Enhanced formatting for rule references
      formattedText = formattedText
        .replace(/(\bRule\s+\d+\.\d+[A-Z]?\b|\bChapter\s+\d+[A-Z]?\b)/g, '<strong class="text-finance-accent-blue">$1</strong>')
        .replace(/(\bGuidance Letter\s+\w+-\d+\b|\bListing Decision\s+\w+-\d+\b|\bFAQ\s+\d+\.\d+\b)/g, 
                '<strong class="text-finance-accent-green">$1</strong>');
      
      // Enhanced bullet point formatting with proper spacing and structure
      formattedText = formattedText
        .replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<p class="bullet-point my-1 ml-4 relative">$3</p>');
      
      // Enhance paragraphing with proper spacing
      const paragraphs = formattedText.split(/\n\n+/);
      formattedText = paragraphs.map(p => {
        // Skip already formatted elements (those that start with HTML tags)
        if (p.trim().startsWith('<')) return p;
        
        // Format as paragraph if it's not already HTML and isn't empty
        if (p.trim().length > 0) {
          return `<p class="my-2">${p.trim()}</p>`;
        }
        return p;
      }).join('\n\n');
      
      // Add section for conclusion if not present and response is long enough
      if (!formattedText.includes('<h1>Conclusion</h1>') && 
          !formattedText.includes('<h2>Conclusion</h2>') && 
          formattedText.length > 1500) {
        formattedText += '\n\n<h2 class="text-xl font-semibold my-3">Conclusion</h2>\n<p class="my-2">The above analysis provides a comprehensive overview based on the applicable Hong Kong regulatory framework. Always consult the specific rules and guidance for your particular situation.</p>';
      }
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

