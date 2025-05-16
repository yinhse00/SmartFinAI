
import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Service for intelligent mapping of queries to guidance materials
 * Uses the "Mapping_schedule_FAQ_Guidance Materials for Listed Issuers" data
 */
export const mappingSpreadsheetService = {
  /**
   * Find relevant guidance and listing decisions based on query concepts
   */
  async findRelevantGuidance(query: string, queryTopics: string[] = []): Promise<{
    guidanceContext: string;
    sourceMaterials: string[];
  }> {
    try {
      console.log('Finding relevant guidance for:', query);
      
      // Extract key concepts if not provided
      const topics = queryTopics.length > 0 ? queryTopics : await this.extractTopicsFromQuery(query);
      console.log('Extracted topics:', topics);

      // First check for specific regulatory topics
      const hasIFAReferences = 
        query.toLowerCase().includes('ifa') ||
        query.toLowerCase().includes('independent financial adviser') ||
        query.toLowerCase().includes('financial adviser');
        
      const hasMajorTransactionReferences = 
        query.toLowerCase().includes('major transaction') ||
        query.toLowerCase().includes('chapter 14');
        
      // For IFA + major transaction queries, add specific search topics and correct rule references
      if (hasIFAReferences && hasMajorTransactionReferences) {
        topics.push('ifa requirement');
        topics.push('financial adviser');
        topics.push('major transaction');
        topics.push('chapter 14');
        topics.push('rule 14.06'); // Major transaction definition
        topics.push('rule 13.84'); // IFA independence criteria
        topics.push('rule 14A.44'); // Connected transaction IFA requirements
        topics.push('rule 14A.45'); // Connected transaction IFA requirements
        
        // Force unique topics
        const uniqueTopics = [...new Set(topics)];
        console.log('Enhanced search topics for IFA query:', uniqueTopics);
      }

      // First check for exact matches in regulatory_faqs table
      const faqResults = await this.searchFAQs(query, topics);
      
      // Then check for matches in guidance materials
      const guidanceResults = await this.searchGuidanceMaterials(query, topics);
      
      // Check for listing decisions
      const listingDecisionResults = await this.searchListingDecisions(query, topics);
      
      // For IFA queries, directly search listing rules requirements
      let listingRulesContext = '';
      if (hasIFAReferences) {
        try {
          // More comprehensive search specifically targeting IFA requirements in different chapters
          const listingRulesResults = await supabase
            .from('regulatory_provisions')
            .select('rule_number, title, content')
            .or(`rule_number.ilike.%14.06%,rule_number.ilike.%14A.44%,rule_number.ilike.%14A.45%,rule_number.ilike.%13.84%,content.ilike.%financial adviser%,content.ilike.%IFA%`)
            .limit(5);
            
          if (listingRulesResults.data && listingRulesResults.data.length > 0) {
            listingRulesContext = "### Relevant Listing Rules\n\n" + 
              listingRulesResults.data.map(rule => 
                `Rule ${rule.rule_number}: ${rule.title || ''}\n${rule.content.substring(0, 300)}${rule.content.length > 300 ? '...' : ''}`
              ).join('\n\n');
              
            // Add explicit answer for IFA requirements in major transactions if that's the query
            if (hasMajorTransactionReferences && hasIFAReferences && 
                query.toLowerCase().includes('required')) {
              listingRulesContext = "### IFA Requirements for Major Transactions\n\n" +
                "Under the HKEX Listing Rules, an Independent Financial Adviser (IFA) is NOT generally required " +
                "for a standard major transaction (Rule 14.06) unless:\n\n" +
                "- The transaction is also a connected transaction (Chapter 14A)\n" +
                "- The Exchange specifically mandates an IFA through a Notice of Compliance\n" +
                "- There are specific conflict-of-interest concerns\n\n" +
                "IFAs are explicitly required for connected transactions (Rules 14A.44-14A.45) and certain " +
                "other types of transactions with potential conflicts of interest.\n\n" + 
                listingRulesContext;
            }
          }
        } catch (e) {
          console.error('Error searching listing rules for IFA requirements:', e);
        }
      }
      
      // If we don't have database results, use Grok's knowledge directly
      if (!faqResults.context && !guidanceResults.context && !listingDecisionResults.context && !listingRulesContext) {
        try {
          console.log('No database results found, using Grok knowledge database');
          const grokResponse = await grokService.getRegulatoryContext(
            `Provide information about: ${query}`,
            { metadata: { useGrokKnowledge: true, topics } }
          );
          
          if (grokResponse) {
            let grokContext = '';
            if (typeof grokResponse === 'string') {
              grokContext = grokResponse;
            } else if (typeof grokResponse === 'object' && grokResponse.context) {
              grokContext = grokResponse.context;
            }
            
            if (grokContext) {
              return {
                guidanceContext: grokContext,
                sourceMaterials: ['Grok Knowledge Database']
              };
            }
          }
        } catch (e) {
          console.error('Error using Grok knowledge database:', e);
        }
      }
      
      // Combine all results
      let combinedContext = '';
      const sourceMaterials: string[] = [];
      
      if (faqResults.context) {
        combinedContext += "### Relevant FAQs\n\n" + faqResults.context + "\n\n";
        sourceMaterials.push(...faqResults.sources);
      }
      
      if (guidanceResults.context) {
        combinedContext += "### Guidance Materials\n\n" + guidanceResults.context + "\n\n";
        sourceMaterials.push(...guidanceResults.sources);
      }
      
      if (listingDecisionResults.context) {
        combinedContext += "### Listing Decisions\n\n" + listingDecisionResults.context + "\n\n";
        sourceMaterials.push(...listingDecisionResults.sources);
      }
      
      if (listingRulesContext) {
        combinedContext += listingRulesContext + "\n\n";
        sourceMaterials.push("Listing Rules Chapter 14");
      }
      
      return {
        guidanceContext: combinedContext || "No specific guidance materials found.",
        sourceMaterials: [...new Set(sourceMaterials)] // Remove duplicates
      };
    } catch (error) {
      console.error('Error in findRelevantGuidance:', error);
      return {
        guidanceContext: "Error retrieving guidance materials.",
        sourceMaterials: []
      };
    }
  },
  
  /**
   * Extract key regulatory topics from a user query using Grok
   */
  async extractTopicsFromQuery(query: string): Promise<string[]> {
    try {
      const prompt = `
      Analyze this Hong Kong financial regulatory query and extract the key regulatory topics, concepts, and rules it relates to.
      Format your response as a JSON array of strings containing ONLY the topic keywords.
      Examples:
      - For "What approvals are needed for connected transactions?", extract: ["connected transactions", "approvals", "chapter 14A", "related party transactions"]
      - For "Explain whitewash waiver requirements", extract: ["whitewash waiver", "takeovers code", "rule 26", "mandatory offer", "exemption"]
      
      Query: ${query}
      `;
      
      const response = await grokService.generateResponse({
        prompt, 
        maxTokens: 500,
        temperature: 0.1
      });
      
      // Try to parse the response as JSON array
      try {
        const text = safelyExtractText(response);
        // Extract array from potential text explanation
        const match = text.match(/\[.*\]/s);
        if (match) {
          const jsonArray = JSON.parse(match[0]);
          return Array.isArray(jsonArray) ? jsonArray : [];
        }
        return [];
      } catch (e) {
        console.error('Failed to parse topics from response:', e);
        // Fallback: extract keywords directly from query
        const keywords = query.toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .split(' ')
          .filter(word => word.length > 3 && !['what', 'when', 'where', 'explain', 'describe', 'about'].includes(word));
        return [...new Set(keywords)];
      }
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  },
  
  /**
   * Search for relevant FAQs based on query and topics
   */
  async searchFAQs(query: string, topics: string[]): Promise<{ context: string; sources: string[] }> {
    try {
      // First try semantic search for better quality matches
      const results = await supabase
        .from('regulatory_faqs')
        .select('question, answer, source_document_id')
        .or(topics.map(topic => `question.ilike.%${topic}%`).join(','))
        .limit(5);
      
      if (results.error) {
        throw results.error;
      }
      
      if (results.data.length === 0) {
        return { context: '', sources: [] };
      }
      
      // Format the FAQs nicely
      const formattedFaqs = results.data.map(faq => 
        `Q: ${faq.question}\nA: ${faq.answer}`
      ).join('\n\n');
      
      return {
        context: formattedFaqs,
        sources: results.data
          .filter(faq => faq.source_document_id)
          .map(faq => `FAQ Document ID: ${faq.source_document_id}`)
      };
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return { context: '', sources: [] };
    }
  },
  
  /**
   * Search for relevant guidance materials based on query and topics
   */
  async searchGuidanceMaterials(query: string, topics: string[]): Promise<{ context: string; sources: string[] }> {
    try {
      // First try to find direct matches in guidance materials
      const results = await supabase
        .from('interpretation_guidance')
        .select('title, content, guidance_number, source_document_id')
        .or(topics.map(topic => `content.ilike.%${topic}%`).join(','))
        .limit(3);
      
      if (results.error) {
        throw results.error;
      }
      
      if (results.data.length === 0) {
        return { context: '', sources: [] };
      }
      
      // Format the guidance materials
      const formattedGuidance = results.data.map(guide => 
        `Guidance ${guide.guidance_number}: ${guide.title}\n${guide.content.substring(0, 300)}${guide.content.length > 300 ? '...' : ''}`
      ).join('\n\n');
      
      return {
        context: formattedGuidance,
        sources: results.data
          .filter(guide => guide.source_document_id)
          .map(guide => `Guidance ${guide.guidance_number} (Document ID: ${guide.source_document_id})`)
      };
    } catch (error) {
      console.error('Error searching guidance materials:', error);
      return { context: '', sources: [] };
    }
  },
  
  /**
   * Search for relevant listing decisions based on query and topics
   */
  async searchListingDecisions(query: string, topics: string[]): Promise<{ context: string; sources: string[] }> {
    try {
      // This would typically query a listing_decisions table
      // For now, simulate with reference_documents that contain listing decisions
      const results = await supabase
        .from('reference_documents')
        .select('title, description, file_path')
        .ilike('category', '%listing decision%')
        .or(topics.map(topic => `title.ilike.%${topic}%`).join(','))
        .limit(3);
      
      if (results.error) {
        throw results.error;
      }
      
      if (results.data.length === 0) {
        return { context: '', sources: [] };
      }
      
      // Format the listing decisions
      const formattedDecisions = results.data.map(decision => 
        `Listing Decision: ${decision.title}\n${decision.description || 'No description available'}`
      ).join('\n\n');
      
      return {
        context: formattedDecisions,
        sources: results.data.map(decision => `Listing Decision: ${decision.title}`)
      };
    } catch (error) {
      console.error('Error searching listing decisions:', error);
      return { context: '', sources: [] };
    }
  }
};

export default mappingSpreadsheetService;
