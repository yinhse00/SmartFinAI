
import { executeStep4, step4Execution } from './workflow/step4Execution';

// Re-export the function with the correct name
export const step4Execution = async (params: any, setStepProgress: (progress: string) => void) => {
  return await executeStep4(params, setStepProgress);
};
