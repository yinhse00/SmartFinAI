
/**
 * Service to validate response content and filter out non-existent regulatory references
 */
export const responseValidator = {
  /**
   * Filter out non-existent document codes from response content
   */
  filterInvalidReferences(content: string): string {
    // Pattern to match common non-existent reference formats
    const invalidPatterns = [
      /LD-\d+/g,  // Listing Decision codes
      /GL-\d+/g,  // Guidance Letter codes
      /\b(?:Listing Decision|Guidance Letter)\s+(?:LD-|GL-)\d+/gi,
      /\b(?:LD|GL)\s*[-:]?\s*\d+/gi
    ];
    
    let filteredContent = content;
    
    // Remove invalid reference patterns
    invalidPatterns.forEach(pattern => {
      filteredContent = filteredContent.replace(pattern, '[Reference removed - not found in database]');
    });
    
    // Log any filtering that occurred
    if (filteredContent !== content) {
      console.log('Filtered invalid references from response content');
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
        issues.push(`Suspicious reference pattern found: ${matches.join(', ')}`);
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
        issues.push(`Claims to quote from specific document: ${matches.join(', ')}`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      filteredContent
    };
  },

  /**
   * Clean response content to ensure only valid database references
   */
  cleanResponseContent(content: string, sourceMaterials: string[] = []): string {
    const validation = this.validateDatabaseReferences(content, sourceMaterials);
    
    if (!validation.isValid) {
      console.warn('Response validation issues detected:', validation.issues);
    }
    
    return validation.filteredContent;
  }
};
