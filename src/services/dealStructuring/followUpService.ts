
import { grokApiService } from '../api/grokApiService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export interface FollowUpContext {
  originalTransactionDescription: string;
  uploadedDocuments?: string[];
  conversationHistory: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
}

export interface FollowUpResponse {
  updatedResults: AnalysisResults;
  changedSections: string[];
  explanation: string;
  assistantMessage: string;
}

export const followUpService = {
  /**
   * Process a follow-up question and update the analysis accordingly
   */
  processFollowUpQuestion: async (
    currentResults: AnalysisResults,
    followUpQuestion: string,
    context: FollowUpContext
  ): Promise<FollowUpResponse> => {
    try {
      console.log('Processing follow-up question:', followUpQuestion);

      // Create a specialized prompt for follow-up analysis
      const followUpPrompt = `
You are a Hong Kong financial advisory AI assistant. A user has asked a follow-up question about their transaction analysis.

CURRENT ANALYSIS RESULTS:
${JSON.stringify(currentResults, null, 2)}

ORIGINAL TRANSACTION DESCRIPTION:
${context.originalTransactionDescription}

CONVERSATION HISTORY:
${context.conversationHistory.map(h => `Q: ${h.question}\nA: ${h.response}`).join('\n\n')}

USER'S FOLLOW-UP QUESTION:
${followUpQuestion}

INSTRUCTIONS:
1. Analyze the follow-up question to understand what specific aspects need adjustment
2. Make targeted updates to the existing analysis rather than creating a completely new one
3. Only modify the sections that are actually affected by the follow-up question
4. Maintain all existing data that isn't being changed
5. Provide a clear explanation of what was changed and why

Please respond with a JSON object in this exact format:
{
  "updatedResults": {
    // Updated AnalysisResults object with the same structure as the current results
    // Only change the fields that need updating based on the follow-up question
  },
  "changedSections": [
    // Array of strings indicating which sections were modified (e.g., "structure", "costs", "timetable", "shareholding", "compliance")
  ],
  "explanation": "Clear explanation of what changes were made and why",
  "assistantMessage": "User-friendly message explaining the updates"
}

Ensure the updatedResults maintains the exact same TypeScript interface structure as the original AnalysisResults.
`;

      // Call Grok API with the specialized prompt
      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: 'You are a Hong Kong financial advisory expert specializing in deal structuring and regulatory compliance.' },
          { role: 'user', content: followUpPrompt }
        ],
        model: 'grok-3-beta',
        temperature: 0.3,
        max_tokens: 15000,
        metadata: {
          processingStage: 'followUp',
          originalQuestion: followUpQuestion
        }
      });

      const responseContent = response?.choices?.[0]?.message?.content || '';
      
      // Extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]) as FollowUpResponse;
      
      // Validate that the response has the required structure
      if (!parsedResponse.updatedResults || !parsedResponse.changedSections || !parsedResponse.explanation) {
        throw new Error('Incomplete response from AI');
      }

      console.log('Follow-up processing completed. Changed sections:', parsedResponse.changedSections);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error processing follow-up question:', error);
      throw new Error('Failed to process follow-up question. Please try again.');
    }
  },

  /**
   * Generate a conversation history entry
   */
  createHistoryEntry: (question: string, response: string) => ({
    question,
    response,
    timestamp: new Date()
  }),

  /**
   * Format changed sections for display
   */
  formatChangedSections: (changedSections: string[]): string => {
    if (changedSections.length === 0) return 'No changes made';
    if (changedSections.length === 1) return `Updated: ${changedSections[0]}`;
    
    const lastSection = changedSections.pop();
    return `Updated: ${changedSections.join(', ')} and ${lastSection}`;
  }
};
