
import { grokService } from '@/services/grokService';
import { Step4Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { isWellFormattedTimetable, isCompleteExecutionProcess } from '@/services/financial/tradingArrangements';
import { generateDynamicTimetable } from '@/services/financial/dynamicTimetableGenerator';
import { addBusinessDays, isBusinessDay } from '@/services/calendar/businessDayCalculator';

/**
 * Step 4: Enhanced Execution Process with Business Day Calculations
 * - Focus on getting detailed execution guidance, timetables, and workflows
 * - Enhanced prompts for more detailed and accurate execution information
 * - Preserves table formatting to maintain interface consistency
 * - Uses business day calculations for regulatory compliance
 */
export const executeStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Analyzing execution process requirements with business day calculations');
  
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
    
    // Check if this is specifically a timetable/execution process query
    const isExecutionQuery = query.toLowerCase().includes('execution') || 
                             query.toLowerCase().includes('timetable') ||
                             query.toLowerCase().includes('timeline') ||
                             query.toLowerCase().includes('schedule') ||
                             query.toLowerCase().includes('process');
    
    setStepProgress('Generating business day compliant execution process');
    
    let executionContext: string;
    
    // If it's an execution/timetable query, use dynamic business day calculation
    if (isExecutionQuery) {
      // Generate dynamic timetable with business day calculations
      const dynamicTimetable = await generateDynamicTimetable(processType);
      
      // Enhance with additional regulatory context if available
      const enhancementQuery = `
Enhance the following business day compliant timetable for: ${query}

CURRENT TIMETABLE (WITH BUSINESS DAY CALCULATIONS):
${dynamicTimetable}

Please enhance this timetable by adding:
1. Regulatory context and rule references
2. Critical path dependencies and potential risks
3. Practical considerations for implementation
4. Specific approval requirements

CRITICAL FORMATTING INSTRUCTIONS:
- MAINTAIN the existing table structure and business day calculations
- ADD regulatory context and references
- Include business day compliance notes
- Preserve all business day calculations and warnings

${params.guidanceContext ? `\nUSE THE FOLLOWING GUIDANCE MATERIALS TO ENHANCE YOUR RESPONSE:\n${params.guidanceContext}\n` : ''}
`;

      const enhancementResponse = await grokService.generateResponse({
        prompt: enhancementQuery,
        regulatoryContext: params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext,
        maxTokens: 3000,
        temperature: 0.2
      });
      
      executionContext = safelyExtractText(enhancementResponse);
      
      // If enhancement failed, fallback to dynamic timetable
      if (!executionContext || executionContext.length < dynamicTimetable.length * 0.8) {
        executionContext = dynamicTimetable;
      }
    } else {
      // For non-execution queries, use traditional enhanced prompts
      const executionQuery = `
Provide a detailed and accurate execution process and timetable for: ${query}

Type of process: ${processType}

Please include:
1. A complete step-by-step timeline for the entire process using BUSINESS DAYS
2. All key dates and regulatory deadlines calculated with Hong Kong business days
3. Required approvals and documentation
4. Critical path items and dependencies

CRITICAL BUSINESS DAY REQUIREMENTS:
- All deadlines MUST be calculated using Hong Kong business days (excludes weekends and public holidays)
- Specify minimum business day requirements per regulatory framework
- Indicate when dates might fall on non-business days
- Format timetables as markdown tables with | separators
- Use the format: | Business Day | Date | Step | Description |
- For dates, use format: | T+2 | [Date] | Last day for X | Details... |
- Include business day compliance warnings where relevant

${params.guidanceContext ? `\nUSE THE FOLLOWING GUIDANCE MATERIALS TO ENHANCE YOUR RESPONSE:\n${params.guidanceContext}\n` : ''}
`;

      const executionResponse = await grokService.generateResponse({
        prompt: executionQuery,
        regulatoryContext: params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext,
        maxTokens: 3000,
        temperature: 0.2
      });
      
      executionContext = safelyExtractText(executionResponse);
    }
    
    setStepProgress('Validating business day compliance');
    
    // Check if the response is well-formatted and complete
    const isWellFormatted = isWellFormattedTimetable(executionContext);
    const isComplete = isCompleteExecutionProcess(executionContext, processType);
    
    // Additional validation for business day compliance
    const hasBusinessDayMentions = executionContext.toLowerCase().includes('business day') ||
                                  executionContext.toLowerCase().includes('trading day') ||
                                  executionContext.toLowerCase().includes('hong kong');
    
    // If missing business day compliance or other issues, try to enhance
    let enhancedContext = executionContext;
    
    if (!isWellFormatted || !isComplete || !hasBusinessDayMentions) {
      setStepProgress('Enhancing business day compliance and regulatory accuracy');
      
      const enhancementQuery = `
The following execution process for "${query}" requires business day compliance enhancement.

CURRENT PROCESS:
${executionContext}

ENHANCEMENT REQUIREMENTS:
${!hasBusinessDayMentions ? '- Add explicit business day calculations and Hong Kong calendar compliance' : ''}
${!isWellFormatted ? '- Improve table formatting while maintaining markdown structure' : ''}
${!isComplete ? '- Add missing regulatory steps and deadlines' : ''}

IMPORTANT: 
- Ensure ALL deadlines use Hong Kong business days (exclude weekends and public holidays)
- Maintain EXACT same table structure and markdown format
- Include business day compliance warnings
- Add minimum business day requirement references
- Specify when dates might be adjusted for non-business days
`;

      const enhancementResponse = await grokService.generateResponse({
        prompt: enhancementQuery,
        maxTokens: 3000,
        temperature: 0.2
      });
      
      const potentialEnhancement = safelyExtractText(enhancementResponse);
      
      // Only use enhancement if it improved business day compliance
      if (potentialEnhancement && 
          potentialEnhancement.includes('|') && 
          (potentialEnhancement.toLowerCase().includes('business day') || 
           potentialEnhancement.toLowerCase().includes('hong kong'))) {
        enhancedContext = potentialEnhancement;
      }
    }

    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      executionContext: enhancedContext,
      regulatoryContext: params.regulatoryContext || enhancedContext,
      processType,
      guidanceContext: params.guidanceContext,
      sourceMaterials: params.sourceMaterials,
      skipSequentialSearches: true,
      isRegulatoryRelated: true
    };
  } catch (error) {
    console.error('Error in step 4:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query: params.query,
      error,
      regulatoryContext: params.regulatoryContext,
      skipSequentialSearches: true,
      isRegulatoryRelated: false
    };
  }
};
