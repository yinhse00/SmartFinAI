
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Enhanced Response Generation
 * - Compile final response from all context including guidance materials
 * - Prioritize practical guidance and listing decisions
 * - Maintain consistent output formatting
 * - Translate to Chinese if original query was Chinese
 * - Support automatic batching for long responses
 */
export const executeStep5 = async (
  params: any, 
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  setStepProgress(lastInputWasChinese ? '正在生成最终回复' : 'Generating final response');
  
  try {
    // Prepare the response parameters with all available context
    const responseContext = params.regulatoryContext || 
                           params.executionContext || 
                           params.listingRulesContext || 
                           params.takeoversCodeContext || '';
    
    // Include guidance context if available
    const guidanceContext = params.guidanceContext || '';
    
    // Validate that we have a query to respond to
    if (!params.query) {
      console.error('executeStep5: Missing query in params', params);
      return { 
        completed: false,
        error: new Error("Missing query parameter"),
        response: "I couldn't process your request because the query was missing."
      };
    }
    
    // Check if the query is likely to need batching
    const isPotentiallyLongResponse = params.query.length > 300 || 
                                     params.query.toLowerCase().includes('timetable') ||
                                     params.query.toLowerCase().includes('rights issue') ||
                                     params.query.toLowerCase().includes('connected transaction') ||
                                     params.query.toLowerCase().includes('时间表') ||
                                     params.query.toLowerCase().includes('供股') ||
                                     params.query.toLowerCase().includes('关连交易');
    
    // Enhanced response instructions to maintain output format but improve content
    const enhancedInstructions = `
IMPORTANT FORMATTING INSTRUCTIONS:
- Maintain CONSISTENT TABLE FORMATTING using | for all tables
- For timetables, use the format: | Timeline | Step | Description |
- For regulatory comparisons, use format: | Rule | Requirement | Details |
- Preserve paragraph structure and formatting
- Use markdown headers (# , ## , ###) for section titles
- Format lists with - or numbers
- Use bold (**text**) for emphasis of important points

CONTENT ENHANCEMENT INSTRUCTIONS:
- Prioritize PRACTICAL guidance over theoretical rules
- Include specific listing decisions and guidance materials when relevant
- For execution processes, ensure COMPLETE timetables with all key dates
- Include specific rule references and regulatory requirements
- Provide comprehensive but concise explanations
- For rule interpretations, include both the rule text AND practical application

RESPONSE STRUCTURE:
1. Begin with a concise summary of the answer
2. Provide relevant rule references and requirements
3. Include practical application and guidance
4. For processes, include complete timetable in markdown table format
5. End with key takeaways or recommendations

${guidanceContext ? 'INCORPORATE THE FOLLOWING GUIDANCE AND LISTING DECISIONS:\n' + guidanceContext : ''}
`;
    
    const responseParams = {
      prompt: isPotentiallyLongResponse 
        ? `${params.query}\n\n${enhancedInstructions}\n\n[NOTE: This query may require multiple parts. Please focus on the most important information first and structure your response to work well with continuation.]` 
        : `${params.query}\n\n${enhancedInstructions}`,
      regulatoryContext: responseContext,
      // Set a modest token limit to encourage batching rather than one huge response
      maxTokens: isPotentiallyLongResponse ? 4000 : undefined,
      temperature: 0.3 // Slightly higher temperature for more natural responses while maintaining accuracy
    };
    
    console.log('Calling grokService with params:', responseParams);
    
    // Generate response using Grok
    const response = await grokService.generateResponse(responseParams);
    
    console.log('Received response from grokService:', response);
    
    // Extract response text safely using our utility
    let responseText = safelyExtractText(response);
    
    console.log('Extracted response text:', responseText ? responseText.substring(0, 100) + '...' : 'No response text');
    
    // If no response text was extracted, provide a fallback
    if (!responseText || responseText.trim() === '') {
      console.error('No response text extracted from grokService response, using fallback');
      responseText = "I'm processing your request. Please wait a moment for the complete response.";
    }
    
    // Check if the response appears truncated or incomplete
    const appearsTruncated = responseText.includes('...') || 
                            responseText.includes('to be continued') ||
                            responseText.includes('in the next part') ||
                            responseText.includes('未完待续') ||
                            responseText.includes('下一部分') ||
                            responseText.length > 3500;
    
    const metadata = {
      ...(response.metadata || {}),
      mayRequireBatching: isPotentiallyLongResponse || appearsTruncated,
      batchSuggestion: appearsTruncated ? (
        lastInputWasChinese 
          ? '此回复似乎不完整。您可以使用"继续"按钮查看更多信息。'
          : "This response appears to be incomplete. Consider using the Continue button to see additional information."
      ) : undefined,
      // Add metadata about guidance materials used
      guidanceMaterialsUsed: Boolean(params.guidanceContext),
      sourceMaterials: params.sourceMaterials || []
    };
    
    // For Chinese input, the translation will be handled by the MessageTranslator hook
    // We just ensure the original response is returned properly
    if (lastInputWasChinese) {
      setStepProgress('准备回复');
      
      return {
        completed: true,
        response: responseText,
        metadata,
        requiresTranslation: true
      };
    }
    
    // Return English response
    return {
      completed: true,
      response: responseText,
      metadata
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error,
      response: "I'm sorry, I encountered an error while processing your request. Please try again."
    };
  }
};
