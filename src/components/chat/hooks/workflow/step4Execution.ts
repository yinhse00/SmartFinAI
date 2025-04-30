
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
    // Track which execution documents were found and their contents
    const executionResults = {
      documentsChecklist: '',
      workingPlan: '',
      timetable: ''
    };
    
    let transactionType = '';
    
    // Try to identify transaction type from query or context
    if (params.query.toLowerCase().includes('rights issue')) {
      transactionType = 'rights issue';
    } else if (params.query.toLowerCase().includes('open offer')) {
      transactionType = 'open offer';
    } else if (params.query.toLowerCase().includes('takeover')) {
      transactionType = 'takeover';
    } else if (params.query.toLowerCase().includes('whitewash') || params.query.toLowerCase().includes('waiver')) {
      transactionType = 'whitewash waiver';
    } else if (params.query.toLowerCase().includes('share consolidation')) {
      transactionType = 'share consolidation';
    }
    
    // Step 4.1: Check Documents Checklist
    setStepProgress('Checking document requirements');
    const checklistResponse = await grokService.getRegulatoryContext(
      `Find information in "Documents Checklist.doc" about ${transactionType || params.query} transaction documents`
    );
    
    // Use utility function to safely extract text
    const checklistContext = safelyExtractText(checklistResponse);
    
    if (checklistContext && checklistContext.trim() !== '') {
      executionResults.documentsChecklist = checklistContext;
    }
    
    // Step 4.2: Check Working Plan
    setStepProgress('Retrieving working plan information');
    const workingPlanResponse = await grokService.getRegulatoryContext(
      `Find information in "Working Plan.doc" about ${transactionType || params.query} transaction steps`
    );
    
    // Use utility function to safely extract text
    const workingPlanContext = safelyExtractText(workingPlanResponse);
    
    if (workingPlanContext && workingPlanContext.trim() !== '') {
      executionResults.workingPlan = workingPlanContext;
    }
    
    // Step 4.3: Check Timetable
    setStepProgress('Getting timetable information');
    const timetableResponse = await grokService.getRegulatoryContext(
      `Find information in "Timetable.doc" about ${transactionType || params.query} transaction timeline`
    );
    
    // Use utility function to safely extract text
    const timetableContext = safelyExtractText(timetableResponse);
    
    if (timetableContext && timetableContext.trim() !== '') {
      executionResults.timetable = timetableContext;
    }
    
    // Combine execution guidance sections
    const executionSections = [];
    
    if (executionResults.documentsChecklist) {
      executionSections.push("--- Documents to be Prepared ---\n\n" + executionResults.documentsChecklist);
    }
    
    if (executionResults.workingPlan) {
      executionSections.push("--- Working Plan ---\n\n" + executionResults.workingPlan);
    }
    
    if (executionResults.timetable) {
      executionSections.push("--- Execution Timetable ---\n\n" + executionResults.timetable);
    }
    
    const executionContext = executionSections.join('\n\n');
    
    // Combine execution guidance with any regulatory context
    let combinedContext = '';
    
    if (params.regulatoryContext) {
      combinedContext = params.regulatoryContext + "\n\n--- Execution Guidance ---\n\n" + executionContext;
    } else if (params.listingRulesContext) {
      combinedContext = params.listingRulesContext + "\n\n--- Execution Guidance ---\n\n" + executionContext;
    } else if (params.takeoversCodeContext) {
      combinedContext = params.takeoversCodeContext + "\n\n--- Execution Guidance ---\n\n" + executionContext;
    } else {
      combinedContext = "--- Execution Guidance ---\n\n" + executionContext;
    }
    
    // Go to Step 5 with all context
    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      executionContext: combinedContext,
      regulatoryContext: combinedContext,
      executionResults: executionResults
    };
  } catch (error) {
    console.error('Error in step 4:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response',
      query: params.query,
      error
    };
  }
};
