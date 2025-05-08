
import { grokService } from '@/services/grokService';
import { WorkflowStep } from './types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { supabase } from '@/integrations/supabase/client';

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
    
    // First try to get documents directly from Supabase
    try {
      // Step 4(a): Check Documents Checklist from database
      setStepProgress('Checking document requirements from database');
      
      const { data: checklistDocs } = await supabase
        .from('reference_documents')
        .select('*')
        .or('title.ilike.%Document%Checklist%,file_path.ilike.%Document%Checklist%')
        .limit(1);
        
      if (checklistDocs && checklistDocs.length > 0) {
        // Found Documents Checklist in database, fetch and process it
        const checklistDoc = checklistDocs[0];
        const response = await fetch(checklistDoc.file_url);
        
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], checklistDoc.title || "Documents Checklist.doc", {
            type: "application/msword"
          });
          
          // Use file processing service to extract text
          const processResult = await grokService.extractDocumentText(file);
          if (processResult && processResult.trim()) {
            executionContexts.push("--- Document Requirements (From Database) ---\n\n" + processResult);
            setStepProgress('Successfully loaded document requirements from database');
          }
        }
      }
      
      // Step 4(b): Check Working Plan from database
      setStepProgress('Retrieving working plan information from database');
      
      const { data: workingPlanDocs } = await supabase
        .from('reference_documents')
        .select('*')
        .or('title.ilike.%Working%Plan%,file_path.ilike.%Working%Plan%')
        .limit(1);
        
      if (workingPlanDocs && workingPlanDocs.length > 0) {
        // Found Working Plan in database, fetch and process it
        const workingPlanDoc = workingPlanDocs[0];
        const response = await fetch(workingPlanDoc.file_url);
        
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], workingPlanDoc.title || "Working Plan.doc", {
            type: "application/msword"
          });
          
          // Use file processing service to extract text
          const processResult = await grokService.extractDocumentText(file);
          if (processResult && processResult.trim()) {
            executionContexts.push("--- Working Plan (From Database) ---\n\n" + processResult);
            setStepProgress('Successfully loaded working plan from database');
          }
        }
      }
      
      // Step 4(c): Check Timetable from database
      setStepProgress('Getting timetable information from database');
      
      const { data: timetableDocs } = await supabase
        .from('reference_documents')
        .select('*')
        .or('title.ilike.%Timetable%,file_path.ilike.%Timetable%')
        .limit(1);
        
      if (timetableDocs && timetableDocs.length > 0) {
        // Found Timetable in database, fetch and process it
        const timetableDoc = timetableDocs[0];
        const response = await fetch(timetableDoc.file_url);
        
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], timetableDoc.title || "Timetable.doc", {
            type: "application/msword"
          });
          
          // Use file processing service to extract text
          const processResult = await grokService.extractDocumentText(file);
          if (processResult && processResult.trim()) {
            executionContexts.push("--- Transaction Timeline (From Database) ---\n\n" + processResult);
            setStepProgress('Successfully loaded timetable from database');
          }
        }
      }
    } catch (dbError) {
      console.error('Error accessing documents from database:', dbError);
      setStepProgress('Falling back to regulatory context service for documents');
    }
    
    // If we couldn't get documents from database, fall back to the regulatory context service
    if (executionContexts.length === 0) {
      // Step 4(a): Check Documents Checklist using context service
      setStepProgress('Checking document requirements');
      const checklistResponse = await grokService.getRegulatoryContext(
        `Find information in "Documents Checklist.doc" about ${transactionType || params.query} transaction documents`
      );
      
      // Use utility function to safely extract text
      const checklistContext = safelyExtractText(checklistResponse);
      
      if (checklistContext && checklistContext.trim() !== '') {
        executionContexts.push("--- Document Requirements ---\n\n" + checklistContext);
      }
      
      // Step 4(b): Check Working Plan using context service
      setStepProgress('Retrieving working plan information');
      const workingPlanResponse = await grokService.getRegulatoryContext(
        `Find information in "Working Plan.doc" about ${transactionType || params.query} transaction steps`
      );
      
      // Use utility function to safely extract text
      const workingPlanContext = safelyExtractText(workingPlanResponse);
      
      if (workingPlanContext && workingPlanContext.trim() !== '') {
        executionContexts.push("--- Working Plan ---\n\n" + workingPlanContext);
      }
      
      // Step 4(c): Check Timetable using context service
      setStepProgress('Getting timetable information');
      const timetableResponse = await grokService.getRegulatoryContext(
        `Find information in "Timetable.doc" about ${transactionType || params.query} transaction timeline`
      );
      
      // Use utility function to safely extract text
      const timetableContext = safelyExtractText(timetableResponse);
      
      if (timetableContext && timetableContext.trim() !== '') {
        executionContexts.push("--- Transaction Timeline ---\n\n" + timetableContext);
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
