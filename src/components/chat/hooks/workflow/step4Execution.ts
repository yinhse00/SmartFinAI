
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
    
    // Use utility function to safely extract text
    const checklistContext = safelyExtractText(checklistResponse);
    
    if (checklistContext && checklistContext.trim() !== '') {
      executionContexts.push("--- Document Requirements ---\n\n" + checklistContext);
    }
    
    // Step 4(b): Check Working Plan
    setStepProgress('Retrieving working plan information');
    const workingPlanResponse = await grokService.getRegulatoryContext(
      `Find information in "Working Plan.doc" about ${transactionType || params.query} transaction steps`
    );
    
    // Use utility function to safely extract text
    const workingPlanContext = safelyExtractText(workingPlanResponse);
    
    if (workingPlanContext && workingPlanContext.trim() !== '') {
      executionContexts.push("--- Working Plan ---\n\n" + workingPlanContext);
    }
    
    // Step 4(c): Check Timetable
    setStepProgress('Getting timetable information');
    const timetableResponse = await grokService.getRegulatoryContext(
      `Find information in "Timetable.doc" about ${transactionType || params.query} transaction timeline`
    );
    
    // Use utility function to safely extract text
    const timetableContext = safelyExtractText(timetableResponse);
    
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
      completed: true,
      shouldContinue: true,
      nextStep: 'response' as WorkflowStep,
      query: params.query,
      executionContext: combinedContext,
      context: combinedContext,
      regulatoryContext: combinedContext
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
