
import { Message } from '../../ChatMessage';

export type WorkflowStep = 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';

export interface StepResult {
  shouldContinue?: boolean;
  nextStep?: WorkflowStep;
  completed?: boolean;
  query?: string;
  error?: any;
  response?: string;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
  [key: string]: any;
}

export interface WorkflowProcessorProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastQuery: React.Dispatch<React.SetStateAction<string>>;
  isGrokApiKeySet: boolean;
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface Step1Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  isRegulatoryRelated: boolean;
  regulatoryContext?: string;
  reasoning?: string;
  isListingRulesRelated?: boolean;
  isTakeoversCodeRelated?: boolean;
  skipSequentialSearches?: boolean;
}

export interface Step2Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  listingRulesContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeRelated?: boolean;
  listingRulesSearchNegative?: boolean;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
}

export interface Step3Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  takeoversCodeContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeSearchNegative?: boolean;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
}

export interface Step4Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  executionContext?: string;
  regulatoryContext?: string;
  skipSequentialSearches?: boolean;
  isRegulatoryRelated?: boolean;
}

export interface Step5Result extends StepResult {
  completed: boolean;
  response?: string;
  metadata?: any;
  requiresTranslation?: boolean;
  error?: any;
}

export interface InitialAssessment {
  isRegulatoryRelated: boolean;
  reasoning: string;
  categories: Array<{
    category: string;
    confidence: number;
  }>;
}
