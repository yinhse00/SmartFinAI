
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';

export const responseOptimizer = {
  getOptimizedParameters: (queryType: string, prompt: string) => {
    // Dynamic temperature and token settings based on query complexity
    // Always use enhanced settings for completeness
    const temperature = getOptimalTemperature(queryType, prompt);
    
    // Massively increased token limits to prevent truncation
    // Base token count multiplied by 4 for all queries to prevent truncation
    const baseTokens = getOptimalTokens(queryType, prompt);
    const maxTokens = Math.min(4000000, baseTokens * 4); // Cap at 4M but ensure very high limits
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Using Enhanced Settings: true`);
    
    return { temperature, maxTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
