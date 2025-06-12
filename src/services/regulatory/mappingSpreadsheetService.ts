import { supabase } from '@/integrations/supabase/client';

export interface MappingDocument {
  id: string;
  title: string;
  content: string;
  relevance: number;
  source: string;
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
 * Search for documents that might contain mapping information
 */
async function searchMappingDocuments(searchTerms: string[]): Promise<any[]> {
  const documents: any[] = [];
  
  try {
    // Search in main documents table using correct table name
    const { data: docData, error: docError } = await supabase
      .from('mb_listingrule_documents')
      .select('*')
      .limit(50);
    
    if (!docError && docData) {
      for (const doc of docData) {
        const searchableText = `${doc.title || ''} ${doc.description || ''}`;
        const relevance = calculateRelevance(searchTerms, searchableText);
        if (relevance > 0.2) {
          documents.push({
            ...doc,
            relevance,
            source: 'mb_listingrule_documents'
          });
        }
      }
    }
    
    // Search in guidance letters using correct table name
    const { data: guidanceData, error: guidanceError } = await supabase
      .from('listingrule_new_gl')
      .select('*')
      .limit(50);
    
    if (!guidanceError && guidanceData) {
      for (const guidance of guidanceData) {
        const searchableText = `${guidance.title || ''} ${guidance.particulars || ''}`;
        const relevance = calculateRelevance(searchTerms, searchableText);
        if (relevance > 0.2) {
          documents.push({
            ...guidance,
            relevance,
            source: 'listingrule_new_gl'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error searching mapping documents:', error);
  }
  
  return documents.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Enhanced mapping validation with comprehensive document search
 */
export const validateAgainstMappingDocuments = async (
  response: string,
  query: string,
  isNewListingQuery: boolean = false
): Promise<{
  isValid: boolean;
  confidence: number;
  corrections?: string;
  sourceMaterials: string[];
  mappingDocuments?: any[];
}> => {
  try {
    console.log('Validating response against mapping documents...');
    
    const searchTerms = extractSearchTerms(query);
    const mappingDocs = await searchMappingDocuments(searchTerms);
    
    if (mappingDocs.length === 0) {
      return {
        isValid: true,
        confidence: 0.5,
        sourceMaterials: [],
        mappingDocuments: []
      };
    }
    
    // Analyze response against found documents
    const inconsistencies: string[] = [];
    const sourceMaterials: string[] = [];
    
    for (const doc of mappingDocs.slice(0, 5)) {
      if (doc.title) sourceMaterials.push(doc.title);
      
      // Simple validation - check for major contradictions
      const contradiction = findContradictions(response, doc.description || doc.particulars || '');
      if (contradiction) {
        inconsistencies.push(contradiction);
      }
    }
    
    const isValid = inconsistencies.length === 0;
    const confidence = isValid ? 0.8 : 0.4;
    
    console.log(`Mapping validation completed. Valid: ${isValid}, Found ${mappingDocs.length} documents`);
    
    return {
      isValid,
      confidence,
      corrections: inconsistencies.length > 0 ? inconsistencies.join('; ') : undefined,
      sourceMaterials,
      mappingDocuments: mappingDocs.slice(0, 10)
    };
  } catch (error) {
    console.error('Error in validateAgainstMappingDocuments:', error);
    return {
      isValid: true,
      confidence: 0,
      sourceMaterials: [],
      mappingDocuments: []
    };
  }
};
