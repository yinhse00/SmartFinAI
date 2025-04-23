
import { checkExecutionProcessCompleteness } from './executionProcess';
import { analyzeRightsIssueResponse, evaluateRightsIssueContent } from './rightsIssue';
import { analyzeOpenOfferResponse, evaluateOpenOfferContent } from './openOffer';
import { analyzeTakeoverOfferResponse, evaluateTakeoverOfferContent } from './takeoverOffer';

/**
 * Main entry point for financial response analysis
 * Analyzes specific financial response types for completeness
 */
export function analyzeFinancialResponse(content: string, queryType?: string) {
  // Default result structure
  const result = {
    isComplete: true,
    isPartial: false,
    isTruncated: false,
    missingElements: [] as string[],
    confidence: 'high' as 'high' | 'medium' | 'low'
  };

  // Skip analysis for very short content (likely not truncated)
  if (!content || content.length < 200) {
    return result;
  }

  // Basic truncation checks (obvious markers)
  if (
    content.endsWith('...') ||
    content.endsWith('…') ||
    content.includes('I will continue') ||
    content.includes("I'll continue") ||
    content.includes('to be continued')
  ) {
    result.isComplete = false;
    result.isTruncated = true;
    result.confidence = 'high';
    result.missingElements.push('Complete response');
    return result;
  }

  // Check for unfinished sentences at the end (if content is long enough)
  if (content.length > 500) {
    const lastChars = content.slice(-100).trim();
    const endsWithSentenceTerminator = /[.!?。]$/.test(lastChars);
    
    if (!endsWithSentenceTerminator && lastChars.split(' ').length > 5) {
      result.isComplete = false;
      result.isPartial = true;
      result.missingElements.push('Complete final sentence');
      result.confidence = 'medium';
    }
  }

  // Check for unbalanced elements
  const codeBlocks = (content.match(/```/g) || []).length;
  if (codeBlocks % 2 !== 0) {
    result.isComplete = false;
    result.missingElements.push('Complete code block');
    result.confidence = 'high';
  }

  // Check for table truncation
  if (content.includes('|') && content.includes('|---') && !content.match(/\|\s*$/m)) {
    const tableLines = content.split('\n').filter(line => line.includes('|'));
    if (tableLines.length > 0) {
      const lastLine = tableLines[tableLines.length - 1];
      const expectedColumns = content.split('\n').find(line => line.includes('|---'))?.split('|').length - 1;
      const actualColumns = lastLine.split('|').length - 1;
      
      if (expectedColumns && actualColumns < expectedColumns) {
        result.isComplete = false;
        result.missingElements.push('Complete table');
        result.confidence = 'high';
      }
    }
  }

  // Domain-specific analysis based on query type
  if (queryType) {
    // Normalize query type for comparison
    const normalizedType = queryType.toLowerCase();

    // Execution process/timetable content analysis
    if (isExecutionProcessContent(content)) {
      const hasTimeline = content.includes('timeline') || 
                      content.includes('timetable') || 
                      content.includes('schedule');
      const hasDates = /\b(day \d+|t[\+\-]\d+|\d{1,2}\/\d{1,2}|\w+ \d{1,2})\b/gi.test(content);
      
      if (hasTimeline && !hasDates) {
        result.isComplete = false;
        result.missingElements.push('Execution timeline dates');
        result.confidence = 'high';
      }
    }

    // Rights issue specific analysis
    if (normalizedType.includes('rights_issue') || normalizedType.includes('rights issue')) {
      const rightsIssueAnalysis = evaluateRightsIssueContent(content);
      if (!rightsIssueAnalysis.isComplete) {
        result.isComplete = false;
        result.missingElements.push(...rightsIssueAnalysis.missingElements);
        result.confidence = 'high';
      }
    }

    // Open offer specific analysis
    if (normalizedType.includes('open_offer') || normalizedType.includes('open offer')) {
      const openOfferAnalysis = evaluateOpenOfferContent(content);
      if (!openOfferAnalysis.isComplete) {
        result.isComplete = false;
        result.missingElements.push(...openOfferAnalysis.missingElements);
        result.confidence = 'high';
      }
    }

    // General takeover offer analysis
    if (normalizedType.includes('takeover') || normalizedType.includes('general offer')) {
      const takeoverAnalysis = evaluateTakeoverOfferContent(content);
      if (!takeoverAnalysis.isComplete) {
        result.isComplete = false;
        result.missingElements.push(...takeoverAnalysis.missingElements);
        result.confidence = 'high';
      }
    }
  }

  // Practical check for content that should have a conclusion but doesn't
  if (content.length > 3000 && 
      !content.toLowerCase().includes('conclusion') && 
      !content.toLowerCase().includes('summary') && 
      !content.toLowerCase().includes('in summary')) {
    result.isPartial = true;
    result.missingElements.push('Conclusion section');
    // Only mark as incomplete if we have other issues too
    if (result.missingElements.length > 1) {
      result.isComplete = false;
      result.confidence = 'medium';
    }
  }

  return result;
}

// Helper function to determine if content is related to execution process
function isExecutionProcessContent(content: string): boolean {
  const normalizedContent = content.toLowerCase();
  
  return normalizedContent.includes('execution process') ||
         normalizedContent.includes('timeline') ||
         normalizedContent.includes('timetable') ||
         (normalizedContent.includes('process') && 
         (normalizedContent.includes('step') || normalizedContent.includes('phase')));
}

// Export these helper functions directly from this file
export {
  analyzeRightsIssueResponse,
  evaluateRightsIssueContent,
  analyzeOpenOfferResponse, 
  evaluateOpenOfferContent,
  analyzeTakeoverOfferResponse,
  evaluateTakeoverOfferContent
};
