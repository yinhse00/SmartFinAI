
import { FRAMEWORK_TERMINOLOGY } from '@/services/constants/financialConstants';

export function checkExecutionProcessCompleteness(content: string, queryType: string) {
  const result = {
    isComplete: true,
    missingElements: [] as string[],
    confidence: 'medium' as 'high' | 'medium' | 'low'
  };

  const normalizedContent = content.toLowerCase();

  if (!normalizedContent.includes('preparation') && !normalizedContent.includes('drafting')) {
    result.isComplete = false;
    result.missingElements.push("Missing preparation phase details");
  }
  if (!normalizedContent.includes('vetting')) {
    result.isComplete = false;
    result.missingElements.push("Missing regulatory vetting details");
  }
  if (!hasTimeframes(normalizedContent)) {
    result.isComplete = false;
    result.missingElements.push("Missing specific timeframes for steps");
  }
  if (['open_offer', 'rights_issue'].includes(queryType)) {
    if (!normalizedContent.includes('hkex') && !normalizedContent.includes('stock exchange')) {
      result.isComplete = false;
      result.missingElements.push("Missing Stock Exchange (HKEX) regulatory authority reference");
    }
    if (!FRAMEWORK_TERMINOLOGY.LISTING_RULES.some(term => normalizedContent.includes(term))) {
      result.isComplete = false;
      result.missingElements.push("Missing Listing Rules framework references");
    }
  }
  if (['takeover_offer', 'takeovers_code'].includes(queryType)) {
    if (!normalizedContent.includes('sfc') && !normalizedContent.includes('securities and futures commission')) {
      result.isComplete = false;
      result.missingElements.push("Missing Securities and Futures Commission (SFC) regulatory authority reference");
    }
    if (!FRAMEWORK_TERMINOLOGY.TAKEOVERS_CODE.some(term => normalizedContent.includes(term))) {
      result.isComplete = false;
      result.missingElements.push("Missing Takeovers Code framework references");
    }
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

function hasTimeframes(content: string): boolean {
  const dayRangeRegex = /\d+\s*-\s*\d+\s*(days|business days)/i;
  const specificDayRegex = /day\s+\d+/i;
  return dayRangeRegex.test(content) || specificDayRegex.test(content);
}
