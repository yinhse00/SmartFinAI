
import { TransactionAnalysisRequest, aiAnalysisService, AnalysisContext } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { fileProcessingService } from '../documents/fileProcessingService';
import { grokService } from '../grokService';
import { parseAnalysisResponse } from './analysisResponseParser';
import { transactionTypeClassifier, TransactionClassification } from './transactionTypeClassifier';
import { typeSpecificPromptBuilder } from './typeSpecificPromptBuilder';
import { OptimizationResult } from './optimizationEngine';

// Import new focused modules
import { inputValidationService, InputValidationResult } from './validation/inputValidationService';
import { analysisQualityService, AnalysisQualityMetrics, AnalysisQualityReport } from './quality/analysisQualityService';
import { marketIntelligenceService } from './optimization/marketIntelligenceService';
import { dataReconciliationService, ReconciliationResult } from './reconciliation/dataReconciliationService';

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  context: AnalysisContext;
  classification: TransactionClassification;
  inputValidation: InputValidationResult;
  optimization: OptimizationResult;
  reconciliation: ReconciliationResult;
  qualityMetrics: AnalysisQualityMetrics;
}

/**
 * Enhanced AI analysis service with transaction type awareness
 */
export const enhancedAiAnalysisService = {
  /**
   * Analyze transaction with type classification and validation
   */
  analyzeTransactionWithValidation: async (request: TransactionAnalysisRequest): Promise<EnhancedAnalysisResult> => {
    try {
      console.log('Starting enhanced transaction analysis with type classification...');
      
      // Step 1: Process documents if provided
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
      
      // Step 2: Classify transaction type
      console.log('Classifying transaction type...');
      const classification = await transactionTypeClassifier.classifyTransaction(
        request.description,
        documentContent
      );
      console.log('Transaction classified as:', classification.type);
      
      // Step 3: Generate type-specific analysis prompt
      const analysisPrompt = typeSpecificPromptBuilder.buildPromptForType(
        classification.type,
        request.description,
        documentContent
      );
      
      // Step 4: Get AI analysis with type-specific prompt
      console.log('Generating AI analysis with type-specific prompt...');
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          transactionType: classification.type,
          hasDocuments: request.documents?.length > 0
        }
      });
      
      // Step 5: Parse response
      let analysisResults = parseAnalysisResponse(response.text);
      
      // Step 6: Add transaction type to results
      analysisResults.transactionType = `${classification.type} - ${classification.subType || 'Standard'}`;
      
      // Step 7: Validate input consistency
      const inputValidation = inputValidationService.validateInputConsistency(request, analysisResults);
      
      // Step 8: Run optimization with type awareness
      const optimization = await marketIntelligenceService.optimizeWithMarketIntelligence(
        analysisResults,
        classification
      );
      
      // Step 9: Reconcile data inconsistencies with type-specific logic
      const reconciliation = dataReconciliationService.reconcileDataInconsistencies(
        request,
        analysisResults,
        classification
      );
      
      // Step 10: Apply reconciliation changes
      if (reconciliation.reconciliationApplied) {
        analysisResults = reconciliation.reconciledResults;
      }
      
      // Step 11: Calculate quality metrics
      const qualityMetrics = analysisQualityService.calculateQualityMetrics(
        analysisResults,
        inputValidation,
        optimization,
        reconciliation
      );
      
      // Step 12: Store analysis context with original description
      const context = aiAnalysisService.storeAnalysisContext(request, analysisResults);
      // originalDescription is now properly included in the context from storeAnalysisContext
      
      console.log('Enhanced analysis completed with type:', classification.type);
      
      return {
        results: analysisResults,
        context,
        classification,
        inputValidation,
        optimization,
        reconciliation,
        qualityMetrics
      };
      
    } catch (error) {
      console.error('Error in enhanced transaction analysis:', error);
      throw new Error('Failed to analyze transaction with enhanced validation. Please try again.');
    }
  },

  /**
   * Get analysis quality report
   */
  getAnalysisQualityReport: (result: EnhancedAnalysisResult): AnalysisQualityReport => {
    return analysisQualityService.generateQualityReport(
      result.qualityMetrics,
      result.inputValidation,
      result.optimization,
      result.reconciliation
    );
  }
};
