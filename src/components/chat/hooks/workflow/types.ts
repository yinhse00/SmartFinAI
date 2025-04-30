
import { Message } from '../../ChatMessage';

export type WorkflowStep = 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response' | 'complete';

export interface StepResult {
  completed: boolean;
  shouldContinue?: boolean;
  nextStep?: WorkflowStep;
  query?: string;
  context?: string;
  error?: any;
  queryType?: string;
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
  context?: string;
  regulatoryContext?: string;
  reasoning?: string;
  isListingRulesRelated?: boolean;
  isTakeoversCodeRelated?: boolean;
  queryType?: string;
}

export interface Step2Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  context?: string;
  listingRulesContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeRelated?: boolean;
  listingRulesSearchNegative?: boolean;
}

export interface Step3Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  context?: string;
  takeoversCodeContext?: string;
  regulatoryContext?: string;
  executionRequired?: boolean;
  takeoversCodeSearchNegative?: boolean;
}

export interface Step4Result extends StepResult {
  nextStep: WorkflowStep;
  query: string;
  context?: string;
  executionContext?: string;
  regulatoryContext?: string;
}

export interface Step5Result extends StepResult {
  completed: boolean;
  response?: string;
  originalResponse?: string;
  translatedResponse?: string;
  requiresTranslation?: boolean;
  translationError?: any;
  metadata?: any;
  isTruncated?: boolean;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
  isBatchPart?: boolean;
}
