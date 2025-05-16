
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
    // For timetable queries - use extremely high token limits
    const isTimetableQuery = (queryType === 'open_offer' || queryType === 'rights_issue') &&
                           (prompt.toLowerCase().includes('timetable') || 
                            prompt.toLowerCase().includes('schedule'));
    
    if (isTimetableQuery) {
      return {
        temperature: 0.3,
        maxTokens: 60000
      };
    }
    
    // For execution process queries - these are often complex
    const isExecutionProcessQuery = prompt.toLowerCase().includes('execution') || 
                                  prompt.toLowerCase().includes('process') || 
                                  prompt.toLowerCase().includes('timeline') ||
                                  prompt.toLowerCase().includes('working');
    
    if (isExecutionProcessQuery) {
      return {
        temperature: 0.4,
        maxTokens: 50000
      };
    }
    
    // For definition queries
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.5,
        maxTokens: 40000
      };
    }
    
    // For connected transaction queries
    if (prompt.toLowerCase().includes('connected transaction') || 
        prompt.toLowerCase().includes('connected person')) {
      return {
        temperature: 0.4,
        maxTokens: 45000
      };
    }
    
    // For comparison queries
    if (prompt.toLowerCase().includes('compare') ||
        prompt.toLowerCase().includes('difference between') ||
        prompt.toLowerCase().includes('versus') ||
        prompt.toLowerCase().includes('vs')) {
      return {
        temperature: 0.4,
        maxTokens: 45000
      };
    }
    
    // For simple conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.7, // Higher temperature for conversational queries
        maxTokens: 20000
      };
    }
    
    // Get optimized parameters from service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    // Context requires slightly lower temperature for more consistent responses
    const actualTemperature = hasContext ? Math.max(0.4, temperature - 0.1) : temperature;
    
    return { 
      temperature: actualTemperature, 
      maxTokens: maxTokens 
    };
  }
};
