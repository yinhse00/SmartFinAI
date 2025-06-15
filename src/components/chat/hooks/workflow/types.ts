
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

// Enhanced interfaces for the intelligent search system
export interface SearchMetadata {
  searchStrategy: string;
  queryAnalysis?: any;
  databaseResultsCount?: number;
  searchTime?: number;
  executionSpecific?: boolean;
  databaseExclusive?: boolean;
}

// Enhanced Step result interfaces with search metadata
export interface Step2Result {
  shouldContinue: boolean;
  nextStep: string;
  query: string;
  listingRulesContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeRelated?: boolean;
  listingRulesSearchNegative?: boolean;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
  error?: any;
  searchMetadata?: SearchMetadata;
}

export interface Step3Result {
  shouldContinue: boolean;
  nextStep: string;
  query: string;
  takeoversCodeContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeSearchNegative?: boolean;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
  error?: any;
  searchMetadata?: SearchMetadata;
}

export interface Step4Result {
  shouldContinue: boolean;
  nextStep: string;
  query: string;
  executionGuidance?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  hasEnhancedGuidance?: boolean;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
  error?: any;
  searchMetadata?: SearchMetadata;
}
