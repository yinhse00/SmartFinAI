
/**
 * Service for validating that responses preserve exact database content
 * Specifically designed to prevent rule reference generalization
 */

interface ValidationResult {
  isAccurate: boolean;
  preservationScore: number;
  issues: string[];
  corrections?: Correction[];
}

interface Correction {
  type: 'rule_reference' | 'content_modification';
  original: string;
  incorrect: string;
  reason: string;
}

export const databaseContentValidator = {
  /**
   * Validate that the response preserves exact database content
   */
  validateDatabaseAccuracy: (
    responseText: string,
    databaseContext: string,
    originalQuery: string
  ): ValidationResult => {
    const issues: string[] = [];
    const corrections: Correction[] = [];
    let preservationScore = 1.0;

    // Do not validate if database context is empty
    if (!databaseContext || databaseContext.trim() === '') {
      return {
        isAccurate: true,
        preservationScore: 1.0,
        issues: [],
      };
    }

    const databaseRuleRefs = extractRuleReferences(databaseContext);
    const responseRuleRefs = extractRuleReferences(responseText);
    const dbRefStrings = new Set(databaseRuleRefs.map(r => r.fullReference.toLowerCase()));

    // Check for rule references in response that aren't in database context
    for (const respRef of responseRuleRefs) {
      const refLower = respRef.fullReference.toLowerCase();
      
      // Only flag as invented if it's clearly not a valid regulatory reference pattern
      if (!dbRefStrings.has(refLower) && !isValidRegulatoryPattern(respRef.fullReference)) {
        const isGeneralization = databaseRuleRefs.some(dbRef =>
          dbRef.fullReference.toLowerCase().startsWith(refLower) ||
          refLower.startsWith(dbRef.fullReference.toLowerCase())
        );

        if (!isGeneralization) {
          const issue = `Potentially inaccurate rule reference: "${respRef.fullReference}" - not found in source materials.`;
          issues.push(issue);
          corrections.push({
            type: 'content_modification',
            original: '',
            incorrect: respRef.fullReference,
            reason: 'Rule reference may be inaccurate and should be verified.',
          });
          preservationScore -= 0.2; // Reduced penalty for uncertain references
        }
      }
    }

    // Check for generalized rule references
    for (const dbRef of databaseRuleRefs) {
      const matchingResponseRefs = responseRuleRefs.filter(respRef => 
        respRef.baseRule === dbRef.baseRule
      );

      for (const respRef of matchingResponseRefs) {
        if (dbRef.fullReference !== respRef.fullReference) {
          // Check if response generalized the rule (e.g., 8.05(1)(a) -> 8.05(1))
          if (dbRef.fullReference.includes(respRef.fullReference)) {
            const issue = `Rule reference generalized: Database has "${dbRef.fullReference}" but response shows "${respRef.fullReference}"`;
            issues.push(issue);
            
            corrections.push({
              type: 'rule_reference',
              original: dbRef.fullReference,
              incorrect: respRef.fullReference,
              reason: 'Rule reference was improperly generalized'
            });
            
            preservationScore -= 0.2;
          }
        }
      }
    }

    // Check for content modifications of specific regulatory phrases
    const criticalPhrases = extractCriticalPhrases(databaseContext);
    for (const phrase of criticalPhrases) {
      if (databaseContext.includes(phrase) && !responseText.includes(phrase)) {
        issues.push(`Critical regulatory phrase modified or removed: "${phrase}"`);
        preservationScore -= 0.1;
      }
    }

    const isAccurate = issues.length === 0;
    
    console.log('Database content validation:', {
      isAccurate,
      preservationScore,
      issuesFound: issues.length,
      correctionsNeeded: corrections.length
    });

    return {
      isAccurate,
      preservationScore: Math.max(0, preservationScore),
      issues,
      corrections: corrections.length > 0 ? corrections : undefined
    };
  },

  /**
   * Apply corrections to response text with improved replacement strategy
   */
  applyCorrections: (responseText: string, corrections: Correction[]): string => {
    let correctedText = responseText;

    for (const correction of corrections) {
      if (correction.type === 'rule_reference') {
        // Replace generalized rule references with exact ones
        const pattern = new RegExp(`\\b${escapeRegExp(correction.incorrect)}\\b`, 'g');
        correctedText = correctedText.replace(pattern, correction.original);
        
        console.log(`Applied correction: "${correction.incorrect}" -> "${correction.original}"`);
      } else if (correction.type === 'content_modification') {
        // For uncertain references, add a disclaimer instead of harsh removal
        const fullReferencePattern = new RegExp(`\\b${escapeRegExp(correction.incorrect)}(?:\\.[\\d\\w()]+)*\\b`, 'g');
        const disclaimerText = `${correction.incorrect}*`;
        correctedText = correctedText.replace(fullReferencePattern, disclaimerText);
        console.log(`Applied disclaimer to uncertain reference: "${correction.incorrect}"`);
      }
    }

    return correctedText;
  }
};

/**
 * Check if a reference follows valid regulatory patterns
 */
function isValidRegulatoryPattern(reference: string): boolean {
  const validPatterns = [
    /^Rule\s+\d+(?:\.\d+)*(?:\([a-z]\))*$/i,          // Rule X.XX(a) format
    /^Chapter\s+\d+[A-Z]?$/i,                         // Chapter X format
    /^FAQ\s+(?:Series\s+)?\d+(?:\.\d+)*$/i,          // FAQ X.X format
    /^Guidance\s+Letter\s+[A-Z]{1,3}-\d+$/i,         // Guidance Letter XX-X format
    /^(?:LD|Listing\s+Decision)\s+[A-Z]{1,3}[-\s]\d+[-\s]\d+$/i // Listing Decision format
  ];
  
  return validPatterns.some(pattern => pattern.test(reference.trim()));
}

/**
 * Extract rule references from text with detailed parsing
 */
function extractRuleReferences(text: string): Array<{
  fullReference: string;
  baseRule: string;
  subsections: string[];
}> {
  const rulePattern = /Rule\s+(\d+(?:\.\d+)*)(\([^)]+\))*(\([^)]+\))*/gi;
  const references: Array<{
    fullReference: string;
    baseRule: string;
    subsections: string[];
  }> = [];

  let match;
  while ((match = rulePattern.exec(text)) !== null) {
    const fullReference = match[0];
    const baseRule = match[1];
    const subsections: string[] = [];
    
    // Extract all subsection parts
    let subsectionMatch;
    const subsectionPattern = /\([^)]+\)/g;
    while ((subsectionMatch = subsectionPattern.exec(fullReference)) !== null) {
      subsections.push(subsectionMatch[0]);
    }

    references.push({
      fullReference,
      baseRule,
      subsections
    });
  }

  return references;
}

/**
 * Extract critical regulatory phrases that must be preserved exactly
 */
function extractCriticalPhrases(text: string): string[] {
  const phrases: string[] = [];
  
  // Look for specific regulatory terminology
  const patterns = [
    /profit test/gi,
    /sufficient public float/gi,
    /market capitalization/gi,
    /trading arrangement/gi,
    /whitewash waiver/gi
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      phrases.push(...matches);
    }
  }

  return phrases;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default databaseContentValidator;
