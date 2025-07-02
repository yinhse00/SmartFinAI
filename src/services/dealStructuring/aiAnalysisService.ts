import { grokService } from '../grokService';
import { fileProcessingService } from '../documents/fileProcessingService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { buildAnalysisPrompt } from './analysisPromptBuilder';
import { parseAnalysisResponse } from './analysisResponseParser';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { aiRegulatoryDiscoveryService } from './aiRegulatoryDiscoveryService';

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
}

/**
 * Service for AI-powered transaction analysis
 */
export const aiAnalysisService = {
  /**
   * Analyze transaction requirements and generate comprehensive advisory with regulatory intelligence
   */
  analyzeTransaction: async (
    request: TransactionAnalysisRequest, 
    userInputs?: ExtractedUserInputs,
    regulatoryContext?: any
  ): Promise<AnalysisResults> => {
    try {
      console.log('Starting AI transaction analysis with regulatory intelligence...');
      
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
      
      // Enhanced prompt building with regulatory context and user inputs
      let analysisPrompt = buildAnalysisPrompt(request.description, documentContent, userInputs);
      
      // Add regulatory context if available
      if (regulatoryContext?.context) {
        const formattedRegulatoryContext = aiRegulatoryDiscoveryService.formatContextForPrompt(regulatoryContext.context);
        if (formattedRegulatoryContext) {
          analysisPrompt = `${analysisPrompt}\n\n${formattedRegulatoryContext}\n\nIMPORTANT: Incorporate the above regulatory provisions, FAQs, and vetting requirements into your analysis. Cite specific rule numbers and requirements where applicable.`;
        }
      }
      
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          hasDocuments: request.documents?.length > 0,
          hasRegulatoryContext: !!regulatoryContext,
          regulatoryProvisions: regulatoryContext?.context?.provisions?.length || 0
        }
      });
      
      const analysisResults = parseAnalysisResponse(response.text, userInputs);
      
      console.log('AI transaction analysis completed with regulatory intelligence');
      return analysisResults;
    } catch (error) {
      console.error('Error in AI transaction analysis:', error);
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
      analysisTimestamp: new Date()
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
