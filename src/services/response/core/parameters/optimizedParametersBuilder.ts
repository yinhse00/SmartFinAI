
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
        temperature: 0.05,
        maxTokens: 36000   // was 12000, now TRIPLED
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
        maxTokens: 30000  // was 10000, now TRIPLED
      };
    }
    
    // For definition queries
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.1,
        maxTokens: 24000 // was 8000
      };
    }
    
    // For connected transaction queries
    if (prompt.toLowerCase().includes('connected transaction') || 
        prompt.toLowerCase().includes('connected person')) {
      return {
        temperature: 0.1,
        maxTokens: 27000 // was 9000
      };
    }
    
    // For comparison queries
    if (prompt.toLowerCase().includes('compare') ||
        prompt.toLowerCase().includes('difference between') ||
        prompt.toLowerCase().includes('versus') ||
        prompt.toLowerCase().includes(' vs ')) {
      return {
        temperature: 0.1,
        maxTokens: 27000 // was 9000
      };
    }
    
    // For simple conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.3,
        maxTokens: 12000 // was 4000
      };
    }
    
    // Get optimized parameters from service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    const actualTemperature = hasContext ? 0.1 : temperature;
    const safeMaxTokens = Math.min(24000, Math.max(12000, maxTokens)); // was [8000, 4000]
    
    return { 
      temperature: actualTemperature, 
      maxTokens: safeMaxTokens 
    };
  }
};
