
import { databaseService } from '../../database/databaseService';
import { extractKeyTerms } from '../../database/utils/textProcessing';
import { searchService } from '../../databaseService';
import { mappingValidationService } from '../mappingValidationService';

/**
 * Service to provide validation context for cross-checking response accuracy
 */
export const validationContextService = {
  /**
   * Get validation context to verify response accuracy
   * Uses different search strategies than the primary context retrieval
   */
  getValidationContext: async (query: string) => {
    try {
      console.log('Retrieving validation context for cross-checking response accuracy');
      
      // First check if the query relates to new listing applicants
      const isNewListingQuery = 
        query.toLowerCase().includes('new listing') ||
        query.toLowerCase().includes('ipo') ||
        query.toLowerCase().includes('initial public offering') ||
        query.toLowerCase().includes('listing applicant');
      
      // If it's a new listing query, prioritize validation against the mapping guide
      if (isNewListingQuery) {
        console.log('Detected new listing query, checking mapping guidance for validation');
        // Get the guidance document for validation context
        const guidanceDoc = await mappingValidationService.getListingGuidanceDocument();
        
        if (guidanceDoc) {
          console.log('Found listing guidance document for validation context');
          // Extract relevant sections for validation context
          const relevantGuidance = await mappingValidationService.extractRelevantGuidance(
            guidanceDoc.content,
            query
          );
          
          if (relevantGuidance) {
            return {
              context: `[VALIDATION: New Listing Applicant Guide]:\n${relevantGuidance}`,
              source: 'mapping-guidance'
            };
          }
        }
      }
      
      // Extract key financial terms for targeted search
      const keyTerms = extractKeyTerms(query);
      console.log('Validation search using key terms:', keyTerms);
      
      // Step 1: Look for exact references in the query
      const chapterMatch = query.match(/chapter\s+(\d+[A-Z]?)/i);
      const ruleMatch = query.match(/rule\s+(\d+(\.\d+)?)/i);
      
      let validationEntries = [];
      
      // If specific chapter/rule is referenced, prioritize that
      if (chapterMatch || ruleMatch) {
        const reference = chapterMatch ? 
          `Chapter ${chapterMatch[1]}` : 
          `Rule ${ruleMatch[1]}`;
          
        console.log(`Looking for validation data in specific reference: ${reference}`);
        
        // Search specifically for this reference
        validationEntries = await searchService.search(reference);
        
        // Filter to most relevant entries only
        validationEntries = validationEntries
          .filter(entry => entry.content.includes(reference))
          .slice(0, 2);  // Limit to top 2 most relevant
      }
      
      // If we couldn't find specific references, try alternative search strategy
      if (validationEntries.length === 0) {
        // Create alternative queries by reordering terms
        const altQueries = [
          keyTerms.reverse().join(' '),
          `regulation ${keyTerms.join(' ')}`,
          `requirement ${keyTerms.join(' ')}`
        ];
        
        // Try each alternative query
        for (const altQuery of altQueries) {
          console.log(`Trying alternative validation query: ${altQuery}`);
          const altResults = await searchService.search(altQuery);
          
          if (altResults.length > 0) {
            validationEntries = altResults.slice(0, 2);
            break;
          }
        }
      }
      
      // Format validation context with clear markers
      if (validationEntries.length > 0) {
        const context = validationEntries
          .map(entry => `[VALIDATION: ${entry.title}]:\n${entry.content}`)
          .join('\n\n---\n\n');
          
        return {
          context,
          source: 'alternative-search'
        };
      }
      
      return { context: '', source: 'none' };
    } catch (error) {
      console.error('Error retrieving validation context:', error);
      return { context: '', source: 'error' };
    }
  }
};
