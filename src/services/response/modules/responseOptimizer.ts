
import { 
  determineOptimalTemperature, 
  determineOptimalTokens,
  evaluateResponseRelevance 
} from '../../financial/optimizationUtils';
import { getOptimalTemperature, getOptimalTokens } from '@/components/chat/utils/parameterUtils';

export const responseOptimizer = {
  getOptimizedParameters: (queryType: string, prompt: string) => {
    // Analyze query complexity
    const isSimpleQuery = prompt.length < 100 && !prompt.includes('?');
    
    // Use enhanced token limits for comprehensive responses
    if (queryType === 'open_offer' || queryType === 'rights_issue') {
      return {
        temperature: 0.3, // More precise temperature for regulatory content
        maxTokens: 30000
      };
    }
    
    if (queryType === 'connected_transaction' || prompt.toLowerCase().includes('connected')) {
      return {
        temperature: 0.4, // Balanced temperature
        maxTokens: 25000
      };
    }
    
    if (isSimpleQuery) {
      return {
        temperature: 0.7, // Higher temperature for more natural responses
        maxTokens: 10000
      };
    }
    
    if (prompt.toLowerCase().includes('compare')) {
      return {
        temperature: 0.4, // Balanced temperature for comparisons
        maxTokens: 20000
      };
    }
    
    // Default optimized values with more balanced parameters
    const baseTemperature = 0.5;  // Balanced temperature
    const baseTokens = 15000;
    
    console.log(`Optimized Parameters - Temperature: ${baseTemperature}, Max Tokens: ${baseTokens}`);
    
    return { temperature: baseTemperature, maxTokens: baseTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
