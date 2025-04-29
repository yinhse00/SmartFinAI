
import { grokService } from '@/services/grokService';
import { WorkflowStep } from './types';

/**
 * Step 4: Execution Guidance
 * - Check Documents Checklist, Working Plan, and Timetable
 * - Compile relevant execution information
 */
export const executeStep4 = async (params: any, setStepProgress: (progress: string) => void) => {
  setStepProgress('Retrieving execution guidance documents');
  
  try {
    const executionContexts: string[] = [];
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
    
    // Step 4(a): Check Documents Checklist
    setStepProgress('Checking document requirements');
    const checklistResponse = await grokService.getRegulatoryContext(
      `Find information in "Documents Checklist.doc" about ${transactionType || params.query} transaction documents`
    );
    
    let checklistContext = '';
    
    if (checklistResponse) {
      if (typeof checklistResponse === 'object' && checklistResponse !== null && 'text' in checklistResponse) {
        checklistContext = checklistResponse.text || '';
      } else if (typeof checklistResponse === 'string') {
        checklistContext = checklistResponse;
      }
    }
    
    if (checklistContext && checklistContext.trim() !== '') {
      executionContexts.push("--- Document Requirements ---\n\n" + checklistContext);
    }
    
    // Step 4(b): Check Working Plan
    setStepProgress('Retrieving working plan information');
    const workingPlanResponse = await grokService.getRegulatoryContext(
      `Find information in "Working Plan.doc" about ${transactionType || params.query} transaction steps`
    );
    
    let workingPlanContext = '';
    
    if (workingPlanResponse) {
      if (typeof workingPlanResponse === 'object' && workingPlanResponse !== null && 'text' in workingPlanResponse) {
        workingPlanContext = workingPlanResponse.text || '';
      } else if (typeof workingPlanResponse === 'string') {
        workingPlanContext = workingPlanResponse;
      }
    }
    
    if (workingPlanContext && workingPlanContext.trim() !== '') {
      executionContexts.push("--- Working Plan ---\n\n" + workingPlanContext);
    }
    
    // Step 4(c): Check Timetable
    setStepProgress('Getting timetable information');
    const timetableResponse = await grokService.getRegulatoryContext(
      `Find information in "Timetable.doc" about ${transactionType || params.query} transaction timeline`
    );
    
    let timetableContext = '';
    
    if (timetableResponse) {
      if (typeof timetableResponse === 'object' && timetableResponse !== null && 'text' in timetableResponse) {
        timetableContext = timetableResponse.text || '';
      } else if (typeof timetableResponse === 'string') {
        timetableContext = timetableResponse;
      }
    }
    
    if (timetableContext && timetableContext.trim() !== '') {
      executionContexts.push("--- Transaction Timeline ---\n\n" + timetableContext);
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
    
    return {
      shouldContinue: true,
      nextStep: 'response' as WorkflowStep,
      query: params.query,
      executionContext: combinedContext,
      regulatoryContext: combinedContext
    };
  } catch (error) {
    console.error('Error in step 4:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response' as WorkflowStep, 
      query: params.query,
      error
    };
  }
};
