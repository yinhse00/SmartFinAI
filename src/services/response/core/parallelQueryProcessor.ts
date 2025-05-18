
import { grokApiService } from '../../api/grokApiService';
import { InitialAssessment, CategoryConfidence } from '../../api/grok/types';
import { contextService } from '../../regulatory/contextService';

/**
 * Process regulatory queries in parallel for optimal context retrieval
 */
export const parallelQueryProcessor = {
  /**
   * Process a query for comprehensive context with optimized parameter selection
   */
  processQueryInParallel: async (query: string) => {
    try {
      console.log('Starting parallel query processing');
      
      // Step 1: Initial assessment of query complexity and type
      const systemMessage = `You are an expert in Hong Kong financial regulations. 
Analyze this query to determine the most relevant regulatory areas and complexity.
Classify the query into one or more of these categories: 
- listingRules
- takeoversCode
- securitiesFutures
- openOffer
- rightsIssue
- connectedTransaction
- ipoListing
- financialReporting
- corporateGovernance
- insiderDealing
- marketManipulation
- disclosureOfInterests
- generative (if asking for content generation)
- conversational (if simple greeting or question)

Provide confidence scores (0-1) for each potential category.
DO NOT answer the query - ONLY classify it.`;
      
      // Check if this is a complex query
      const isComplexQuery = 
        query.toLowerCase().includes('rights issue') ||
        query.toLowerCase().includes('timetable') ||
        query.toLowerCase().includes('connected transaction') ||
        query.toLowerCase().includes('takeovers code') ||
        query.length > 200;
      
      // Call the appropriate Grok model based on query complexity
      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Query to classify: ${query}` },
          { role: 'assistant', content: `
I'll classify this query but not answer it.

{
  "categories": [],
  "primaryCategory": "",
  "confidenceScores": {},
  "complexity": 0.0,
  "isRegulatoryQuery": false,
  "reasoning": ""
}` 
          }
        ],
        model: isComplexQuery ? 'grok-3-beta' : 'grok-3-mini',
        temperature: 0.2,
        max_tokens: 1000,
        metadata: {
          internalProcessing: true,
          processingStage: 'assessment'
        }
      });
      
      // Extract assessment from response
      let assessment: InitialAssessment = {
        categories: [],
        reasoning: '',
        isRegulatoryRelated: false,
        estimatedComplexity: 'simple',
        requiresParallelProcessing: false,
        // Initialize other properties with default values
        primaryCategory: '',
        confidenceScores: {} as Record<string, number>,
        complexity: 0,
        isRegulatoryQuery: false
      };
      
      try {
        const content = response?.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0]);
          
          // Map the parsed properties to our assessment object
          assessment = { 
            ...assessment,
            primaryCategory: parsedJson.primaryCategory || '',
            confidenceScores: parsedJson.confidenceScores || {},
            complexity: parsedJson.complexity || 0,
            isRegulatoryQuery: parsedJson.isRegulatoryQuery || false,
            isRegulatoryRelated: parsedJson.isRegulatoryQuery || false,
            reasoning: parsedJson.reasoning || '',
            // Convert numeric complexity to string complexity
            estimatedComplexity: parsedJson.complexity > 0.7 ? 'complex' : 
                               parsedJson.complexity > 0.3 ? 'moderate' : 'simple',
            requiresParallelProcessing: parsedJson.complexity > 0.5,
            categories: parsedJson.categories || []
          };
        }
      } catch (error) {
        console.error('Error parsing assessment:', error);
      }
      
      console.log('Query assessment:', assessment);
      
      // Step 2: Get context from appropriate sources based on assessment
      const contexts: Record<string, string> = {};
      
      if (assessment.isRegulatoryQuery || assessment.complexity > 0.5) {
        // Use full beta model for complex or regulatory queries
        const contextOptions = {
          isPreliminaryAssessment: true,
          metadata: {
            categories: assessment.categories,
            complexity: assessment.complexity,
            model: 'grok-3-beta'
          }
        };
        
        // Get comprehensive context with appropriate model
        const regulatoryContext = await contextService.getRegulatoryContext(query, contextOptions);
        contexts['comprehensive'] = regulatoryContext;
      } else {
        // For simple queries, use mini model
        const simpleContextOptions = {
          isPreliminaryAssessment: true,
          metadata: {
            categories: assessment.categories,
            complexity: assessment.complexity,
            model: 'grok-3-mini'
          }
        };
        
        const basicContext = await contextService.getRegulatoryContext(query, simpleContextOptions);
        contexts['basic'] = basicContext;
      }
      
      console.log('Obtained contexts for categories:', Object.keys(contexts));
      
      // Step 3: Create optimized combined context
      let optimizedContext = contexts['comprehensive'] || contexts['basic'] || '';
      
      if (optimizedContext.length > 20000) {
        console.log('Context is very long, truncating to optimal size');
        optimizedContext = optimizedContext.substring(0, 20000);
      }
      
      console.log('Completed parallel query processing');
      return {
        optimizedContext,
        assessment,
        contexts
      };
    } catch (error) {
      console.error('Error in parallel query processing:', error);
      return {
        optimizedContext: '',
        assessment: {
          categories: [],
          reasoning: 'Error during assessment',
          isRegulatoryRelated: false,
          estimatedComplexity: 'simple',
          requiresParallelProcessing: false,
          primaryCategory: '',
          confidenceScores: {} as Record<string, number>,
          complexity: 0,
          isRegulatoryQuery: false
        },
        contexts: {}
      };
    }
  }
};
