
import { executeStep5 } from './workflow/step5Response';

export const step5Response = (
  params: any,
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  return executeStep5(params, setStepProgress, lastInputWasChinese);
};
