
export interface GrokChatRequestBody {
  messages: Array<{
    role: string;
    content: string;
  }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  metadata?: any;
}
