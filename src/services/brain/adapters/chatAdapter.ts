import { CentralBrainService } from '../centralBrainService';
import { Message } from '@/components/chat/ChatMessage';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';

export class ChatAdapter {
  static async processMessage(
    content: string,
    messages: Message[],
    metadata: {
      files?: File[];
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Process through central brain
      const response = await CentralBrainService.processChat(content, {
        preferences,
        files: metadata.files,
        feature: metadata.feature || 'chat',
        userId: metadata.userId,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to process chat message');
      }

      return response.content;
    } catch (error) {
      console.error('ChatAdapter error:', error);
      throw error;
    }
  }

  static async processFileWithMessage(
    content: string,
    files: File[],
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Process through central brain
      const response = await CentralBrainService.processFileAnalysis(content, files, {
        preferences,
        feature: metadata.feature || 'chat_file_processing',
        userId: metadata.userId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to process files');
      }

      return response.content;
    } catch (error) {
      console.error('ChatAdapter file processing error:', error);
      throw error;
    }
  }

  static async processTranslation(
    content: string,
    targetLanguage: string,
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('translation');
      
      // Process through central brain
      const response = await CentralBrainService.processTranslation(
        `Translate to ${targetLanguage}: ${content}`, 
        {
          preferences,
          feature: metadata.feature || 'chat_translation',
          userId: metadata.userId,
          language: targetLanguage
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to process translation');
      }

      return response.content;
    } catch (error) {
      console.error('ChatAdapter translation error:', error);
      throw error;
    }
  }
}