
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
Provide confidence scores (0-1) for each potential category.
DO NOT answer the query - ONLY classify it.`;
      
      // Call the Grok-3-Beta model for enhanced classification
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
    {"category": "conversational", "confidence": 0.X, "priority": 1-5}
  ],
  "reasoning": "Your reasoning for these classifications",
  "suggestedContextSources": ["listing_rules_chapter_X", "takeovers_code_section_Y"],
  "estimatedComplexity": "simple|moderate|complex",
  "requiresParallelProcessing": boolean
}` 
          }
        ],
        model: 'grok-3-beta',
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
          requiresParallelProcessing: false
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
        requiresParallelProcessing: false
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
            suggestedSources: assessment.suggestedContextSources
          }
        };
        
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
      
      // Add category header for clarity
      const categorySection = `\n\n### ${category.category.toUpperCase()} CONTEXT (Confidence: ${Math.round(category.confidence * 100)}%)\n${categoryContext}`;
      
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
          requiresParallelProcessing: false
        },
        optimizedContext: '',
        contexts: {}
      };
    }
  }
};
