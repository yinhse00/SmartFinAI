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

    // Check for invented rule references not present in the database context
    for (const respRef of responseRuleRefs) {
      if (!dbRefStrings.has(respRef.fullReference.toLowerCase())) {
        const isGeneralization = databaseRuleRefs.some(dbRef =>
          dbRef.fullReference.toLowerCase().startsWith(respRef.fullReference.toLowerCase())
        );

        if (!isGeneralization) {
          const issue = `Rule reference invented: Response contains "${respRef.fullReference}" which is not found in the source database content.`;
          issues.push(issue);
          corrections.push({
            type: 'content_modification',
            original: '', // No original content to reference
            incorrect: respRef.fullReference,
            reason: 'Rule reference was invented and is not present in the database context.',
          });
          preservationScore -= 0.3; // Heavier penalty for invention
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
   * Apply corrections to response text
   */
  applyCorrections: (responseText: string, corrections: Correction[]): string => {
    let correctedText = responseText;

    for (const correction of corrections) {
      if (correction.type === 'rule_reference') {
        // Replace generalized rule references with exact ones
        const pattern = new RegExp(`\\b${escapeRegExp(correction.incorrect)}\\b`, 'g');
        correctedText = correctedText.replace(pattern, correction.original);
        
        console.log(`Applied correction: "${correction.incorrect}" -> "${correction.original}"`);
      } else if (correction.type === 'content_modification' && correction.reason.includes('invented')) {
        // For invented rules, replace with a notice to avoid breaking sentence structure badly.
        const pattern = new RegExp(`\\b${escapeRegExp(correction.incorrect)}\\b`, 'g');
        correctedText = correctedText.replace(pattern, '[Reference removed for inaccuracy]');
        console.log(`Applied correction: Removed invented rule reference "${correction.incorrect}"`);
      }
    }

    return correctedText;
  }
};

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
