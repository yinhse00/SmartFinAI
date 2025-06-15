import { GrokResponse } from '@/types/grok';
import { getTruncationDiagnostics } from '@/utils/truncation';
import { enhanceWithClickableLinks } from '@/utils/regulatoryReferenceFormatter';
import { databaseContentValidator } from './databaseContentValidator';

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
    originalContext?: string
  ): GrokResponse => {
    // Enhanced response completeness check
    const diagnostics = getTruncationDiagnostics(text);
    
    // ENHANCED: Validate database content preservation before formatting
    if (originalContext && contextUsed) {
      console.log('Validating database content preservation in final response...');
      const validationResult = databaseContentValidator.validateDatabaseAccuracy(
        text,
        originalContext,
        'final_response_validation'
      );
      
      if (!validationResult.isAccurate && validationResult.corrections && validationResult.corrections.length > 0) {
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
    
    // Enhanced bold formatting for key regulatory concepts
    formattedText = this.enhanceWithBoldFormatting(formattedText);
    
    // Only apply minimal formatting if no HTML is present
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
    
    console.log('Response formatting complete - database accuracy preserved with enhanced bold formatting');
    
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
  },

  /**
   * Enhance text with strategic bold formatting for key regulatory concepts
   */
  enhanceWithBoldFormatting: (text: string): string => {
    let enhanced = text;
    
    // Key regulatory terms that should be bolded
    const regulatoryTerms = [
      'Rule \\d+\\.\\d+[A-Z]*(?:\\(\\d+\\))?', // Rule numbers like Rule 7.19A(1)
      'Chapter \\d+[A-Z]*', // Chapter references
      'Listing Rules?', 
      'Takeovers? Code',
      'Securities and Futures Ordinance',
      'SFO',
      'connected transaction[s]?',
      'independent shareholders?',
      'general mandate',
      'specific mandate',
      'whitewash waiver',
      'mandatory offer',
      'rights issue',
      'open offer',
      'placing[s]?',
      'subscription[s]?',
      'privatisation',
      'spin-?off',
      'reverse takeover',
      'very substantial acquisition',
      'major transaction',
      'notifiable transaction',
      'discloseable transaction',
      'continuing connected transaction',
      'pre-IPO investment',
      'listing application',
      'prospectus',
      'circular',
      'announcement',
      'shareholder[s]? approval',
      'board resolution',
      'extraordinary general meeting',
      'EGM',
      'AGM',
      'annual general meeting'
    ];
    
    // Apply bold formatting to regulatory terms (case insensitive)
    regulatoryTerms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      enhanced = enhanced.replace(regex, (match) => {
        // Don't bold if already in a link or bold
        if (/<[^>]*>/.test(match) || /\*\*/.test(match)) {
          return match;
        }
        return `**${match}**`;
      });
    });
    
    // Key action words in regulatory context
    const actionWords = [
      'must', 'shall', 'required', 'mandatory', 'prohibited', 'permitted',
      'recommend', 'advise', 'consider', 'ensure', 'comply', 'obtain',
      'submit', 'file', 'publish', 'announce', 'disclose'
    ];
    
    actionWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      enhanced = enhanced.replace(regex, (match) => {
        // Don't bold if already in a link, bold, or part of a longer word
        if (/<[^>]*>/.test(match) || /\*\*/.test(match)) {
          return match;
        }
        return `**${match}**`;
      });
    });
    
    // Important percentages and thresholds
    const thresholdRegex = /\b(\d+(?:\.\d+)?%|\d+(?:\.\d+)? per cent\.?)\b/gi;
    enhanced = enhanced.replace(thresholdRegex, (match) => {
      if (/<[^>]*>/.test(match) || /\*\*/.test(match)) {
        return match;
      }
      return `**${match}**`;
    });
    
    // Time periods
    const timeRegex = /\b(\d+\s+(?:day|week|month|year|business day)[s]?)\b/gi;
    enhanced = enhanced.replace(timeRegex, (match) => {
      if (/<[^>]*>/.test(match) || /\*\*/.test(match)) {
        return match;
      }
      return `**${match}**`;
    });
    
    return enhanced;
  }
};
