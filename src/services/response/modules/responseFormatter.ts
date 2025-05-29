
import { GrokResponse } from '@/types/grok';
import { getTruncationDiagnostics } from '@/utils/truncation';
import { enhanceWithClickableLinks } from '@/utils/regulatoryReferenceFormatter';

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
    
    // Start with the original text
    let formattedText = text;
    
    // FIRST: Apply clickable links to regulatory references BEFORE any other formatting
    // This is the key fix - do this before HTML formatting to avoid conflicts
    console.log('Step 1: Applying clickable links to regulatory references...');
    formattedText = enhanceWithClickableLinks(formattedText);
    console.log('Step 1 complete: Regulatory references enhanced with links');
    
    // Check if text already contains HTML formatting
    const hasHtmlFormatting = /<h[1-6]|<p|<strong|<em|<ul|<li|<table|<tr|<th|<td/.test(formattedText);
    
    // Only apply formatting if HTML formatting is not already present
    if (!hasHtmlFormatting) {
      console.log('Step 2: Applying HTML formatting...');
      
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
      
      // Enhanced inline text formatting - but preserve existing links
      formattedText = formattedText
        .replace(/\*\*((?!<a\s)(?!Rule\s+\d|Chapter\s+\d|FAQ\s+|Guidance|LD\s+|Listing\s+Decision).*?)\*\*/g, '<strong class="font-bold text-finance-dark-blue dark:text-finance-light-blue">$1</strong>')
        .replace(/\*((?!<a\s).*?)\*/g, '<em>$1</em>')
        .replace(/__((?!<a\s).*?)__/g, '<u>$1</u>');
      
      // Enhanced bullet point formatting
      formattedText = formattedText
        .replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<li class="my-1 ml-4">$3</li>');
      
      // Wrap consecutive bullet points in ul tags
      formattedText = formattedText.replace(
        /(<li class="my-1 ml-4">.*?<\/li>)(\s*<li class="my-1 ml-4">.*?<\/li>)*/gs,
        '<ul class="list-disc pl-6 my-3">$&</ul>'
      );
      
      // Enhance paragraphing with proper spacing
      const paragraphs = formattedText.split(/\n\n+/);
      formattedText = paragraphs.map(p => {
        // Skip already formatted elements (those that start with HTML tags)
        if (p.trim().startsWith('<')) return p;
        
        // Format as paragraph if it's not already HTML and isn't empty
        if (p.trim().length > 0) {
          return `<p class="my-2 leading-relaxed">${p.trim()}</p>`;
        }
        return p;
      }).join('\n\n');
      
      // Add section for conclusion if not present and response is long enough
      if (!formattedText.includes('<h1>Conclusion</h1>') && 
          !formattedText.includes('<h2>Conclusion</h2>') && 
          formattedText.length > 1500) {
        formattedText += '\n\n<h2 class="text-xl font-semibold my-3">Conclusion</h2>\n<p class="my-2">The above analysis provides a comprehensive overview based on the applicable Hong Kong regulatory framework. Always consult the specific rules and guidance for your particular situation.</p>';
      }
      
      console.log('Step 2 complete: HTML formatting applied');
    } else {
      console.log('Skipping HTML formatting - content already has HTML elements');
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
    
    console.log('Response formatting complete');
    
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
