
import { Step1Result } from './types';
import { detectQueryType } from '@/services/financial/expertiseDetection';

export const executeStep1 = async (
  params: {
    query: string;
  },
  setStepProgress: React.Dispatch<React.SetStateAction<string>>
): Promise<Step1Result> => {
  try {
    setStepProgress('Analyzing query intent...');
    
    // Basic query analysis
    const queryType = detectQueryType(params.query);
    const isRegulatoryRelated = true; // Default assumption
    
    // For demonstration purposes, adding simple context
    const context = `Initial analysis for query: "${params.query}"`;
    
    setStepProgress('Initial analysis complete');
    
    return {
      completed: true,
      shouldContinue: true,
      nextStep: 'listingRules',
      query: params.query,
      isRegulatoryRelated,
      context,
      queryType
    };
  } catch (error) {
    console.error('Error in step 1:', error);
    return {
      completed: false,
      shouldContinue: false,
      nextStep: 'initial',
      query: params.query,
      isRegulatoryRelated: false,
      error
    };
  }
};
