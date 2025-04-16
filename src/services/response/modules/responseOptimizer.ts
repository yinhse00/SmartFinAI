
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
    // Cap at 0.2 to ensure factual accuracy while preventing API connection issues
    const temperature = Math.min(0.2, baseTemperature);
    
    // Smart token allocation based on query complexity
    const baseTokens = getOptimalTokens(queryType, prompt);
    // Ensure token counts are in a safe range that works in all environments
    const maxTokens = prompt.length > 200 ? 
      Math.min(3500, baseTokens) : // Cap at 3500 to prevent API errors in production
      Math.min(3000, baseTokens);
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Simple Query: ${isSimpleQuery}`);
    
    return { temperature, maxTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
