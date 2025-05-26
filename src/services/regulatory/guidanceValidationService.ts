
import { supabase } from '@/integrations/supabase/client';

export interface GuidanceMatch {
  id: string;
  type: 'faq' | 'guidance';
  title: string;
  content: string;
  relevanceScore: number;
  applicableRules?: string[];
  guidanceNumber?: string;
  sourceDocumentId?: string;
}

export interface GuidanceValidation {
  hasRelevantGuidance: boolean;
  matches: GuidanceMatch[];
  totalMatches: number;
  confidence: number;
}

/**
 * Service for validating responses against regulatory FAQs and interpretation guidance
 */
export const guidanceValidationService = {
  /**
   * Search for relevant FAQs and guidance based on query
   */
  findRelevantGuidance: async (query: string, maxResults: number = 5): Promise<GuidanceValidation> => {
    try {
      console.log('Searching for relevant regulatory guidance and FAQs');
      
      const searchTerms = extractSearchTerms(query);
      console.log('Search terms extracted:', searchTerms);
      
      // Search FAQs and guidance in parallel
      const [faqResults, guidanceResults] = await Promise.all([
        searchRegulatoryFAQs(searchTerms, Math.ceil(maxResults / 2)),
        searchInterpretationGuidance(searchTerms, Math.ceil(maxResults / 2))
      ]);
      
      // Combine and sort by relevance
      const allMatches = [...faqResults, ...guidanceResults]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);
      
      const confidence = calculateGuidanceConfidence(allMatches, query);
      
      return {
        hasRelevantGuidance: allMatches.length > 0,
        matches: allMatches,
        totalMatches: faqResults.length + guidanceResults.length,
        confidence
      };
    } catch (error) {
      console.error('Error finding relevant guidance:', error);
      return {
        hasRelevantGuidance: false,
        matches: [],
        totalMatches: 0,
        confidence: 0
      };
    }
  },

  /**
   * Validate a response against existing guidance
   */
  validateResponseAgainstGuidance: async (
    response: string, 
    query: string
  ): Promise<{
    isConsistent: boolean;
    conflictingGuidance: GuidanceMatch[];
    supportingGuidance: GuidanceMatch[];
    confidence: number;
  }> => {
    try {
      console.log('Validating response against existing guidance');
      
      const guidanceValidation = await guidanceValidationService.findRelevantGuidance(query, 10);
      
      if (!guidanceValidation.hasRelevantGuidance) {
        return {
          isConsistent: true,
          conflictingGuidance: [],
          supportingGuidance: [],
          confidence: 0.5 // Neutral when no guidance exists
        };
      }
      
      // Analyze consistency (simplified implementation)
      const supportingGuidance: GuidanceMatch[] = [];
      const conflictingGuidance: GuidanceMatch[] = [];
      
      for (const guidance of guidanceValidation.matches) {
        const consistency = analyzeConsistency(response, guidance.content);
        
        if (consistency > 0.7) {
          supportingGuidance.push(guidance);
        } else if (consistency < 0.3) {
          conflictingGuidance.push(guidance);
        }
      }
      
      const isConsistent = conflictingGuidance.length === 0;
      const confidence = calculateValidationConfidence(supportingGuidance, conflictingGuidance);
      
      return {
        isConsistent,
        conflictingGuidance,
        supportingGuidance,
        confidence
      };
    } catch (error) {
      console.error('Error validating response against guidance:', error);
      return {
        isConsistent: true,
        conflictingGuidance: [],
        supportingGuidance: [],
        confidence: 0
      };
    }
  },

  /**
   * Get specific guidance by ID
   */
  getGuidanceById: async (id: string, type: 'faq' | 'guidance'): Promise<GuidanceMatch | null> => {
    try {
      const tableName = type === 'faq' ? 'regulatory_faqs' : 'interpretation_guidance';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      if (type === 'faq') {
        return {
          id: data.id,
          type: 'faq',
          title: data.question,
          content: data.answer,
          relevanceScore: 1.0,
          applicableRules: data.related_provisions,
          sourceDocumentId: data.source_document_id
        };
      } else {
        return {
          id: data.id,
          type: 'guidance',
          title: data.title,
          content: data.content,
          relevanceScore: 1.0,
          applicableRules: data.applicable_rules,
          guidanceNumber: data.guidance_number,
          sourceDocumentId: data.source_document_id
        };
      }
    } catch (error) {
      console.error('Error fetching guidance by ID:', error);
      return null;
    }
  }
};

