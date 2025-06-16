
import { grokService } from '../grokService';
import { fileProcessingService } from '../documents/fileProcessingService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { buildAnalysisPrompt } from './analysisPromptBuilder'; // Ensured correct import
import { parseAnalysisResponse } from './analysisResponseParser'; // Ensured correct import
// Fallback functions are in analysisFallbackData.ts and used by parseAnalysisResponse

export interface TransactionAnalysisRequest {
  transactionType: string;
  description: string;
  amount?: number;
  currency?: string;
  documents?: File[];
  additionalContext?: string;
}

export interface AnalysisContext {
  originalRequest: TransactionAnalysisRequest;
  analysisTimestamp: Date;
  originalDescription?: string; // Add originalDescription property
  // Potentially add analysisId or version here if needed for context tracking
}

/**
 * Service for AI-powered transaction analysis
 */
export const aiAnalysisService = {
  /**
   * Analyze transaction requirements and generate comprehensive advisory
   */
  analyzeTransaction: async (request: TransactionAnalysisRequest): Promise<AnalysisResults> => {
    try {
      console.log('Starting AI transaction analysis...');
      
      let documentContent = '';
      if (request.documents?.length > 0) {
        console.log(`Processing ${request.documents.length} uploaded documents...`);
        const extractionPromises = request.documents.map(file => 
          fileProcessingService.processFile(file)
        );
        
        const extractions = await Promise.all(extractionPromises);
        documentContent = extractions
          .map(result => `${result.source}:\n${result.content}`)
          .join('\n\n');
      }
      
      const analysisPrompt = buildAnalysisPrompt(request.description, documentContent); // Uses imported function
      
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          hasDocuments: request.documents?.length > 0
        }
      });
      
      const analysisResults = parseAnalysisResponse(response.text); // Uses imported function
      
      console.log('AI transaction analysis completed');
      return analysisResults;
    } catch (error) {
      console.error('Error in AI transaction analysis:', error);
      // Consider re-throwing a more specific error or a user-friendly one
      throw new Error('Failed to analyze transaction. Please try again.');
    }
  },

  /**
   * Store analysis context for follow-up processing
   */
  storeAnalysisContext: (request: TransactionAnalysisRequest, results: AnalysisResults): AnalysisContext => {
    // results parameter is currently unused but kept for potential future use (e.g. storing analysis ID)
    return {
      originalRequest: request,
      analysisTimestamp: new Date(),
      originalDescription: request.description // Store original description
    };
  },

  /**
   * Enhanced analysis method that returns both results and context
   */
  analyzeTransactionWithContext: async (request: TransactionAnalysisRequest): Promise<{
    results: AnalysisResults;
    context: AnalysisContext;
  }> => {
    const results = await aiAnalysisService.analyzeTransaction(request);
    const context = aiAnalysisService.storeAnalysisContext(request, results);
    
    return { results, context };
  }
};

// Helper functions (buildAnalysisPrompt, parseAnalysisResponse, createFallback... functions)
// have been moved to separate modules:
// - analysisPromptBuilder.ts
// - analysisResponseParser.ts
// - analysisFallbackData.ts
