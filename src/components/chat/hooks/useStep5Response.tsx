
import { executeStep5 } from './workflow/step5Response';

// Define the return types explicitly to match how they're used in useWorkflowProcessor
export interface Step5SuccessResult {
  completed: true;
  response: string;
  metadata?: any;
  requiresTranslation?: boolean;
}

export interface Step5ErrorResult {
  completed: false;
  error: any;
  response: string;
}

export type Step5Result = Step5SuccessResult | Step5ErrorResult;

export const step5Response = async (
  params: any,
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean,
  handleStreamUpdate?: (chunk: string) => void
): Promise<Step5Result> => {
  console.log('useStep5Response: Starting with params:', params);
  
  try {
    // Ensure params are valid before passing to executeStep5
    if (!params) {
      console.error('useStep5Response: Invalid params received');
      return {
        completed: false,
        error: new Error("Invalid parameters"),
        response: "I encountered an error while processing your request due to invalid parameters."
      };
    }
    
    const result = await executeStep5(params, setStepProgress, lastInputWasChinese, handleStreamUpdate);
    
    console.log('useStep5Response: Got result:', result ? 
      `completed: ${result.completed}, response length: ${result.response?.length || 0}` : 'No result');
    
    if (!result) {
      console.error('useStep5Response: No result returned from executeStep5');
      return {
        completed: false,
        error: new Error("No response generated"),
        response: "I couldn't generate a proper response. Please try again."
      };
    }
    
    // Make sure the response is never empty or undefined
    if (!result.response || result.response.trim() === '') {
      console.error('useStep5Response: Empty response in result', result);
      if (result.completed === true) {
        return {
          completed: true,
          response: "I wasn't able to generate a complete response. Please try again.",
          metadata: result.metadata,
          requiresTranslation: result.requiresTranslation
        };
      } else {
        return {
          completed: false,
          error: new Error("Empty response"),
          response: "I wasn't able to generate a complete response. Please try again."
        };
      }
    }
    
    // Return the result with proper typing - explicitly cast based on completed property
    if (result.completed === true) {
      return {
        completed: true,
        response: result.response,
        metadata: result.metadata,
        requiresTranslation: result.requiresTranslation
      };
    } else {
      return {
        completed: false,
        error: result.error || new Error("Unknown error"),
        response: result.response
      };
    }
  } catch (error) {
    console.error('useStep5Response: Error during execution:', error);
    return {
      completed: false,
      error,
      response: "I encountered an error while processing your request. Please try again."
    };
  }
};
