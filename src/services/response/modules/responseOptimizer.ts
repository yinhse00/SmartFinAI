
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
        temperature: 0.7,
        maxTokens: 20000 // Increased from 2,000
      };
    }
    
    // Get base temperature setting
    const temperature = getOptimalTemperature(queryType, prompt);
    
    // Smart token allocation based on query complexity
    const baseTokens = getOptimalTokens(queryType, prompt);
    const maxTokens = prompt.length > 200 ? 
      Math.min(20000000, baseTokens * 10) : // Increased cap from 2M to 20M
      Math.min(10000000, baseTokens); // Increased cap from 1M to 10M
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Simple Query: ${isSimpleQuery}`);
    
    return { temperature, maxTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};

