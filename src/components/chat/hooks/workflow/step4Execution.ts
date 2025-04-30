
import { grokService } from '@/services/grokService';
import { WorkflowStep, Step4Result } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 4: Execution Guidance
 * - Check Documents Checklist, Working Plan, and Timetable
 * - Compile relevant execution information
 */
export const executeStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Retrieving execution guidance documents');
  
  try {
    const executionContexts: string[] = [];
    let transactionType = '';
    
    // Enhanced transaction type identification
    const query = params.query.toLowerCase();
    
    // Specific handling for rights issue timetable requests
    if (query.includes('rights issue')) {
      transactionType = 'rights issue';
      
      // Log that we're processing a rights issue query specifically
      console.log('Processing rights issue timetable query');
      
      if (query.includes('timetable') || 
          query.includes('timeline') ||
          query.includes('schedule')) {
            
        console.log('Rights issue timetable workflow triggered');
        
        // Special check for approval-related queries 
        if (query.includes('shareholder approval') || 
            query.includes('shareholders approval') ||
            query.includes('approval')) {
          console.log('Rights issue with shareholder approval detected');
          transactionType = 'rights issue with shareholder approval';
        }
      }
    } else if (query.includes('open offer')) {
      transactionType = 'open offer';
    } else if (query.includes('takeover')) {
      transactionType = 'takeover';
    } else if (query.includes('whitewash') || query.includes('waiver')) {
      transactionType = 'whitewash waiver';
    } else if (query.includes('share consolidation')) {
      transactionType = 'share consolidation';
    }
    
    console.log('Transaction type identified:', transactionType);
    
    // Step 4(a): Check Documents Checklist with enhanced query
    setStepProgress('Checking document requirements');
    
    const checklistQuery = `Find detailed information in "Documents Checklist.doc" about ${transactionType} transaction documents`;
    console.log('Checklist query:', checklistQuery);
    
    const checklistResponse = await grokService.getRegulatoryContext(checklistQuery);
    
    // Use utility function to safely extract text
    const checklistContext = safelyExtractText(checklistResponse);
    
    if (checklistContext && checklistContext.trim() !== '') {
      executionContexts.push("--- Document Requirements ---\n\n" + checklistContext);
      console.log('Documents checklist found');
    } else {
      console.log('No document checklist found');
    }
    
    // Step 4(b): Check Working Plan with enhanced specificity
    setStepProgress('Retrieving working plan information');
    
    const workingPlanQuery = `Find detailed step-by-step information in "Working Plan.doc" about ${transactionType} transaction steps`;
    console.log('Working plan query:', workingPlanQuery);
    
    const workingPlanResponse = await grokService.getRegulatoryContext(workingPlanQuery);
    
    // Use utility function to safely extract text
    const workingPlanContext = safelyExtractText(workingPlanResponse);
    
    if (workingPlanContext && workingPlanContext.trim() !== '') {
      executionContexts.push("--- Working Plan ---\n\n" + workingPlanContext);
      console.log('Working plan found');
    } else {
      console.log('No working plan found');
    }
    
    // Step 4(c): Check Timetable with more specific query
    setStepProgress('Getting timetable information');
    
    const timetableQuery = `Find detailed information in "Timetable.doc" about ${transactionType} transaction timeline and specific dates`;
    console.log('Timetable query:', timetableQuery);
    
    const timetableResponse = await grokService.getRegulatoryContext(timetableQuery);
    
    // Use utility function to safely extract text
    const timetableContext = safelyExtractText(timetableResponse);
    
    if (timetableContext && timetableContext.trim() !== '') {
      executionContexts.push("--- Transaction Timeline ---\n\n" + timetableContext);
      console.log('Timetable found');
    } else {
      console.log('No timetable information found, trying fallback');
      
      // Fallback to trading arrangements reference
      const fallbackQuery = `rights issue timetable with shareholder approval requirements`;
      const fallbackResponse = await grokService.getRegulatoryContext(fallbackQuery);
      const fallbackContext = safelyExtractText(fallbackResponse);
      
      if (fallbackContext && fallbackContext.trim() !== '') {
        executionContexts.push("--- Transaction Timeline (Fallback) ---\n\n" + fallbackContext);
        console.log('Fallback timetable information found');
      } else {
        console.log('No fallback timetable information found either');
      }
    }
    
    // Combine execution guidance with any regulatory context
    let combinedContext = executionContexts.join('\n\n');
    
    if (params.regulatoryContext) {
      combinedContext = params.regulatoryContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
    } else if (params.listingRulesContext) {
      combinedContext = params.listingRulesContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
    } else if (params.takeoversCodeContext) {
      combinedContext = params.takeoversCodeContext + "\n\n--- Execution Guidance ---\n\n" + combinedContext;
    }
    
    // If no specific guidance found but we know it's a rights issue timetable query,
    // add fallback structured timetable information from constants
    if (executionContexts.length === 0 && transactionType.includes('rights issue')) {
      console.log('Adding fallback rights issue timetable template');
      combinedContext += "\n\n--- Standard Rights Issue Timetable ---\n\n" + 
        "# Rights Issue Timetable with Shareholders' Approval\n\n" +
        "## Pre-Announcement Phase\n" +
        "- Preparation of Announcement: 2-3 days\n" +
        "- HKEX Vetting: 2-10 business days\n" +
        "- Publication of Announcement: Day 0\n\n" +
        "## Circular and Approval Phase\n" +
        "- Preparation of Circular: 3-10 days\n" +
        "- HKEX Vetting of Circular: 5-20 business days\n" +
        "- Circular Publication: Day 31\n" +
        "- Shareholders' Meeting/EGM: Day 45-52\n" +
        "- Results Announcement: Same day as meeting\n\n" +
        "## Trading and Execution Phase\n" +
        "- Last Cum-Rights Trading Day: T-2\n" +
        "- Ex-Rights Date: T-1\n" +
        "- Record Date: T\n" +
        "- PAL Dispatch: T+5\n" +
        "- Nil-Paid Rights Trading Start: T+6\n" +
        "- Nil-Paid Rights Trading End: T+10\n" +
        "- Latest Acceptance Date: T+14\n" +
        "- New Shares Listing: T+21\n\n" +
        "Rights issues require shareholders' approval when they would increase issued shares by more than 50% (Rule 7.19A)";
    }
    
    console.log('Execution context preparation complete');
    
    return {
      completed: true,
      shouldContinue: true,
      nextStep: 'response' as WorkflowStep,
      query: params.query,
      executionContext: combinedContext,
      context: combinedContext || '',
      regulatoryContext: combinedContext || ''
    };
  } catch (error) {
    console.error('Error in step 4:', error);
    return { 
      completed: false,
      shouldContinue: true, 
      nextStep: 'response' as WorkflowStep, 
      query: params.query,
      context: params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext || params.initialContext || '',
      error
    };
  }
};
