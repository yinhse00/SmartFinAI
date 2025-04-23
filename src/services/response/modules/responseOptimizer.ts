
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';

export const responseOptimizer = {
  getOptimizedParameters: (queryType: string, prompt: string) => {
    // Analyze query complexity more thoroughly
    const isSimpleQuery = prompt.length < 100 && !prompt.includes('?');
    const isComparisonQuery = prompt.toLowerCase().includes('compare') || 
                             prompt.toLowerCase().includes('difference between');
    const isListingQuery = prompt.toLowerCase().includes('listing rule') || 
                          prompt.toLowerCase().includes('chapter');
    const isTakeoversQuery = prompt.toLowerCase().includes('takeovers code') ||
                            prompt.toLowerCase().includes('offer');
    
    // Specialized parameters for query types that often need extensive responses
    if (queryType === 'open_offer' || queryType === 'rights_issue') {
      // Even higher limits for timetable queries
      return {
        temperature: 0.05,   // Very low temperature for predictable formatting
        maxTokens: 12000    // Much higher token limits
      };
    }
    
    // Connected transactions need comprehensive explanations
    if (queryType === 'connected_transaction' || prompt.toLowerCase().includes('connected')) {
      return {
        temperature: 0.1,
        maxTokens: 9000
      };
    }
    
    // Aggregation queries need detailed explanation of rules and calculations
    if (queryType === 'aggregation' || prompt.toLowerCase().includes('rule 7.19a') || 
        prompt.toLowerCase().includes('aggregate')) {
      return {
        temperature: 0.1,
        maxTokens: 9000
      };
    }
    
    // Use simpler parameters for conversational queries
    if (isSimpleQuery) {
      return {
        temperature: 0.3,
        maxTokens: 4000
      };
    }
    
    // Comparison queries need more tokens to cover multiple concepts
    if (isComparisonQuery) {
      return {
        temperature: 0.1,
        maxTokens: 9000
      };
    }
    
    // Specialized parameters for detailed listing rule explanations
    if (isListingQuery) {
      return {
        temperature: 0.1,
        maxTokens: 8000
      };
    }
    
    // Specialized parameters for takeovers code queries
    if (isTakeoversQuery) {
      return {
        temperature: 0.1,
        maxTokens: 8000
      };
    }
    
    // Get base temperature setting - use lower values to increase accuracy
    const baseTemperature = getOptimalTemperature(queryType, prompt);
    // Cap at 0.15 to ensure factual accuracy 
    const temperature = Math.min(0.15, baseTemperature);
    
    // Smart token allocation based on query complexity
    let baseTokens = getOptimalTokens(queryType, prompt);
    
    // Use higher token limits everywhere
    const maxTokens = prompt.length > 200 ? 
      Math.min(8000, baseTokens) : // Cap at 8000 for complex queries
      Math.min(6000, baseTokens);  // Cap at 6000 for simple queries
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Simple Query: ${isSimpleQuery}`);
    
    return { temperature, maxTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
