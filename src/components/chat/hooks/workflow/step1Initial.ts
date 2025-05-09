
import { executeStep1 } from './workflow/step1Initial';

export const step1Initial = (params: {
  query: string;
  storeTranslation: (original: string, translated: string) => void;
  setStepProgress: (progress: string) => void;
  retrieveRegulatoryContext: (queryText: string, isPreliminaryAssessment?: boolean) => Promise<any>;
}) => {
  return executeStep1(params.query, params.storeTranslation, params.setStepProgress, params.retrieveRegulatoryContext);
};
