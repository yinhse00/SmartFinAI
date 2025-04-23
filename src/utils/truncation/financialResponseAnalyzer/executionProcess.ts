
/**
 * Checks if an execution process description is complete
 * @param content The content to check
 * @returns Analysis result
 */
export function checkExecutionProcessCompleteness(content: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };

  const lowerContent = content.toLowerCase();
  
  // Check if process has steps or timeline
  const hasSteps = lowerContent.includes('step 1') || 
                  lowerContent.includes('first step') ||
                  lowerContent.includes('phase 1');
                  
  const hasTimeline = lowerContent.includes('timeline') ||
                     lowerContent.includes('timetable') ||
                     lowerContent.includes('schedule');
                     
  // Missing both steps and timeline indicates incomplete content
  if (!hasSteps && !hasTimeline) {
    result.isComplete = false;
    result.missingElements.push('Process steps or timeline');
    result.confidence = 'medium';
  }
  
  // Check for dates in timeline
  if (hasTimeline) {
    const hasDates = /\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi.test(content);
    
    if (!hasDates) {
      result.isComplete = false;
      result.missingElements.push('Timeline dates');
      result.confidence = 'high';
    }
  }
  
  // Check for completion markers
  const hasCompletion = lowerContent.includes('completion') ||
                       lowerContent.includes('final step') ||
                       lowerContent.includes('last step');
                       
  if (!hasCompletion && (hasSteps || hasTimeline)) {
    result.isComplete = false;
    result.missingElements.push('Process completion steps');
    result.confidence = 'medium';
  }
  
  return result;
}

export function isExecutionProcessContent(content: string): boolean {
  const normalizedContent = content.toLowerCase();
  
  return normalizedContent.includes('execution process') ||
         normalizedContent.includes('timeline') ||
         normalizedContent.includes('timetable') ||
         (normalizedContent.includes('process') && 
         (normalizedContent.includes('step') || normalizedContent.includes('phase')));
}
