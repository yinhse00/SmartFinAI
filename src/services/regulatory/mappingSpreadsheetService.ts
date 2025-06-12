
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

/**
 * Extract topics from query for guidance lookups
 */
export const extractTopicsFromQuery = async (query: string): Promise<string[]> => {
  const commonTopics = [
    'acquisition', 'disposal', 'merger', 'takeover', 'transaction',
    'rights issue', 'placing', 'subscription', 'share issue',
    'dividend', 'distribution', 'spin-off', 'demerger',
    'change in shareholding', 'discloseable transaction', 'connected transaction',
    'very substantial acquisition', 'very substantial disposal',
    'major transaction', 'notifiable transaction'
  ];
  
  const lowerQuery = query.toLowerCase();
  const foundTopics = commonTopics.filter(topic => lowerQuery.includes(topic));
  
  return foundTopics;
};

/**
 * Find relevant guidance materials
 */
export const findRelevantGuidance = async (
  query: string, 
  topics: string[]
): Promise<{ guidanceContext: string; sourceMaterials: string[] }> => {
  try {
    const searchTerms = extractSearchTerms(query);
    const documents: any[] = [];
    
    // Search in FAQ documents
    const { data: faqData, error: faqError } = await supabase
      .from('listingrule_new_faq')
      .select('*')
      .limit(20);
    
    if (!faqError && faqData) {
      for (const faq of faqData) {
        const searchableText = `${faq.topic || ''} ${faq.faqtopic || ''}`;
        const relevance = calculateRelevance(searchTerms, searchableText);
        if (relevance > 0.1) {
          documents.push({
            content: `FAQ: ${faq.topic || ''} - ${faq.faqtopic || ''}`,
            relevance,
            source: faq.chapter || 'FAQ'
          });
        }
      }
    }
    
    // Search in guidance letters
    const { data: guidanceData, error: guidanceError } = await supabase
      .from('listingrule_new_gl')
      .select('*')
      .limit(20);
    
    if (!guidanceError && guidanceData) {
      for (const guidance of guidanceData) {
        const searchableText = `${guidance.title || ''} ${guidance.particulars || ''}`;
        const relevance = calculateRelevance(searchTerms, searchableText);
        if (relevance > 0.1) {
          documents.push({
            content: `Guidance: ${guidance.title || ''} - ${guidance.particulars || ''}`,
            relevance,
            source: guidance.reference_no || 'Guidance Letter'
          });
        }
      }
    }
    
    if (documents.length === 0) {
      return {
        guidanceContext: "No specific guidance materials found.",
        sourceMaterials: []
      };
    }
    
    // Sort by relevance and combine content
    documents.sort((a, b) => b.relevance - a.relevance);
    const topDocuments = documents.slice(0, 5);
    
    const guidanceContext = topDocuments
      .map(doc => doc.content)
      .join('\n\n');
    
    const sourceMaterials = topDocuments
      .map(doc => doc.source)
      .filter(source => source);
    
    return {
      guidanceContext,
      sourceMaterials
    };
  } catch (error) {
    console.error('Error finding relevant guidance:', error);
    return {
      guidanceContext: "No specific guidance materials found.",
      sourceMaterials: []
    };
  }
};

// Export the service object for backward compatibility
export const mappingSpreadsheetService = {
  validateAgainstMappingDocuments,
  extractTopicsFromQuery,
  findRelevantGuidance
};
