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
  error?: any;
}

export interface Step2Result {
  shouldContinue: boolean;
  nextStep: WorkflowStep;
  query: string;
  listingRulesContext?: string;
  regulatoryContext?: string;
  takeoversCodeRelated?: boolean;
  executionRequired?: boolean;
  listingRulesSearchNegative?: boolean;
  skipSequentialSearches: boolean;
  isRegulatoryRelated: boolean;
  error?: any;
}

export interface Step3Result {
  shouldContinue: boolean;
  nextStep: WorkflowStep;
  query: string;
  takeoversCodeContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeSearchNegative?: boolean;
  skipSequentialSearches: boolean;
  isRegulatoryRelated: boolean;
  error?: any;
}

export interface Step4Result {
  shouldContinue: boolean;
  nextStep: 'response' | string;
  query: string;
  executionContext?: string;
  error?: any;
  regulatoryContext?: string;
  processType?: string;
  guidanceContext?: string;
  sourceMaterials?: string[];
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
}
