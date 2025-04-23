
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
        temperature: 0.05, // Use extremely low temperature for deterministic timetables
        maxTokens: 12000   // Use very high token limits for timetables
      };
    }
    
    // For execution process queries - these are often complex
    const isExecutionProcessQuery = prompt.toLowerCase().includes('execution') || 
                                  prompt.toLowerCase().includes('process') || 
                                  prompt.toLowerCase().includes('timeline') ||
                                  prompt.toLowerCase().includes('working');
    
    if (isExecutionProcessQuery) {
      return {
        temperature: 0.1,
        maxTokens: 10000
      };
    }
    
    // For definition queries - often need to be comprehensive
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.1,
        maxTokens: 8000
      };
    }
    
    // For connected transaction queries - these need detailed threshold explanations
    if (prompt.toLowerCase().includes('connected transaction') || 
        prompt.toLowerCase().includes('connected person')) {
      return {
        temperature: 0.1,
        maxTokens: 9000
      };
    }
    
    // For comparison queries - these compare multiple concepts
    if (prompt.toLowerCase().includes('compare') ||
        prompt.toLowerCase().includes('difference between') ||
        prompt.toLowerCase().includes('versus') ||
        prompt.toLowerCase().includes(' vs ')) {
      return {
        temperature: 0.1,
        maxTokens: 9000
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
