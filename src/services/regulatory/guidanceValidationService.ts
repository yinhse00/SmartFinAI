import { supabase } from '@/integrations/supabase/client';

export interface GuidanceMatch {
  id: string;
  title: string;
  content: string;
  type: 'faq' | 'guidance';
  relevance: number;
  source: string;
  relatedProvisions?: string[];
  applicableRules?: string[];
  guidanceNumber?: string;
}

export interface GuidanceValidation {
  hasRelevantGuidance: boolean;
  matches: GuidanceMatch[];
  confidence: number;
  searchStrategy: string;
}

/**
 * Service for validating regulatory guidance and FAQs
 */
export const guidanceValidationService = {
  /**
   * Search for relevant FAQs and guidance documents
   */
  searchRelevantGuidance: async (query: string): Promise<GuidanceValidation> => {
    try {
      console.log('Searching for relevant guidance and FAQs...');
      
      const searchTerms = extractSearchTerms(query);
      const matches: GuidanceMatch[] = [];
      
      // Search FAQs
      const faqMatches = await searchFAQs(searchTerms);
      matches.push(...faqMatches);
      
      // Search interpretation guidance
      const guidanceMatches = await searchInterpretationGuidance(searchTerms);
      matches.push(...guidanceMatches);
      
      // Sort by relevance
      matches.sort((a, b) => b.relevance - a.relevance);
      
      const hasRelevantGuidance = matches.length > 0;
      const confidence = hasRelevantGuidance ? 
        Math.min(0.9, Math.max(...matches.map(m => m.relevance))) : 0;
      
      console.log(`Found ${matches.length} relevant guidance documents`);
      
      return {
        hasRelevantGuidance,
        matches: matches.slice(0, 10), // Limit to top 10
        confidence,
        searchStrategy: 'combined_faq_guidance'
      };
    } catch (error) {
      console.error('Error searching guidance:', error);
      return {
        hasRelevantGuidance: false,
        matches: [],
        confidence: 0,
        searchStrategy: 'error'
      };
    }
  },

  /**
   * Find relevant guidance - alias for searchRelevantGuidance
   */
  findRelevantGuidance: async (query: string, limit: number = 10): Promise<GuidanceValidation> => {
    const result = await guidanceValidationService.searchRelevantGuidance(query);
    return {
      ...result,
      matches: result.matches.slice(0, limit)
    };
  },

  /**
   * Validate a response against guidance documents
   */
  validateResponseAgainstGuidance: async (
    response: string, 
    query: string, 
    guidanceMatches?: GuidanceMatch[]
  ): Promise<{
    isConsistent: boolean;
    inconsistencies: string[];
    confidence: number;
    conflictingGuidance: string[];
  }> => {
    try {
      console.log('Validating response against guidance documents...');
      
      let matches = guidanceMatches;
      if (!matches) {
        const guidanceResult = await guidanceValidationService.searchRelevantGuidance(query);
        matches = guidanceResult.matches;
      }
      
      if (matches.length === 0) {
        return {
          isConsistent: true,
          inconsistencies: [],
          confidence: 0.5,
          conflictingGuidance: []
        };
      }
      
      const inconsistencies: string[] = [];
      const conflictingGuidance: string[] = [];
      
      // Simple validation - check for contradictions
      for (const match of matches) {
        const contradiction = findContradictions(response, match.content);
        if (contradiction) {
          inconsistencies.push(`Potential inconsistency with ${match.type}: ${contradiction}`);
          conflictingGuidance.push(match.title);
        }
      }
      
      const isConsistent = inconsistencies.length === 0;
      const confidence = isConsistent ? 0.8 : 0.3;
      
      console.log(`Guidance validation completed. Consistent: ${isConsistent}`);
      
      return {
        isConsistent,
        inconsistencies,
        confidence,
        conflictingGuidance
      };
    } catch (error) {
      console.error('Error validating against guidance:', error);
      return {
        isConsistent: false,
        inconsistencies: ['Error during validation'],
        confidence: 0,
        conflictingGuidance: []
      };
    }
  }
};

/**
 * Search FAQs table
 */
