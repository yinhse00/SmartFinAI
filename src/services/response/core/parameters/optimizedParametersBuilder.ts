
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
        maxTokens: 60000   // was 12k/36k, now 5x the previous default
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
        maxTokens: 50000  // was 10k/30k, now 5x base
      };
    }
    
    // For definition queries
    if (prompt.toLowerCase().includes('what is') || 
        prompt.toLowerCase().includes('definition')) {
      return {
        temperature: 0.1,
        maxTokens: 40000 // was 8k/24k, now 5x
      };
    }
    
    // For connected transaction queries
    if (prompt.toLowerCase().includes('connected transaction') || 
        prompt.toLowerCase().includes('connected person')) {
      return {
        temperature: 0.1,
        maxTokens: 45000 // was 9k/27k, now 5x
      };
    }
    
    // For comparison queries
    if (prompt.toLowerCase().includes('compare') ||
        prompt.toLowerCase().includes('difference between') ||
        prompt.toLowerCase().includes('versus') ||
        prompt.toLowerCase().includes(' vs ')) {
      return {
        temperature: 0.1,
        maxTokens: 45000 // was 9k/27k, now 5x
      };
    }
    
    // For simple conversational queries
    if (isSimpleQuery && !hasContext) {
      return {
        temperature: 0.3,
        maxTokens: 20000 // was 4k/12k, now 5x
      };
    }
    
    // Get optimized parameters from service
    const { temperature, maxTokens } = responseOptimizer.getOptimizedParameters(queryType, prompt);
    
    const actualTemperature = hasContext ? 0.1 : temperature;
    const safeMaxTokens = Math.min(40000, Math.max(20000, maxTokens * 5)); // 5x old bounds
    
    return { 
      temperature: actualTemperature, 
      maxTokens: safeMaxTokens 
    };
  }
};
