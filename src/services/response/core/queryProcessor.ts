
import { GrokRequestParams } from '@/types/grok';
import { isSimpleConversationalQuery } from '../../financial/expertiseDetection';
import { detectFinancialExpertiseArea } from '../../financial/expertiseDetection';
import { queryAnalyzer } from '../modules/queryAnalyzer';
import { contextEnhancer } from '../modules/contextEnhancer';

/**
 * Processes and enriches queries with appropriate context
 */
export const queryProcessor = {
  /**
   * Process a query to enhance it with context and determine its characteristics
   */
  processQuery: async (params: GrokRequestParams): Promise<{
    enhancedParams: GrokRequestParams;
    queryType: string;
    isSimpleQuery: boolean;
    isFaqQuery: boolean;
  }> => {
    console.log('Input Query:', params.prompt);
    
    // Determine query characteristics
    const queryType = detectFinancialExpertiseArea(params.prompt);
    const isSimpleQuery = isSimpleConversationalQuery(params.prompt);
    
    // Check if this might be FAQ related
    const isFaqQuery = params.prompt.toLowerCase().includes('faq') || 
                     params.prompt.toLowerCase().includes('continuing obligation') ||
                     params.prompt.match(/\b10\.4\b/);
    
    console.log('Detected Financial Expertise Area:', queryType);
    
    // Enhanced context processing
    let enhancedParams = { ...params };
    
    // Enhance context with rule or chapter specific information
    enhancedParams = await contextEnhancer.enhanceWithRuleContext(enhancedParams);
    
    // Check for special query characteristics
    const isWhitewashQuery = queryAnalyzer.isWhitewashQuery(params.prompt);
    const isTradingArrangement = queryAnalyzer.isTradingArrangement(params.prompt);
    const hasTakeoversCode = queryAnalyzer.hasTakeoversCode(params.regulatoryContext);
    const hasTradeArrangementInfo = queryAnalyzer.hasTradeArrangementInfo(params.regulatoryContext);
    
    // Enhance context with whitewash waiver information if needed
    enhancedParams = await contextEnhancer.enhanceWithWhitewashContext(enhancedParams, isWhitewashQuery);
    
    // Enhance context with trading arrangement documents if needed
    enhancedParams = await contextEnhancer.enhanceWithTradingArrangements(
      enhancedParams, 
      isTradingArrangement, 
      hasTradeArrangementInfo
    );
    
    return {
      enhancedParams,
      queryType,
      isSimpleQuery,
      isFaqQuery
    };
  }
};
