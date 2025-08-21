import { CentralBrainService } from '../centralBrainService';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';

export class DocumentAdapter {
  static async generateResponse(
    prompt: string,
    responseType: string,
    regulatoryContext?: string,
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Enhanced prompt with response type
      const enhancedPrompt = `Generate a ${responseType} response for: ${prompt}`;
      
      // Process through central brain
      const response = await CentralBrainService.processDocumentGeneration(enhancedPrompt, {
        preferences,
        feature: metadata.feature || 'document_generation',
        userId: metadata.userId,
        responseType,
        regulatoryContext,
        outputFormat: 'markdown'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate document');
      }

      return response.content;
    } catch (error) {
      console.error('DocumentAdapter error:', error);
      throw error;
    }
  }

  static async searchRegulations(
    query: string,
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Process regulatory search through central brain
      const response = await CentralBrainService.processDatabaseQuery(
        `Search regulations for: ${query}`, 
        {
          preferences,
          feature: metadata.feature || 'regulatory_search',
          userId: metadata.userId
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to search regulations');
      }

      return response.content;
    } catch (error) {
      console.error('DocumentAdapter regulatory search error:', error);
      throw error;
    }
  }
}