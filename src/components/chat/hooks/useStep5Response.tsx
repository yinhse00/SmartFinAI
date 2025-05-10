
import { executeStep5 } from './workflow/step5Response';

export const step5Response = async (
  params: any,
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  console.log('useStep5Response: Starting with params:', params);
  
  try {
    const result = await executeStep5(params, setStepProgress, lastInputWasChinese);
    console.log('useStep5Response: Got result:', result ? 
      `completed: ${result.completed}, response length: ${result.response?.length || 0}` : 'No result');
    return result;
  } catch (error) {
    console.error('useStep5Response: Error during execution:', error);
    return {
      completed: false,
      error,
      response: "I encountered an error while processing your request."
    };
  }
};

