
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
    
    // CRITICAL FIX: Use much higher token limits for financial/regulatory queries
    if (queryType === 'open_offer' || queryType === 'rights_issue') {
      // Specific parameters for timetable queries
      return {
        temperature: 0.1,   // Keep very low for accuracy
        maxTokens: 10000    // Use much higher token limits
      };
    }
    
    // Use simpler parameters for conversational queries
    if (isSimpleQuery) {
      return {
        temperature: 0.3,
        maxTokens: 4000     // Increased from 2000
      };
    }
    
    // Get base temperature setting - use lower values to increase accuracy
    const baseTemperature = getOptimalTemperature(queryType, prompt);
    // Cap at 0.2 to ensure factual accuracy 
    const temperature = Math.min(0.2, baseTemperature);
    
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
