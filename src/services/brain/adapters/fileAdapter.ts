import { CentralBrainService } from '../centralBrainService';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';

export class FileAdapter {
  static async processFiles(
    files: File[],
    query: string,
    metadata: {
      feature?: string;
      userId?: string;
      extractionType?: 'text' | 'analysis' | 'summary';
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Enhanced prompt based on extraction type
      const extractionPrompt = this.createExtractionPrompt(query, metadata.extractionType);
      
      // Process through central brain
      const response = await CentralBrainService.processFileAnalysis(extractionPrompt, files, {
        preferences,
        feature: metadata.feature || 'file_processing',
        userId: metadata.userId,
        extractionType: metadata.extractionType || 'analysis'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to process files');
      }

      return response.content;
    } catch (error) {
      console.error('FileAdapter error:', error);
      throw error;
    }
  }

  static async analyzeDocument(
    file: File,
    analysisType: 'summary' | 'key_points' | 'compliance' | 'risks',
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(analysisType);
      
      // Process through central brain
      const response = await CentralBrainService.processFileAnalysis(analysisPrompt, [file], {
        preferences,
        feature: metadata.feature || 'document_analysis',
        userId: metadata.userId,
        analysisType
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze document');
      }

      return response.content;
    } catch (error) {
      console.error('FileAdapter document analysis error:', error);
      throw error;
    }
  }

  static async extractContent(
    files: File[],
    contentType: 'text' | 'data' | 'images',
    metadata: {
      feature?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = getFeatureAIPreference('chat');
      
      // Create extraction prompt
      const extractionPrompt = `Extract ${contentType} content from the provided files.`;
      
      // Process through central brain
      const response = await CentralBrainService.processFileAnalysis(extractionPrompt, files, {
        preferences,
        feature: metadata.feature || 'content_extraction',
        userId: metadata.userId,
        contentType
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to extract content');
      }

      return response.content;
    } catch (error) {
      console.error('FileAdapter content extraction error:', error);
      throw error;
    }
  }

  private static createExtractionPrompt(query: string, extractionType?: string): string {
    const basePrompt = `Analyze the provided files and respond to: ${query}`;
    
    switch (extractionType) {
      case 'text':
        return `Extract and return the text content from the files. ${basePrompt}`;
      case 'summary':
        return `Provide a comprehensive summary of the files. ${basePrompt}`;
      case 'analysis':
      default:
        return `Perform a detailed analysis of the files. ${basePrompt}`;
    }
  }

  private static createAnalysisPrompt(analysisType: string): string {
    const prompts = {
      summary: 'Provide a comprehensive summary of this document, highlighting the main points and key information.',
      key_points: 'Extract and list the key points, important facts, and main conclusions from this document.',
      compliance: 'Analyze this document for compliance issues, regulatory requirements, and potential risks.',
      risks: 'Identify and analyze potential risks, concerns, and issues mentioned or implied in this document.'
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.summary;
  }
}