
/**
 * Bold formatting service for regulatory content
 * Enhances text with strategic bold formatting for key regulatory concepts
 */
export const boldFormatter = {
  /**
   * Enhance text with strategic bold formatting for key regulatory concepts
   */
  enhanceWithBoldFormatting: (text: string): string => {
    let enhanced = text;
    
    // Common heading patterns that should be bolded
    const headingPatterns = [
      'Analysis:?',
      'Conclusion:?',
      'Requirements:?',
      'Summary:?',
      'Overview:?',
      'Background:?',
      'Key Points:?',
      'Important Notes?:?',
      'Regulatory Framework:?',
      'Compliance Requirements:?',
      'Application Process:?',
      'Timeline:?',
      'Procedures?:?',
      'Guidelines?:?',
      'Recommendations?:?',
      'Next Steps:?',
      'Action Items:?'
    ];
    
    // Apply bold formatting to heading patterns
    headingPatterns.forEach(pattern => {
      const regex = new RegExp(`^(${pattern})`, 'gmi');
      enhanced = enhanced.replace(regex, (match) => {
        // Don't bold if already in a link or bold
        if (/<[^>]*>/.test(match) || /\*\*/.test(match)) {
          return match;
        }
        return `**${match}**`;
      });
    });
    
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
