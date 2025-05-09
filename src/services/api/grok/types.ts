
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
  messages: Array<{
    role: string;
    content: MessageContent;
  }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  metadata?: any;
}
