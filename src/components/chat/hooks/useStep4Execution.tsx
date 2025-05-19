
import { executeStep4 } from './workflow/step4Execution';

// Export the function with the correct name
export const step4Execution = async (params: any, setStepProgress: (progress: string) => void) => {
  return await executeStep4(params, setStepProgress);
};
