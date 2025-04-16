
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';

export const responseOptimizer = {
  getOptimizedParameters: (queryType: string, prompt: string) => {
    // Dynamic token allocation based on query complexity
    const isSimpleQuery = prompt.length < 100 && !prompt.includes('?');
    
    // Use simpler parameters for conversational queries
    if (isSimpleQuery) {
      return {
        temperature: 0.3, // Lower temperature to prioritize database facts
        maxTokens: 2000
      };
    }
    
    // Get base temperature setting - use lower values to increase accuracy
    const baseTemperature = getOptimalTemperature(queryType, prompt);
    // Cap at 0.2 to ensure factual accuracy
    const temperature = Math.min(0.2, baseTemperature);
    
    // Smart token allocation based on query complexity and safety limits
    let baseTokens = getOptimalTokens(queryType, prompt);
    
    // Enforce safe token ranges that work in all environments including production
    // Higher values (>4000) can cause API failures in some environments
    const maxTokens = prompt.length > 200 ? 
      Math.min(3800, baseTokens) : // Cap at 3800 for complex queries
      Math.min(2800, baseTokens);  // Cap at 2800 for simple queries
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Simple Query: ${isSimpleQuery}`);
    
    return { temperature, maxTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
