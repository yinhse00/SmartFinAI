
import { orchestrateStep4 } from './utils/step4Orchestrator';
import { Step4Result } from './types';

/**
 * Step 4: Enhanced Execution Process with Business Day Calculations
 * - Focus on getting detailed execution guidance, timetables, and workflows
 * - Enhanced prompts for more detailed and accurate execution information
 * - Preserves table formatting to maintain interface consistency
 * - Uses business day calculations for regulatory compliance
 * 
 * This is now a lightweight orchestrator that delegates to specialized services
 */
export const executeStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  return orchestrateStep4(params, setStepProgress);
};
