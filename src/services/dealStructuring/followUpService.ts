import { grokApiService } from '../api/grokApiService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { responseFormatter } from '../response/modules/responseFormatter';

export interface FollowUpContext {
  originalTransactionDescription: string;
  uploadedDocuments?: string[];
  conversationHistory: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
  sessionId?: string;
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
      console.log('Context session ID:', context.sessionId);
      console.log('Conversation history length:', context.conversationHistory.length);

      // Create a unique identifier for this follow-up to prevent cache hits
      const followUpId = `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated unique follow-up ID:', followUpId);

      // Create a specialized prompt for follow-up analysis
      const followUpPrompt = `
You are a Hong Kong financial advisory AI assistant. A user has asked a follow-up question about their transaction analysis.

UNIQUE FOLLOW-UP ID: ${followUpId}
SESSION ID: ${context.sessionId || 'unknown'}
TIMESTAMP: ${new Date().toISOString()}

CURRENT ANALYSIS RESULTS:
${JSON.stringify(currentResults, null, 2)}

ORIGINAL TRANSACTION DESCRIPTION:
${context.originalTransactionDescription}

CONVERSATION HISTORY:
${context.conversationHistory.map((h, index) => `Q${index + 1}: ${h.question}\nA${index + 1}: ${h.response}\nTime: ${h.timestamp.toISOString()}`).join('\n\n')}

USER'S FOLLOW-UP QUESTION:
${followUpQuestion}

INSTRUCTIONS:
1. Analyze the follow-up question to understand what specific aspects need adjustment
2. Make targeted updates to the existing analysis rather than creating a completely new one
3. Only modify the sections that are actually affected by the follow-up question
4. Maintain all existing data that isn't being changed
5. Provide a clear explanation of what was changed and why
6. This is a FRESH analysis - do not use any cached responses
7. Do not use markdown bold formatting (**text**) in your response as it will be converted to HTML

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

      // Call Grok API with cache bypass and unique identifiers
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
          originalQuestion: followUpQuestion,
          followUpId: followUpId,
          sessionId: context.sessionId,
          bypassCache: true, // Explicitly bypass cache for follow-ups
          internalProcessing: false, // Allow caching but with unique ID
          timestamp: Date.now()
        }
      });

      const responseContent = response?.choices?.[0]?.message?.content || '';
      console.log('Raw API response length:', responseContent.length);
      
      // Apply response formatting without bold formatting for deal structuring
      const formattedResponse = responseFormatter.formatResponse(
        responseContent,
        'deal_structuring_followup',
        false, // contextUsed
        1.0, // relevanceScore
        false, // tradingArrangementInfoUsed
        false, // takeoversCodeUsed
        false, // isWhitewashQuery
        false, // hasRefDocuments
        false, // isBackupResponse
        undefined, // originalContext
        true // skipBoldFormatting - KEY CHANGE: Skip bold formatting for deal structuring
      );
      
      // Extract JSON from the formatted response
      const jsonMatch = formattedResponse.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response, falling back to error response');
        throw new Error('Invalid response format from AI');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]) as FollowUpResponse;
      
      // Validate that the response has the required structure
      if (!parsedResponse.updatedResults || !parsedResponse.changedSections || !parsedResponse.explanation) {
        console.error('Incomplete response structure:', parsedResponse);
        throw new Error('Incomplete response from AI');
      }

      console.log('Follow-up processing completed. Changed sections:', parsedResponse.changedSections);
      console.log('Response validation successful');
      
      return parsedResponse;
    } catch (error) {
      console.error('Error processing follow-up question:', error);
      
      // Enhanced fallback response with better error handling
      return {
        updatedResults: currentResults, // Return unchanged results as fallback
        changedSections: [],
        explanation: `I encountered an issue processing your question: "${followUpQuestion}". The original analysis remains unchanged.`,
        assistantMessage: 'I apologize, but I encountered an error processing your question. Please try rephrasing your question or ask about a specific aspect of the analysis. Your original analysis remains unchanged.'
      };
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
   * Create a unique session ID for tracking conversation context
   */
  createSessionId: () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

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
