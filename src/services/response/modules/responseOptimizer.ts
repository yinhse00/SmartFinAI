
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens, needsEnhancedTokenSettings } from '@/components/chat/utils/parameterUtils';

/**
 * Service for optimizing Grok response parameters
 */
export const responseOptimizer = {
  /**
   * Get optimized parameters for the request
   */
  getOptimizedParameters: (queryType: string, prompt: string) => {
    // Dynamic temperature and token settings based on query complexity and our enhanced parameterUtils
    const useFineGrainedSettings = needsEnhancedTokenSettings(queryType, prompt);
    const temperature = useFineGrainedSettings ? 
      getOptimalTemperature(queryType, prompt) :
      determineOptimalTemperature(queryType, prompt);
    
    const maxTokens = useFineGrainedSettings ?
      getOptimalTokens(queryType, prompt) :
      determineOptimalTokens(queryType, prompt);
    
    console.log(`Optimized Parameters - Temperature: ${temperature}, Max Tokens: ${maxTokens}, Using Enhanced Settings: ${useFineGrainedSettings}`);
    
    return { temperature, maxTokens };
  },
  
  /**
   * Calculate relevance score for a response
   */
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
