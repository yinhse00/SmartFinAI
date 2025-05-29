
import { Step4Result } from '../types';
import { detectProcessType, isExecutionProcessQuery } from './processTypeDetector';
import { handleExecutionQuery, handleTraditionalQuery } from './executionQueryHandler';
import { validateAndEnhanceContext } from './validationService';

/**
 * Main orchestrator for Step 4 execution process
 */
export const orchestrateStep4 = async (
  params: any,
  setStepProgress: (progress: string) => void
): Promise<Step4Result> => {
  setStepProgress('Analyzing execution process requirements with business day calculations');
  
  try {
    // Determine the type of process needed
    const processType = detectProcessType(params.query, params.takeoversCodeContext);
    
    // Check if this is specifically a timetable/execution process query
    const isExecutionQuery = isExecutionProcessQuery(params.query);
    
    setStepProgress('Generating business day compliant execution process');
    
    let executionContext: string;
    
    // Route to appropriate handler based on query type
    if (isExecutionQuery) {
      executionContext = await handleExecutionQuery(params.query, processType, params);
    } else {
      executionContext = await handleTraditionalQuery(params.query, processType, params);
    }
    
    setStepProgress('Validating business day compliance');
    
    // Validate and enhance the context if needed
    const enhancedContext = await validateAndEnhanceContext(executionContext, params.query, processType);

    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      executionContext: enhancedContext,
      regulatoryContext: params.regulatoryContext || enhancedContext,
      processType,
      guidanceContext: params.guidanceContext,
      sourceMaterials: params.sourceMaterials,
      skipSequentialSearches: true,
      isRegulatoryRelated: true
    };
  } catch (error) {
    console.error('Error in step 4 orchestration:', error);
    return { 
      shouldContinue: true, 
      nextStep: 'response', 
      query: params.query,
      error,
      regulatoryContext: params.regulatoryContext,
      skipSequentialSearches: true,
      isRegulatoryRelated: false
    };
  }
};
