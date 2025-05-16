
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
        maxTokens: 60000   // Maintaining high token limit
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
        maxTokens: 50000  // Maintaining high token limit
      };
    }
    
    // For definition queries
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.5,
        maxTokens: 40000 // Maintaining high token limit
      };
    }
    
    // For connected transaction queries
    if (prompt.toLowerCase().includes('connected transaction') || 
        prompt.toLowerCase().includes('connected person')) {
      return {
        temperature: 0.4,
        maxTokens: 45000 // Maintaining high token limit
      };
    }
    
    // For comparison queries
    if (prompt.toLowerCase().includes('compare') ||
        prompt.toLowerCase().includes('difference between') ||
        prompt.toLowerCase().includes('versus') ||
        prompt.toLowerCase().includes('vs')) {
      return {
        temperature: 0.4,
        maxTokens: 45000 // Maintaining high token limit
      };
    }
    
    // For simple conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.7, // Higher temperature for conversational queries
        maxTokens: 20000 // Maintaining high token limit
      };
    }
    
    // Get optimized parameters from service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    const actualTemperature = hasContext ? 0.4 : temperature;
    
    return { 
      temperature: actualTemperature, 
      maxTokens: maxTokens 
    };
  }
};
