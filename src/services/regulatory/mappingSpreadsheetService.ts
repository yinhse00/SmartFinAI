
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface MappingValidationResult {
  isValid: boolean;
  confidence: number;
  corrections?: string;
  sourceMaterials: string[];
}

interface MappingGuidanceDocument {
  title: string;
  content: string;
  metadata?: any;
}

interface GuidanceSearchResult {
  guidanceContext: string;
  sourceMaterials: string[];
}

export const mappingSpreadsheetService = {
  /**
   * Validates a response against the listing guidance mapping data
   */
  validateAgainstListingGuidance: async (response: string, query: string): Promise<MappingValidationResult> => {
    try {
      console.log('Validating response against listing guidance mapping data...');
      
      // Get the mapping guidance document
      const document = await mappingSpreadsheetService.getListingGuidanceDocument();
      
      if (!document) {
        console.log('No mapping guidance document found');
        return {
          isValid: true, // Default to true if we can't validate
          confidence: 0.5,
          sourceMaterials: []
        };
      }
      
      // Extract relevant guidance based on the query
      const relevantGuidance = await mappingSpreadsheetService.extractRelevantGuidance(query, document);
      
      console.log('Relevant guidance found:', !!relevantGuidance);
      
      if (!relevantGuidance) {
        // No specific guidance found for this query
        return {
          isValid: true, // Default to true if we can't find relevant guidance
          confidence: 0.6,
          sourceMaterials: [document.title]
        };
      }
      
      // Very simple validation logic - check if response contains key terms from guidance
      // In a real implementation, this would use more sophisticated NLP techniques
      const keyTerms = extractKeyTerms(relevantGuidance);
      const termMatches = keyTerms.filter(term => 
        response.toLowerCase().includes(term.toLowerCase())
      );
      
      const matchRatio = termMatches.length / keyTerms.length;
      
      console.log('Validation match ratio:', matchRatio);
      
      return {
        isValid: matchRatio > 0.4, // Simple threshold
        confidence: Math.min(0.5 + matchRatio * 0.5, 0.95), // Scale confidence between 0.5-0.95
        corrections: matchRatio < 0.4 ? "Response may not fully address the guidance requirements" : undefined,
        sourceMaterials: [document.title]
      };
    } catch (error) {
      console.error('Error validating against listing guidance:', error);
      return {
        isValid: true, // Default to true on error
        confidence: 0.5,
        sourceMaterials: []
      };
    }
  },
  
  /**
   * Gets the listing guidance document from Supabase
   */
  getListingGuidanceDocument: async (): Promise<MappingGuidanceDocument | null> => {
    try {
      const { data, error } = await supabase
        .from('reference_documents')
        .select('title, content, metadata')
        .ilike('title', '%Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants%')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error || !data || data.length === 0) {
        console.error('Error fetching listing guidance document:', error);
        return null;
      }
      
      return {
        title: data[0].title,
        content: data[0].content || '',
        metadata: data[0].metadata
      };
    } catch (error) {
      console.error('Error in getListingGuidanceDocument:', error);
      return null;
    }
  },
  
  /**
   * Extracts guidance relevant to the query from the document
   */
  extractRelevantGuidance: async (query: string, document: MappingGuidanceDocument): Promise<string | null> => {
    try {
      // If there's structured metadata already extracted, use that
      if (document.metadata && Array.isArray(document.metadata.mappings)) {
        // Extract keywords from the query
        const queryKeywords = extractKeywords(query);
        
        // Find relevant mappings
        const relevantMappings = document.metadata.mappings.filter((mapping: any) => {
          if (!mapping.keywords || !Array.isArray(mapping.keywords)) return false;
          
          // Check if any keywords match
          return mapping.keywords.some((keyword: string) => 
            queryKeywords.some(queryWord => 
              keyword.toLowerCase().includes(queryWord.toLowerCase()) ||
              queryWord.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        });
        
        if (relevantMappings.length > 0) {
          return relevantMappings
            .map((mapping: any) => mapping.guidance || mapping.content || '')
            .join('\n\n');
        }
      }
      
      // Fallback to simple content search if no structured metadata or no matches
      if (!document.content) return null;
      
      // Split the content into sections and find relevant ones
      // This is a simple implementation - a real one would use better NLP
      const sections = document.content.split(/\n{2,}/);
      const queryTerms = extractKeywords(query);
      
      const relevantSections = sections.filter(section => 
        queryTerms.some(term => section.toLowerCase().includes(term.toLowerCase()))
      );
      
      if (relevantSections.length > 0) {
        return relevantSections.join('\n\n');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting relevant guidance:', error);
      return null;
    }
  },

  /**
   * Extract topics from a query for guidance lookups
   */
  extractTopicsFromQuery: async (query: string): Promise<string[]> => {
    try {
      console.log('Extracting topics from query:', query);
      
      // Simple keyword extraction - in production, this would use NLP
      const keywords = extractKeywords(query);
      
      // Filter out common words and short terms
      const topics = keywords.filter(keyword => 
        keyword.length > 3 && !commonWords.has(keyword.toLowerCase())
      );
      
      console.log('Extracted topics:', topics);
      return topics;
    } catch (error) {
      console.error('Error extracting topics from query:', error);
      return [];
    }
  },

  /**
   * Find relevant guidance materials based on query and topics
   */
  findRelevantGuidance: async (query: string, topics: string[]): Promise<GuidanceSearchResult> => {
    try {
      console.log('Finding relevant guidance for topics:', topics);
      
      if (!topics || topics.length === 0) {
        return {
          guidanceContext: "No specific guidance materials found.",
          sourceMaterials: []
        };
      }
      
      // Search for guidance documents related to the topics
      const { data: guidanceDocs, error } = await supabase
        .from('reference_documents')
        .select('id, title, content, metadata')
        .eq('category', 'guidance')
        .order('created_at', { ascending: false });
      
      if (error || !guidanceDocs || guidanceDocs.length === 0) {
        console.log('No guidance documents found or error occurred:', error);
        return {
          guidanceContext: "No specific guidance materials found.",
          sourceMaterials: []
        };
      }
      
      // Filter documents by relevance to topics
      const relevantDocs = guidanceDocs.filter(doc => {
        const docContent = doc.content || '';
        return topics.some(topic => 
          docContent.toLowerCase().includes(topic.toLowerCase()) || 
          (doc.title && doc.title.toLowerCase().includes(topic.toLowerCase()))
        );
      });
      
      if (relevantDocs.length === 0) {
        return {
          guidanceContext: "No specific guidance materials found.",
          sourceMaterials: []
        };
      }
      
      // Extract relevant sections from documents
      const relevantSections: string[] = [];
      const sourceMaterials: string[] = [];
      
      for (const doc of relevantDocs) {
        if (!doc.content) continue;
        
        // Add document title to sources
        if (doc.title && !sourceMaterials.includes(doc.title)) {
          sourceMaterials.push(doc.title);
        }
        
        // Extract relevant sections from each document
        const sections = doc.content.split(/\n{2,}/);
        const relevantDocsContent = sections.filter(section => 
          topics.some(topic => section.toLowerCase().includes(topic.toLowerCase()))
        );
        
        if (relevantDocsContent.length > 0) {
          relevantSections.push(
            `--- From ${doc.title} ---\n` + 
            relevantDocsContent.join('\n\n')
          );
        }
      }
      
      const combinedContext = relevantSections.length > 0 
        ? relevantSections.join('\n\n\n')
        : "No specific guidance materials found.";
        
      return {
        guidanceContext: combinedContext,
        sourceMaterials
      };
    } catch (error) {
      console.error('Error finding relevant guidance:', error);
      return {
        guidanceContext: "Error retrieving guidance materials.",
        sourceMaterials: []
      };
    }
  }
};

// Helper functions
function extractKeyTerms(text: string): string[] {
  // Split the text into words, filter out common words and short words
  const words = text.split(/\s+/).filter(word => {
    const cleanWord = word.replace(/[.,;:!?()[\]{}'"]/g, '').toLowerCase();
    return cleanWord.length > 3 && !commonWords.has(cleanWord);
  });
  
  // Get unique words
  return Array.from(new Set(words));
}

function extractKeywords(text: string): string[] {
  // Remove punctuation and split into words
  const words = text
    .replace(/[.,;:!?()[\]{}'"]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word.toLowerCase()));
  
  return Array.from(new Set(words));
}

// Set of common words to filter out
const commonWords = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 
  'but', 'his', 'from', 'they', 'she', 'will', 'would', 'their', 'what',
  'there', 'about', 'which', 'when', 'make', 'can', 'like', 'time', 'just',
  'him', 'know', 'take', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'first',
  'well', 'way', 'even', 'want', 'because', 'these', 'give', 'most'
]);

export default mappingSpreadsheetService;
