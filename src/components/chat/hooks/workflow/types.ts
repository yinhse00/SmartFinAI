
import { Message } from '../../ChatMessage';

export type WorkflowStep = 'initial' | 'listingRules' | 'takeoversCode' | 'execution' | 'response';

export interface StepResult {
  shouldContinue?: boolean;
  nextStep?: WorkflowStep;
  completed?: boolean;
  query?: string;
  error?: any;
  [key: string]: any;
}

export interface WorkflowProcessorProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastQuery: React.Dispatch<React.SetStateAction<string>>;
  isGrokApiKeySet: boolean;
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
