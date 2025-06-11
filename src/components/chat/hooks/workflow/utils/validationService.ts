
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { isWellFormattedTimetable, isCompleteExecutionProcess } from '@/services/financial/tradingArrangements';

/**
 * Service for validating and enhancing execution contexts
 */
export const validateAndEnhanceContext = async (
  executionContext: string,
  query: string,
  processType: string
): Promise<string> => {
  console.log('Validating business day compliance and execution completeness');
  
  // Check if the response is well-formatted and complete
  const isWellFormatted = isWellFormattedTimetable(executionContext);
  const isComplete = isCompleteExecutionProcess(executionContext, processType);
  
  // Additional validation for business day compliance
  const hasBusinessDayMentions = executionContext.toLowerCase().includes('business day') ||
                                executionContext.toLowerCase().includes('trading day') ||
                                executionContext.toLowerCase().includes('hong kong');
  
  // If missing business day compliance or other issues, try to enhance
  if (!isWellFormatted || !isComplete || !hasBusinessDayMentions) {
    console.log('Enhancing business day compliance and regulatory accuracy');
    
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
      return potentialEnhancement;
    }
  }

  return executionContext;
};
