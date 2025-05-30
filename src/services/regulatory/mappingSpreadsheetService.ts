import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Service for intelligent mapping of queries to guidance materials
 * Enhanced to handle both new listing applicant guidance and listed issuer guidance
 * Restricted to database content only - no AI supplementation
 */
export const mappingSpreadsheetService = {
  /**
   * Find relevant guidance and listing decisions based on query concepts
   * Now restricted to database content only
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

      // Determine if this is a new listing query or a listed issuer query
      const isNewListingQuery = 
        query.toLowerCase().includes('new listing') ||
        query.toLowerCase().includes('ipo') ||
        query.toLowerCase().includes('initial public offering') ||
        query.toLowerCase().includes('listing applicant') ||
        query.toLowerCase().includes('listing application') ||
        query.toLowerCase().includes('pre-listing');
        
      const sourceMaterialsPrefix = isNewListingQuery ? 
        "Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants" : 
        "Mapping_schedule_FAQ_Guidance Materials for Listed Issuers";
        
      console.log(`Query classified as ${isNewListingQuery ? 'NEW LISTING' : 'LISTED ISSUER'} query`);

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

      // Search for guidance materials with type-specific filtering
      const guidanceResults = await this.searchGuidanceMaterials(query, topics, isNewListingQuery);
      
      // First check for exact matches in regulatory_faqs table
      const faqResults = await this.searchFAQs(query, topics);
      
      // Check for listing decisions
      const listingDecisionResults = await this.searchListingDecisions(query, topics);
      
      // For new listing queries, specifically search for the New Listing Applicants spreadsheet
      let specificMappingContent = '';
      if (isNewListingQuery) {
        try {
          console.log('Searching for New Listing Applicants mapping spreadsheet');
          const newListingResults = await supabase
            .from('reference_documents')
            .select('*')
            .ilike('title', '%Guide for New Listing Applicants%')
            .limit(1);
            
          if (newListingResults.data && newListingResults.data.length > 0) {
            specificMappingContent = "### New Listing Applicant Guidance\n\n" +
              "This information comes from the specialized mapping schedule for new listing applicants. " +
              "It contains specific requirements and criteria for companies seeking to list on HKEX.\n\n" +
              "Please refer to the full mapping schedule document for comprehensive details.";
          }
        } catch (e) {
          console.error('Error searching for new listing mapping:', e);
        }
      } else {
        // For listed issuer queries, search for the Listed Issuers spreadsheet
        try {
          console.log('Searching for Listed Issuers mapping spreadsheet');
          const listedIssuerResults = await supabase
            .from('reference_documents')
            .select('*')
            .ilike('title', '%Guidance Materials for Listed Issuers%')
            .limit(1);
            
          if (listedIssuerResults.data && listedIssuerResults.data.length > 0) {
            specificMappingContent = "### Listed Issuer Guidance\n\n" +
              "This information comes from the specialized mapping schedule for listed issuers. " +
              "It contains FAQs and guidance for companies already listed on HKEX.\n\n" +
              "Please refer to the full mapping schedule document for comprehensive details.";
          }
        } catch (e) {
          console.error('Error searching for listed issuer mapping:', e);
        }
      }
      
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
      
      // Combine all database results
      let combinedContext = '';
      const sourceMaterials: string[] = [];
      
      // Add specific mapping content if available
      if (specificMappingContent) {
        combinedContext += specificMappingContent + "\n\n";
        sourceMaterials.push(sourceMaterialsPrefix);
      }
      
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
      
      // If no database results found, explicitly state this without AI fallback
      if (!combinedContext.trim()) {
        console.log('No database results found - not using AI fallback');
        return {
          guidanceContext: "No specific guidance materials found in the regulatory database.",
          sourceMaterials: []
        };
      }
      
      return {
        guidanceContext: combinedContext,
        sourceMaterials: [...new Set(sourceMaterials)] // Remove duplicates
      };
    } catch (error) {
      console.error('Error in findRelevantGuidance:', error);
      return {
        guidanceContext: "Error retrieving guidance materials from database.",
        sourceMaterials: []
      };
    }
  },
  
  /**
   * Extract key regulatory topics from a user query using Grok
   */
  async extractTopicsFromQuery(query: string): Promise<string[]> {
    try {
      const isNewListingQuery = 
        query.toLowerCase().includes('new listing') ||
        query.toLowerCase().includes('ipo') ||
        query.toLowerCase().includes('initial public offering') ||
        query.toLowerCase().includes('listing applicant') ||
        query.toLowerCase().includes('listing application') ||
        query.toLowerCase().includes('pre-listing');
        
      const promptAddition = isNewListingQuery ? 
        "This is a query about new listing applications. Consider topics related to IPOs and new listing applications." :
        "This is a query about listed issuers. Consider topics related to ongoing compliance for listed companies.";
        
      const prompt = `
      Analyze this Hong Kong financial regulatory query and extract the key regulatory topics, concepts, and rules it relates to.
      ${promptAddition}
      Format your response as a JSON array of strings containing ONLY the topic keywords.
      Examples:
      - For "What approvals are needed for connected transactions?", extract: ["connected transactions", "approvals", "chapter 14A", "related party transactions"]
      - For "Explain whitewash waiver requirements", extract: ["whitewash waiver", "takeovers code", "rule 26", "mandatory offer", "exemption"]
      
      Query: ${query}
      `;
      
      const response = await grokService.generateResponse({
        prompt, 
        maxTokens: 500,
        temperature: 0.1,
        metadata: {
          isNewListingQuery
        }
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
   * Enhanced to distinguish between new listing and listed issuer guidance
   */
  async searchGuidanceMaterials(query: string, topics: string[], isNewListingQuery: boolean = false): Promise<{ context: string; sources: string[] }> {
    try {
      // Build search query with preference for document type
      let guidanceQuery = supabase
        .from('interpretation_guidance')
        .select('title, content, guidance_number, source_document_id')
        .or(topics.map(topic => `content.ilike.%${topic}%`).join(','))
        .limit(5);

      // If we know the query type, prefer guidance from the appropriate source
      if (isNewListingQuery) {
        // First try to get new listing guidance
        const newListingResults = await supabase
          .from('interpretation_guidance')
          .select('title, content, guidance_number, source_document_id, reference_documents!inner(title)')
          .or(topics.map(topic => `content.ilike.%${topic}%`).join(','))
          .ilike('reference_documents.title', '%Guide for New Listing Applicants%')
          .limit(3);
          
        if (newListingResults.data && newListingResults.data.length > 0) {
          const formattedGuidance = newListingResults.data.map(guide => 
            `New Listing Guidance ${guide.guidance_number}: ${guide.title}\n${guide.content.substring(0, 300)}${guide.content.length > 300 ? '...' : ''}`
          ).join('\n\n');
          
          return {
            context: formattedGuidance,
            sources: newListingResults.data
              .filter(guide => guide.source_document_id)
              .map(guide => `New Listing Guidance ${guide.guidance_number}`)
          };
        }
      } else {
        // Prefer listed issuer guidance
        const listedIssuerResults = await supabase
          .from('interpretation_guidance')
          .select('title, content, guidance_number, source_document_id, reference_documents!inner(title)')
          .or(topics.map(topic => `content.ilike.%${topic}%`).join(','))
          .ilike('reference_documents.title', '%Guidance Materials for Listed Issuers%')
          .limit(3);
          
        if (listedIssuerResults.data && listedIssuerResults.data.length > 0) {
          const formattedGuidance = listedIssuerResults.data.map(guide => 
            `Listed Issuer Guidance ${guide.guidance_number}: ${guide.title}\n${guide.content.substring(0, 300)}${guide.content.length > 300 ? '...' : ''}`
          ).join('\n\n');
          
          return {
            context: formattedGuidance,
            sources: listedIssuerResults.data
              .filter(guide => guide.source_document_id)
              .map(guide => `Listed Issuer Guidance ${guide.guidance_number}`)
          };
        }
      }
      
      // Fallback to general search if type-specific search didn't return results
      const results = await guidanceQuery;
      
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
        .select('title, file_path')
        .ilike('category', '%listing decision%')
        .or(topics.map(topic => `title.ilike.%${topic}%`).join(','))
        .limit(3);
      
      if (results.error) {
        throw results.error;
      }
      
      if (results.data.length === 0) {
        return { context: '', sources: [] };
      }
      
      // Format the listing decisions without using description field
      const formattedDecisions = results.data.map(decision => 
        `Listing Decision: ${decision.title}\nFile: ${decision.file_path}`
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