/**
 * Search regulatory FAQs
 */
async function searchRegulatoryFAQs(searchTerms: string[], maxResults: number): Promise<GuidanceMatch[]> {
  try {
    let query = supabase
      .from('regulatory_faqs')
      .select('*');
    
    // Build search conditions
    const searchConditions = searchTerms.map(term => 
      `question.ilike.%${term}%,answer.ilike.%${term}%`
    ).join(',');
    
    if (searchConditions) {
      query = query.or(searchConditions);
    }
    
    const { data, error } = await query.limit(maxResults);
    
    if (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
    
    return (data || []).map(faq => ({
      id: faq.id,
      type: 'faq' as const,
      title: faq.question,
      content: faq.answer,
      relevanceScore: calculateRelevanceScore(searchTerms, faq.question + ' ' + faq.answer),
      applicableRules: faq.related_provisions,
      sourceDocumentId: faq.source_document_id
    }));
  } catch (error) {
    console.error('Error in searchRegulatoryFAQs:', error);
    return [];
  }
}

/**
 * Search interpretation guidance
 */
async function searchInterpretationGuidance(searchTerms: string[], maxResults: number): Promise<GuidanceMatch[]> {
  try {
    let query = supabase
      .from('interpretation_guidance')
      .select('*');
    
    // Build search conditions
    const searchConditions = searchTerms.map(term => 
      `title.ilike.%${term}%,content.ilike.%${term}%`
    ).join(',');
    
    if (searchConditions) {
      query = query.or(searchConditions);
    }
    
    const { data, error } = await query.limit(maxResults);
    
    if (error) {
      console.error('Error searching interpretation guidance:', error);
      return [];
    }
    
    return (data || []).map(guidance => ({
      id: guidance.id,
      type: 'guidance' as const,
      title: guidance.title,
      content: guidance.content,
      relevanceScore: calculateRelevanceScore(searchTerms, guidance.title + ' ' + guidance.content),
      applicableRules: guidance.applicable_rules,
      guidanceNumber: guidance.guidance_number,
      sourceDocumentId: guidance.source_document_id
    }));
  } catch (error) {
    console.error('Error in searchInterpretationGuidance:', error);
    return [];
  }
}

/**
 * Extract meaningful search terms from query
 */
function extractSearchTerms(query: string): string[] {
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall']);
  
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term))
    .slice(0, 10); // Limit to top 10 terms
}

/**
 * Calculate relevance score based on term matching
 */
function calculateRelevanceScore(searchTerms: string[], content: string): number {
  const contentLower = content.toLowerCase();
  const matchedTerms = searchTerms.filter(term => contentLower.includes(term));
  return matchedTerms.length / searchTerms.length;
}

/**
 * Analyze consistency between response and guidance (simplified)
 */
function analyzeConsistency(response: string, guidance: string): number {
  // This is a simplified implementation
  // In a real system, you might use NLP or ML models for better analysis
  const responseWords = new Set(response.toLowerCase().split(/\s+/));
  const guidanceWords = new Set(guidance.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...responseWords].filter(word => guidanceWords.has(word)));
  const union = new Set([...responseWords, ...guidanceWords]);
  
  return intersection.size / union.size;
}

/**
 * Calculate guidance confidence
 */
function calculateGuidanceConfidence(matches: GuidanceMatch[], query: string): number {
  if (matches.length === 0) return 0;
  
  const avgRelevance = matches.reduce((sum, match) => sum + match.relevanceScore, 0) / matches.length;
  const countFactor = Math.min(matches.length / 5, 1); // Normalize based on expected max results
  
  return avgRelevance * countFactor;
}

/**
 * Calculate validation confidence
 */
function calculateValidationConfidence(supportingGuidance: GuidanceMatch[], conflictingGuidance: GuidanceMatch[]): number {
  const totalGuidance = supportingGuidance.length + conflictingGuidance.length;
  if (totalGuidance === 0) return 0.5;
  
  const supportRatio = supportingGuidance.length / totalGuidance;
  const conflictPenalty = conflictingGuidance.length * 0.2;
  
  return Math.max(0, Math.min(1, supportRatio - conflictPenalty));
}
