
import { grokService } from '@/services/grokService';
import { Step4Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { isWellFormattedTimetable, isCompleteExecutionProcess } from '@/services/financial/tradingArrangements';

/**
 * Step 4: Enhanced Execution Process
 * - Focus on getting detailed execution guidance, timetables, and workflows
 * - Enhanced prompts for more detailed and accurate execution information
 * - Preserves table formatting to maintain interface consistency
 */
export const executeStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Analyzing execution process requirements');
  
  try {
    // First, determine the type of process needed
    const query = params.query;
    const isTakeoverRelated = 
      query.toLowerCase().includes('takeover') ||
      query.toLowerCase().includes('general offer') ||
      query.toLowerCase().includes('mandatory offer') ||
      (params.takeoversCodeContext && params.takeoversCodeContext.length > 100);
    
    const isRightsIssueRelated = 
      query.toLowerCase().includes('rights issue') ||
      query.toLowerCase().includes('rights offering');
      
    const isOpenOfferRelated = 
      query.toLowerCase().includes('open offer');
      
    const isConnectedTransactionRelated = 
      query.toLowerCase().includes('connected transaction') ||
      query.toLowerCase().includes('chapter 14a');
      
    // Enhanced process type detection
    const processType = isTakeoverRelated ? 'takeovers_code' : 
                      isRightsIssueRelated ? 'rights_issue' : 
                      isOpenOfferRelated ? 'open_offer' :
                      isConnectedTransactionRelated ? 'connected_transaction' :
                      'generic';
    
    // Build the enhanced execution query with specific instructions
    // to maintain table formats
    const executionQuery = `
Provide a detailed and accurate execution process and timetable for: ${query}

Type of process: ${processType}

Please include:
1. A complete step-by-step timeline for the entire process
2. All key dates and regulatory deadlines
3. Required approvals and documentation
4. Critical path items and dependencies

CRITICAL FORMATTING INSTRUCTIONS:
- Format timetables as markdown tables with | separators
- Use the format: | Timeline | Step | Description |
- Ensure table headers have separator rows (e.g., | --- | --- | --- |)
- For dates, use format: | T-2 | Last day for X | Details... |
- ALL regulatory timetables MUST have proper markdown formatting
- Maintain consistent table structure throughout
- Include explanatory text between table sections
- Tag critical regulatory deadlines with "(Regulatory Requirement)"
${params.guidanceContext ? `\nUSE THE FOLLOWING GUIDANCE MATERIALS TO ENHANCE YOUR RESPONSE:\n${params.guidanceContext}\n` : ''}
`;

    setStepProgress('Generating detailed execution process');
    
    // Call grokService with enhanced prompts for better execution details
    const executionResponse = await grokService.generateResponse({
      prompt: executionQuery,
      regulatoryContext: params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext,
      maxTokens: 3000, // Allow more tokens for detailed timetables
      temperature: 0.2  // Keep temperature low for accurate information
    });
    
    // Use utility function to safely extract text
    const executionContext = safelyExtractText(executionResponse);
    
    setStepProgress('Validating execution process');
    
    // Check if the response is well-formatted and complete
    const isWellFormatted = isWellFormattedTimetable(executionContext);
    const isComplete = isCompleteExecutionProcess(executionContext, processType);
    
    // If the timetable isn't well-formatted or complete, try to enhance it
    // but preserve the original format
    let enhancedContext = executionContext;
    
    if (!isWellFormatted || !isComplete) {
      setStepProgress('Enhancing execution process details');
      
      // Try to enhance it by asking Grok to improve the specific parts
      // that are missing, without changing the format
      const enhancementQuery = `
The following execution process for "${query}" requires enhancement.
${!isWellFormatted ? 'Please improve the table formatting while maintaining the EXACT markdown table structure.' : ''}
${!isComplete ? 'Please add missing key steps and regulatory deadlines while maintaining the EXACT same table structure and format.' : ''}

CURRENT PROCESS:
${executionContext}

IMPORTANT: 
- Keep the EXACT same table structure and markdown format
- Maintain the | Timeline | Step | Description | column format
- Do not change the overall layout or presentation style
- Only enhance the content, dates, and descriptions
- Include more specific regulatory timelines and requirements
- Add critical path dependencies
`;

      const enhancementResponse = await grokService.generateResponse({
        prompt: enhancementQuery,
        maxTokens: 3000,
        temperature: 0.2
      });
      
      const potentialEnhancement = safelyExtractText(enhancementResponse);
      
      // Only use the enhancement if it preserved the table structure and improved the content
      if (potentialEnhancement && 
          potentialEnhancement.includes('|') && 
          potentialEnhancement.split('|').length >= executionContext.split('|').length) {
        enhancedContext = potentialEnhancement;
      }
    }

    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      executionContext: enhancedContext,
      // Preserve existing context if available
      regulatoryContext: params.regulatoryContext || enhancedContext,
      processType,
      guidanceContext: params.guidanceContext,
      sourceMaterials: params.sourceMaterials
    };
  } catch (error) {
    console.error('Error in step 4:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query: params.query,
      error,
      regulatoryContext: params.regulatoryContext
    };
  }
};
