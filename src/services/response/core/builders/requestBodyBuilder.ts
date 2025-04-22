
/**
 * Build request body with appropriate parameters
 */
export const requestBodyBuilder = {
  build(
    systemMessage: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): any {
    const isRetryAttempt = prompt.includes('[RETRY_ATTEMPT]') || 
                          prompt.includes('[THIS IS A RETRY ATTEMPT');
    
    let enhancedPrompt = this.enhancePrompt(prompt);
    
    const { finalTokens, finalTemperature } = this.getAdjustedParameters(
      maxTokens,
      temperature,
      isRetryAttempt
    );
    
    return {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: enhancedPrompt }
      ],
      model: "grok-3-mini-beta",
      temperature: finalTemperature,
      max_tokens: finalTokens,
    };
  },

  private enhancePrompt(prompt: string): string {
    const isTimelineQuery = (prompt.toLowerCase().includes('open offer') || 
                           prompt.toLowerCase().includes('rights issue')) && 
                          (prompt.toLowerCase().includes('timetable') || 
                           prompt.toLowerCase().includes('schedule'));

    const isExecutionQuery = prompt.toLowerCase().includes('execution') || 
                           prompt.toLowerCase().includes('process') || 
                           prompt.toLowerCase().includes('timeline') ||
                           prompt.toLowerCase().includes('working');

    let enhancedPrompt = prompt;

    if (isTimelineQuery) {
      enhancedPrompt += " Please ensure to include a clear conclusion or summary section at the end of your response that ties everything together. Your response must be complete and well-structured. Please provide a comprehensive response with a clear conclusion section that summarizes all key points.";
    } else {
      enhancedPrompt += " Please provide a complete but concise response covering all key points.";
    }

    if (isExecutionQuery) {
      enhancedPrompt += " Please include all steps in the execution process from preparation through implementation, with appropriate regulatory authority steps and timelines.";
    }

    return enhancedPrompt;
  },

  private getAdjustedParameters(
    maxTokens: number,
    temperature: number,
    isRetryAttempt: boolean
  ): { finalTokens: number, finalTemperature: number } {
    if (isRetryAttempt) {
      console.log("Retry attempt detected: Using enhanced parameters");
      return {
        finalTokens: Math.max(10000, maxTokens),
        finalTemperature: Math.min(0.1, temperature)
      };
    }
    
    return {
      finalTokens: maxTokens,
      finalTemperature: temperature
    };
  }
};
