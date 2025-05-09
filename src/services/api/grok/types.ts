
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

// New types for the enhanced initial classification
export interface CategoryConfidence {
  category: string;
  confidence: number;  // 0-1 score
  priority: number;    // 1-5 priority level
}

export interface InitialAssessment {
  isRegulatoryRelated: boolean;
  categories: CategoryConfidence[];
  reasoning: string;
  suggestedContextSources?: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  requiresParallelProcessing: boolean;
}
