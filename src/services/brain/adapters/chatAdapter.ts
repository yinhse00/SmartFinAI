import { CentralBrainService } from '../centralBrainService';
import { Message } from '@/components/chat/ChatMessage';

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
      console.log('ChatAdapter: Processing message', { 
        contentLength: content.length, 
        hasFiles: !!metadata.files,
        feature: metadata.feature 
      });

      // Process through unified CentralBrainService - it auto-loads user preferences
      const response = await CentralBrainService.processChat(content, {
        files: metadata.files,
        feature: metadata.feature || 'chat',
        userId: metadata.userId,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
        // preferences will be auto-loaded by CentralBrainService
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
      console.log('ChatAdapter: Processing files with message', { 
        contentLength: content.length, 
        fileCount: files.length,
        feature: metadata.feature 
      });

      // Process through unified CentralBrainService - it auto-loads user preferences
      const response = await CentralBrainService.processFileAnalysis(content, files, {
        feature: metadata.feature || 'file_processing',
        userId: metadata.userId
        // preferences will be auto-loaded by CentralBrainService
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
      console.log('ChatAdapter: Processing translation', { 
        contentLength: content.length, 
        targetLanguage,
        feature: metadata.feature 
      });

      // Process through unified CentralBrainService - it auto-loads user preferences
      const response = await CentralBrainService.processTranslation(
        `Translate to ${targetLanguage}: ${content}`, 
        {
          feature: metadata.feature || 'translation',
          userId: metadata.userId,
          language: targetLanguage
          // preferences will be auto-loaded by CentralBrainService
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