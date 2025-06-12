
import { aiAnalysisService, TransactionAnalysisRequest, AnalysisContext } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { dataReconciliationService, ReconciliationResult } from './dataReconciliationService';
import { inputDataExtractor } from './inputDataExtractor';

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  context: AnalysisContext;
  reconciliation: ReconciliationResult;
  inputValidation: {
    extractedData: any;
    confidence: number;
    isValid: boolean;
  };
}

export class EnhancedAiAnalysisService {
  async analyzeTransactionWithValidation(
    request: TransactionAnalysisRequest
  ): Promise<EnhancedAnalysisResult> {
    console.log('Starting enhanced transaction analysis with input validation...');

    // Extract and validate input data first
    const extractedData = inputDataExtractor.extractStructuredData(request);
    const inputValidation = inputDataExtractor.validateExtraction(extractedData);
    
    console.log('Extracted input data:', extractedData);
    console.log('Input validation:', inputValidation);

    // Enhance the request with extracted structured data
    const enhancedRequest: TransactionAnalysisRequest = {
      ...request,
      additionalContext: `${request.additionalContext || ''}\n\nEXTRACTED STRUCTURED DATA:\n${JSON.stringify(extractedData, null, 2)}`
    };

    let analysisResult;
    let retryCount = 0;
    const maxRetries = 2;

    // Retry logic for better AI response handling
    while (retryCount <= maxRetries) {
      try {
        analysisResult = await aiAnalysisService.analyzeTransactionWithContext(enhancedRequest);
        break;
      } catch (error) {
        console.error(`Analysis attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw new Error('Failed to analyze transaction after multiple attempts');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!analysisResult) {
      throw new Error('Analysis failed to complete');
    }

    const { results, context } = analysisResult;

    // Perform data reconciliation
    const reconciliation = dataReconciliationService.reconcileAnalysisWithInput(
      request, 
      results
    );

    console.log('Reconciliation result:', {
      applied: reconciliation.reconciliationApplied,
      confidence: reconciliation.validation.confidence,
      mismatches: reconciliation.validation.mismatches.length
    });

    // Use corrected results if reconciliation was applied
    const finalResults = dataReconciliationService.shouldApplyReconciliation(reconciliation.validation)
      ? reconciliation.correctedResults
      : results;

    return {
      results: finalResults,
      context,
      reconciliation,
      inputValidation: {
        extractedData,
        confidence: inputValidation.confidence,
        isValid: inputValidation.isValid
      }
    };
  }

  getAnalysisQualityReport(analysisResult: EnhancedAnalysisResult): {
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    inputDataQuality: number;
    outputValidation: number;
    reconciliationNeeded: boolean;
    recommendations: string[];
  } {
    const { inputValidation, reconciliation } = analysisResult;
    
    const inputDataQuality = inputValidation.confidence;
    const outputValidation = reconciliation.validation.confidence;
    const reconciliationNeeded = reconciliation.reconciliationApplied;
    
    const averageQuality = (inputDataQuality + outputValidation) / 2;
    
    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageQuality >= 0.9) overallQuality = 'excellent';
    else if (averageQuality >= 0.7) overallQuality = 'good';
    else if (averageQuality >= 0.5) overallQuality = 'fair';
    else overallQuality = 'poor';

    const recommendations: string[] = [];
    
    if (inputDataQuality < 0.7) {
      recommendations.push('Consider providing more specific transaction details in your description');
    }
    
    if (outputValidation < 0.7) {
      recommendations.push('Review the analysis results for accuracy');
    }
    
    if (reconciliationNeeded) {
      recommendations.push('Data reconciliation was applied to align results with input');
    }

    return {
      overallQuality,
      inputDataQuality,
      outputValidation,
      reconciliationNeeded,
      recommendations
    };
  }
}

export const enhancedAiAnalysisService = new EnhancedAiAnalysisService();
