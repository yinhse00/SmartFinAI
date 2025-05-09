
export type WorkflowStep = 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';

export interface WorkflowProcessorProps {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setLastQuery: React.Dispatch<React.SetStateAction<string>>;
  isGrokApiKeySet: boolean;
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface Step1Result {
  shouldContinue: boolean;
  nextStep: WorkflowStep;
  query: string;
  translatedQuery?: string;
  regulatoryContext?: string;
  reasoning?: string;
  isRegulatoryRelated: boolean;
  isListingRulesRelated: boolean;
  isTakeoversCodeRelated: boolean;
  isProcessRelated: boolean;
  skipSequentialSearches: boolean;
  assessment?: any;
  contexts?: Record<string, any>;
}