async function searchFAQs(searchTerms: string[]): Promise<GuidanceMatch[]> {
  const matches: GuidanceMatch[] = [];
  
  try {
    const { data, error } = await supabase
      .from('regulatory_faqs')
      .select('*')
      .limit(20);
    
    if (error) {
      console.error('Error searching FAQs:', error);
      return matches;
    }
    
    if (data) {
      for (const item of data) {
        const relevance = calculateRelevance(searchTerms, item.question + ' ' + item.answer);
        if (relevance > 0.3) {
          matches.push({
            id: item.id,
            title: item.question,
            content: item.answer,
            type: 'faq',
            relevance,
            source: 'regulatory_faqs',
            relatedProvisions: item.related_provisions || []
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in searchFAQs:', error);
  }
  
  return matches;
}

/**
 * Search interpretation guidance table
 */
async function searchInterpretationGuidance(searchTerms: string[]): Promise<GuidanceMatch[]> {
  const matches: GuidanceMatch[] = [];
  
  try {
    const { data, error } = await supabase
      .from('interpretation_guidance')
      .select('*')
      .limit(20);
    
    if (error) {
      console.error('Error searching guidance:', error);
      return matches;
    }
    
    if (data) {
      for (const item of data) {
        const relevance = calculateRelevance(searchTerms, item.title + ' ' + item.content);
        if (relevance > 0.3) {
          matches.push({
            id: item.id,
            title: item.title,
            content: item.content,
            type: 'guidance',
            relevance,
            source: 'interpretation_guidance',
            applicableRules: item.applicable_rules || [],
            guidanceNumber: item.guidance_number || ''
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in searchInterpretationGuidance:', error);
  }
  
  return matches;
}

/**
 * Extract search terms from query
 */
function extractSearchTerms(query: string): string[] {
  const terms = query.toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2)
    .filter(term => !['the', 'and', 'but', 'for', 'are', 'with'].includes(term));
  
  return [...new Set(terms)];
}

/**
 * Calculate relevance score
 */
function calculateRelevance(searchTerms: string[], content: string): number {
  const lowerContent = content.toLowerCase();
  let score = 0;
  
  for (const term of searchTerms) {
    if (lowerContent.includes(term)) {
      score += 0.1;
    }
  }
  
  return Math.min(1.0, score);
}

/**
 * Find contradictions between response and guidance
 */
function findContradictions(response: string, guidance: string): string | null {
  // Simple contradiction detection
  const responseWords = response.toLowerCase().split(/\s+/);
  const guidanceWords = guidance.toLowerCase().split(/\s+/);
  
  // Look for opposite keywords
  const contradictionPairs = [
    ['required', 'not required'],
    ['mandatory', 'optional'],
    ['must', 'may'],
    ['shall', 'should']
  ];
  
  for (const [positive, negative] of contradictionPairs) {
    const hasPositiveInResponse = responseWords.includes(positive);
    const hasNegativeInGuidance = guidanceWords.includes(negative);
    
    if (hasPositiveInResponse && hasNegativeInGuidance) {
      return `Response suggests '${positive}' but guidance indicates '${negative}'`;
    }
  }
  
  return null;
}

/**
 * Validate response against listing guidance materials 
 */
export const validateAgainstListingGuidance = async (
  response: string, 
  query: string
): Promise<{
  isValid: boolean;
  confidence: number;
  corrections?: string;
  sourceMaterials: string[];
}> => {
  try {
    // Search for relevant guidance materials using correct table names
    const { data: guidanceData, error: guidanceError } = await supabase
      .from('mb_listingrule_documents')
      .select('*')
      .or('title.ilike.%Guide for New Listing%,title.ilike.%Guidance Materials%')
      .limit(10);
    
    if (guidanceError) {
      console.error('Error fetching guidance materials:', guidanceError);
      return {
        isValid: true,
        confidence: 0,
        sourceMaterials: []
      };
    }
    
    const sourceMaterials = guidanceData?.map(doc => doc.title) || [];
    
    // Basic validation - in a real implementation this would be more sophisticated
    const hasRelevantContent = response.length > 100;
    const confidence = hasRelevantContent ? 0.7 : 0.3;
    
    return {
      isValid: hasRelevantContent,
      confidence,
      sourceMaterials
    };
  } catch (error) {
    console.error('Error in validateAgainstListingGuidance:', error);
    return {
      isValid: true,
      confidence: 0,
      sourceMaterials: []
    };
  }
};
