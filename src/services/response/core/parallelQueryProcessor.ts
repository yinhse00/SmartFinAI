import { grokApiService } from '../../api/grokApiService';
import { InitialAssessment, CategoryConfidence } from '../../api/grok/types';
import { contextService } from '../../regulatory/contextService';

/**
 * Service for parallel query processing with enhanced classification
 */
export const parallelQueryProcessor = {
  /**
   * Perform initial query classification to determine processing paths
   */
  classifyQuery: async (query: string): Promise<InitialAssessment> => {
    try {
      console.log('Performing enhanced initial classification for query:', query);
      
      // Create a specialized system message for classification
      const systemMessage = `You are a financial query classification system. 
Your task is to analyze financial regulatory queries and classify them into relevant categories.
Determine if this query is regulatory-related, and if so, which specific areas it concerns.
For listing-related queries, determine whether they relate to new listing applications or listed issuers.
Provide confidence scores (0-1) for each potential category.
DO NOT answer the query - ONLY classify it.`;
      
      // Call the Grok-4-0709 model for enhanced classification
      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Classify this financial query: ${query}
Output ONLY a JSON object with these fields:
{
  "isRegulatoryRelated": boolean,
  "categories": [
    {"category": "listing_rules", "confidence": 0.X, "priority": 1-5},
    {"category": "takeovers_code", "confidence": 0.X, "priority": 1-5},
    {"category": "faq", "confidence": 0.X, "priority": 1-5},
    {"category": "process", "confidence": 0.X, "priority": 1-5},
    {"category": "conversational", "confidence": 0.X, "priority": 1-5},
    {"category": "new_listing", "confidence": 0.X, "priority": 1-5},
    {"category": "listed_issuer", "confidence": 0.X, "priority": 1-5}
  ],
  "reasoning": "Your reasoning for these classifications",
  "suggestedContextSources": ["listing_rules_chapter_X", "takeovers_code_section_Y"],
  "estimatedComplexity": "simple|moderate|complex",
  "requiresParallelProcessing": boolean,
  "isNewListingQuery": boolean
}` 
          }
        ],
        model: 'grok-4-0709',
        temperature: 0.2,
        max_tokens: 1000,
        metadata: {
          processingStage: 'classification',
          isInitialAssessment: true
        }
      });
      
      // Parse the classification response
      const content = response?.choices?.[0]?.message?.content || '';
      let assessment: InitialAssessment;
      
      try {
        // Extract JSON from the response (handling potential text wrapping)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
        assessment = JSON.parse(jsonStr) as InitialAssessment;
        
        // Add isNewListingQuery field if not present
        if (assessment.isNewListingQuery === undefined) {
          const isNewListingQuery = query.toLowerCase().includes('new listing') ||
            query.toLowerCase().includes('ipo') ||
            query.toLowerCase().includes('initial public offering') ||
            query.toLowerCase().includes('listing applicant');
            
          const newListingCategory = assessment.categories.find(c => c.category === 'new_listing');
          const listedIssuerCategory = assessment.categories.find(c => c.category === 'listed_issuer');
          
          if (newListingCategory && listedIssuerCategory) {
            // Compare confidences if both categories exist
            assessment.isNewListingQuery = (newListingCategory.confidence > listedIssuerCategory.confidence);
          } else {
            assessment.isNewListingQuery = isNewListingQuery;
          }
        }
        
      } catch (jsonError) {
        console.error('Error parsing classification JSON:', jsonError);
        // Fallback to basic assessment
        assessment = {
          isRegulatoryRelated: content.toLowerCase().includes('regulation') || 
                               content.toLowerCase().includes('rule') ||
                               content.toLowerCase().includes('code'),
          categories: [
            { category: 'general', confidence: 0.5, priority: 3 }
          ],
          reasoning: 'Failed to parse classification response',
          estimatedComplexity: 'moderate',
          requiresParallelProcessing: false,
          isNewListingQuery: query.toLowerCase().includes('new listing') ||
                            query.toLowerCase().includes('ipo')
        };
      }
      
      console.log('Classification result:', assessment);
      return assessment;
    } catch (error) {
      console.error('Error in query classification:', error);
      // Return a default assessment on error
      return {
        isRegulatoryRelated: true, // Assume regulatory to be safe
        categories: [
          { category: 'general', confidence: 0.5, priority: 3 }
        ],
        reasoning: 'Error in classification process',
        estimatedComplexity: 'moderate',
        requiresParallelProcessing: false,
        isNewListingQuery: false
      };
    }
  },
  
  /**
   * Gather contexts in parallel based on category confidences
   */
  gatherContextsInParallel: async (
    query: string, 
    assessment: InitialAssessment
  ): Promise<Record<string, string>> => {
    console.log('Starting parallel context gathering');
    
    // Skip context gathering for simple conversational queries
    const isConversational = assessment.categories.find(c => 
      c.category === 'conversational' && c.confidence > 0.7);
      
    if (isConversational && assessment.estimatedComplexity === 'simple') {
      console.log('Skipping context gathering for simple conversational query');
      return {};
    }
    
    // Identify high-confidence categories (> 0.5) for parallel processing
    const highConfidenceCategories = assessment.categories
      .filter(c => c.confidence > 0.5)
      .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
    
    // For very simple queries or when parallel processing isn't required, only process top category
    if (!assessment.requiresParallelProcessing || assessment.estimatedComplexity === 'simple') {
      highConfidenceCategories.splice(1); // Keep only the top category
    }
    
    // Process each category in parallel
    const contextPromises = highConfidenceCategories.map(async (category) => {
      try {
        // Set different options based on category
        const options: any = { 
          isPreliminaryAssessment: false,
          metadata: {
            category: category.category,
            confidence: category.confidence,
            processingStage: 'parallel',
            suggestedSources: assessment.suggestedContextSources,
            isNewListingQuery: assessment.isNewListingQuery
          }
        };
        
        // Special handling for new listing versus listed issuer queries
        if (category.category === 'new_listing') {
          options.metadata.searchPattern = 'Guide for New Listing Applicants';
          options.metadata.documentType = 'new_listing_guidance';
        } else if (category.category === 'listed_issuer') {
          options.metadata.searchPattern = 'Guidance Materials for Listed Issuers';
          options.metadata.documentType = 'listed_issuer_guidance';
        }
        
        // For FAQ queries, explicitly look for FAQ content
        if (category.category === 'faq') {
          options.metadata.searchFAQ = true;
          options.metadata.searchPattern = '10.4 FAQ';
        }
        
        // Get context for this specific category
        const result = await contextService.getRegulatoryContext(
          `[CATEGORY:${category.category}] ${query}`, 
          options
        );
        
        let contextContent = '';
        if (typeof result === 'string') {
          contextContent = result;
        } else if (result && typeof result === 'object') {
          contextContent = result.context || result.regulatoryContext || '';
        }
        
        return { category: category.category, context: contextContent };
      } catch (error) {
        console.error(`Error gathering context for ${category.category}:`, error);
        return { category: category.category, context: '' };
      }
    });
    
    // Wait for all context gathering to complete
    const contextResults = await Promise.all(contextPromises);
    
    // Combine contexts into a single record with category keys
    const combinedContexts: Record<string, string> = {};
    contextResults.forEach(result => {
      if (result.context && result.context.trim() !== '') {
        combinedContexts[result.category] = result.context;
      }
    });
    
    console.log('Gathered contexts for categories:', Object.keys(combinedContexts));
    return combinedContexts;
  },
  
  /**
   * Build optimized context for final response generation
   */
  buildOptimizedContext: (
    contexts: Record<string, string>,
    assessment: InitialAssessment
  ): string => {
    // If no contexts were found, return empty string
    if (Object.keys(contexts).length === 0) {
      return '';
    }
    
    // Start with highest priority contexts based on assessment
    const sortedCategories = assessment.categories
      .filter(c => contexts[c.category])
      .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
    
    let combinedContext = '';
    let totalLength = 0;
    const MAX_CONTEXT_LENGTH = 6000; // Prevent token limit issues
    
    // Add contexts in priority order until we hit the max length
    for (const category of sortedCategories) {
      const categoryContext = contexts[category.category];
      if (!categoryContext) continue;
      
      // Add special note for new_listing or listed_issuer categories
      let categoryHeader = `\n\n### ${category.category.toUpperCase()} CONTEXT (Confidence: ${Math.round(category.confidence * 100)}%)`;
      if (category.category === 'new_listing') {
        categoryHeader += '\n(Based on Guide for New Listing Applicants)';
      } else if (category.category === 'listed_issuer') {
        categoryHeader += '\n(Based on Guidance Materials for Listed Issuers)';
      }
      
      const categorySection = `${categoryHeader}\n${categoryContext}`;
      
      // Check if adding this would exceed our max length
      if (totalLength + categorySection.length <= MAX_CONTEXT_LENGTH) {
        combinedContext += categorySection;
        totalLength += categorySection.length;
      } else {
        // If it would exceed, truncate and add a note
        const remainingSpace = MAX_CONTEXT_LENGTH - totalLength;
        if (remainingSpace > 200) { // Only add if we have reasonable space left
          combinedContext += `\n\n### ${category.category.toUpperCase()} CONTEXT (TRUNCATED)\n${categoryContext.substring(0, remainingSpace - 50)}...(truncated for length)`;
        }
        break;
      }
    }
    
    return combinedContext;
  },
  
  /**
   * Master function for parallel query processing
   */
  processQueryInParallel: async (query: string): Promise<{
    assessment: InitialAssessment;
    optimizedContext: string;
    contexts: Record<string, string>;
  }> => {
    try {
      console.log('Starting parallel query processing for:', query);
      
      // Step 1: Classify the query to determine processing strategy
      const assessment = await parallelQueryProcessor.classifyQuery(query);
      
      // Detect whether query relates to new listing or listed issuer
      const isNewListingQuery = assessment.isNewListingQuery || 
        query.toLowerCase().includes('new listing') ||
        query.toLowerCase().includes('ipo') ||
        query.toLowerCase().includes('initial public offering');
        
      // Add specific categories if high confidence but not already present
      if (isNewListingQuery) {
        const hasNewListingCategory = assessment.categories.some(c => c.category === 'new_listing');
        if (!hasNewListingCategory) {
          assessment.categories.push({
            category: 'new_listing',
            confidence: 0.8,
            priority: 2
          });
        }
        
        // Ensure isNewListingQuery is set
        assessment.isNewListingQuery = true;
      } else {
        const hasListedIssuerCategory = assessment.categories.some(c => c.category === 'listed_issuer');
        if (!hasListedIssuerCategory && !isNewListingQuery) {
          assessment.categories.push({
            category: 'listed_issuer',
            confidence: 0.7,
            priority: 2
          });
        }
        
        // Ensure isNewListingQuery is set to false if not a new listing query
        if (assessment.isNewListingQuery === undefined) {
          assessment.isNewListingQuery = false;
        }
      }
      
      // Step 2: Gather contexts in parallel based on the classification
      const contexts = await parallelQueryProcessor.gatherContextsInParallel(query, assessment);
      
      // Step 3: Build optimized context combining the parallel results
      const optimizedContext = parallelQueryProcessor.buildOptimizedContext(contexts, assessment);
      
      return {
        assessment,
        optimizedContext,
        contexts
      };
    } catch (error) {
      console.error('Error in parallel query processing:', error);
      return {
        assessment: {
          isRegulatoryRelated: true,
          categories: [{ category: 'general', confidence: 1, priority: 1 }],
          reasoning: 'Error occurred during parallel processing',
          estimatedComplexity: 'moderate',
          requiresParallelProcessing: false,
          isNewListingQuery: false
        },
        optimizedContext: '',
        contexts: {}
      };
    }
  }
};
