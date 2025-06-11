
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { generateDynamicTimetable } from '@/services/financial/dynamicTimetableGenerator';

/**
 * Handler for execution-specific queries with business day calculations
 */
export const handleExecutionQuery = async (
  query: string,
  processType: string,
  params: any
): Promise<string> => {
  console.log('Handling execution query with dynamic timetable generation');
  
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
  
  const executionContext = safelyExtractText(enhancementResponse);
  
  // If enhancement failed, fallback to dynamic timetable
  if (!executionContext || executionContext.length < dynamicTimetable.length * 0.8) {
    return dynamicTimetable;
  }
  
  return executionContext;
};

/**
 * Handler for non-execution queries using traditional enhanced prompts
 */
export const handleTraditionalQuery = async (
  query: string,
  processType: string,
  params: any
): Promise<string> => {
  console.log('Handling traditional query with enhanced prompts');
  
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
  
  return safelyExtractText(executionResponse);
};
