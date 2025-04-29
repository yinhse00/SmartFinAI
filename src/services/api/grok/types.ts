
// Re-export types from main types file using 'export type'
export type { GrokRequestParams, GrokResponse } from '@/types/grok';

// Define a type for message content that can be either a string or an array of content objects
export type MessageContent = 
  | string 
  | Array<{ 
      type: string; 
      text?: string; 
      image_url?: { 
        url: string 
      } 
    }>;

export interface GrokChatRequestBody {
  messages: {
    role: string;
    content: MessageContent;
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}
