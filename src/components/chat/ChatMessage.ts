
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  metadata?: any;
  translatedContent?: string;
  isTranslating?: boolean;
  references?: string[];
  isUsingFallback?: boolean;
  reasoning?: string;
  queryType?: string;
  isTruncated?: boolean;
  isBatchPart?: boolean;
  isTranslated?: boolean;
  originalContent?: string;
}
