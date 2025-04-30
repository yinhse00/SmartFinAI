
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  metadata?: any; // Add support for metadata
  translatedContent?: string;
  isTranslating?: boolean;
}
