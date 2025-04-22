
import { responseOptimizer } from '../../modules/responseOptimizer';

/**
 * Get optimized parameters for different query types
 */
export const optimizedParametersBuilder = {
  getParameters(
    queryType: string,
    prompt: string,
    hasContext: boolean,
    isSimpleQuery: boolean = false
  ): { temperature: number, maxTokens: number } {
    // For timetable queries
    const isTimetableQuery = (queryType === 'open_offer' || queryType === 'rights_issue') &&
                           (prompt.toLowerCase().includes('timetable') || 
                            prompt.toLowerCase().includes('schedule'));
    
    // For execution process queries
    const isExecutionProcessQuery = prompt.toLowerCase().includes('execution') || 
                                  prompt.toLowerCase().includes('process') || 
                                  prompt.toLowerCase().includes('timeline') ||
                                  prompt.toLowerCase().includes('working');
    
    if (isTimetableQuery || isExecutionProcessQuery) {
      return {
        temperature: 0.1,
        maxTokens: 10000
      };
    }
    
    // For definition queries
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.1,
        maxTokens: 8000
      };
    }
    
    // For simple conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.3,
        maxTokens: 4000
      };
    }
    
    // Get optimized parameters from service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    const actualTemperature = hasContext ? 0.1 : temperature;
    const safeMaxTokens = Math.min(8000, Math.max(4000, maxTokens));
    
    return { 
      temperature: actualTemperature, 
      maxTokens: safeMaxTokens 
    };
  }
};
