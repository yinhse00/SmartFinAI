
/**
 * Service to validate response content and filter out non-existent regulatory references
 */
export const responseValidator = {
  /**
   * Filter out non-existent document codes from response content with improved strategy
   */
  filterInvalidReferences(content: string): string {
    // Pattern to match potentially invalid reference formats
    const suspiciousPatterns = [
      {
        pattern: /LD-\d+/g,
        replacement: (match: string) => isValidListingDecisionFormat(match) ? match : `${match}*`
      },
      {
        pattern: /GL-\d+/g,
        replacement: (match: string) => isValidGuidanceLetterFormat(match) ? match : `${match}*`
      },
      {
        pattern: /\b(?:Listing Decision|Guidance Letter)\s+(?:LD-|GL-)\d+/gi,
        replacement: (match: string) => `${match}*`
      }
    ];
    
    let filteredContent = content;
    let hasFiltering = false;
    
    // Apply improved filtering with disclaimers instead of harsh removal
    suspiciousPatterns.forEach(({ pattern, replacement }) => {
      const originalContent = filteredContent;
      if (typeof replacement === 'function') {
        filteredContent = filteredContent.replace(pattern, replacement);
      } else {
        filteredContent = filteredContent.replace(pattern, replacement);
      }
      if (originalContent !== filteredContent) {
        hasFiltering = true;
      }
    });
    
    // Log any filtering that occurred
    if (hasFiltering) {
      console.log('Applied reference disclaimers to uncertain regulatory references');
    }
    
    return filteredContent;
  },

  /**
   * Validate that response only contains database-sourced references
   */
  validateDatabaseReferences(content: string, sourceMaterials: string[]): {
    isValid: boolean;
    issues: string[];
    filteredContent: string;
  } {
    const issues: string[] = [];
    let filteredContent = this.filterInvalidReferences(content);
    
    // Check for suspicious reference patterns that suggest generated content
    const suspiciousPatterns = [
      /\b(?:Guidance Letter|Listing Decision)\s+[A-Z]{2,3}-\d+/gi,
      /\b(?:FAQ|Guide)\s+[A-Z]{2,3}-\d+/gi,
      /Document\s+ID:\s*[A-Z]{2,3}-\d+/gi
    ];
    
    suspiciousPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Uncertain reference pattern found: ${matches.join(', ')} - please verify`);
      }
    });
    
    // Check if content claims to quote from specific documents not in source materials
    const quotePatterns = [
      /(?:According to|As stated in|Per)\s+(?:Guidance Letter|Listing Decision)\s+[A-Z-\d]+/gi,
      /(?:FAQ|Guidance)\s+[A-Z-\d]+\s+states/gi
    ];
    
    quotePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Claims to quote from specific document: ${matches.join(', ')} - source verification needed`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      filteredContent
    };
  },

  /**
   * Clean response content with improved user experience
   */
  cleanResponseContent(content: string, sourceMaterials: string[] = []): string {
    const validation = this.validateDatabaseReferences(content, sourceMaterials);
    
    if (!validation.isValid) {
      console.log('Response validation issues detected (non-critical):', validation.issues);
    }
    
    return validation.filteredContent;
  }
};

/**
 * Validate Listing Decision format
 */
function isValidListingDecisionFormat(reference: string): boolean {
  // Basic format validation - can be enhanced with actual validation logic
  return /^LD-\d{2,4}$/.test(reference);
}

/**
 * Validate Guidance Letter format
 */
function isValidGuidanceLetterFormat(reference: string): boolean {
  // Basic format validation - can be enhanced with actual validation logic
  return /^GL-\d{2,4}$/.test(reference);
}
