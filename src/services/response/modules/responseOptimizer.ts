
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
    
    // Low tokens across the board for faster responses
    if (queryType === 'open_offer' || queryType === 'rights_issue') {
      return {
        temperature: 0.05,
        maxTokens: 3000  // Reduced from 12000
      };
    }
    
    if (queryType === 'connected_transaction' || prompt.toLowerCase().includes('connected')) {
      return {
        temperature: 0.1,
        maxTokens: 2000  // Reduced from 9000
      };
    }
    
    if (isSimpleQuery) {
      return {
        temperature: 0.1,
        maxTokens: 1000  // Reduced from 4000
      };
    }
    
    if (prompt.toLowerCase().includes('compare')) {
      return {
        temperature: 0.1,
        maxTokens: 2000  // Reduced from 9000
      };
    }
    
    // Default optimized values
    const baseTemperature = 0.1;  // Always use low temperature
    const baseTokens = 1500;      // Default lower token count
    
    console.log(`Optimized Parameters - Temperature: ${baseTemperature}, Max Tokens: ${baseTokens}`);
    
    return { temperature: baseTemperature, maxTokens: baseTokens };
  },
  
  calculateRelevanceScore: (response: string, prompt: string, queryType: string): number => {
    return evaluateResponseRelevance(response, prompt, queryType);
  }
};
