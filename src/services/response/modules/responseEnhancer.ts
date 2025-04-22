
import { GrokResponse } from '@/types/grok';

/**
 * Service to enhance response with metadata
 */
export const responseEnhancer = {
  /**
   * Enhance response with metadata about the search process and sources used
   */
  enhanceResponse: (
    responseText: string, 
    queryType: string, 
    contextUsed: boolean, 
    relevanceScore: number,
    prompt: string
  ): GrokResponse => {
    // Extract details about the sequential search process from response
    const usedListingRules = responseText.toLowerCase().includes('listing rule') || 
                            responseText.toLowerCase().includes('chapter');
    const usedTakeoversCode = responseText.toLowerCase().includes('takeovers code') || 
                             responseText.toLowerCase().includes('takeover code') || 
                             responseText.toLowerCase().includes('rule 26');
    const usedGuidance = responseText.toLowerCase().includes('guidance') || 
                        responseText.toLowerCase().includes('faq') || 
                        responseText.toLowerCase().includes('interpretation');
    
    // Check if response appears to be truncated
    const isTruncated = responseText.includes('[NOTE: Response has been truncated due to token limit');
    
    // Create enhanced response
    return {
      text: responseText,
      queryType,
      metadata: {
        contextUsed,
        relevanceScore,
        sequentialSearchProcess: {
          usedListingRules,
          usedTakeoversCode, 
          usedGuidance
        },
        responseWasTruncated: isTruncated
      }
    };
  },
  
  /**
   * Add information about the sequential search workflow to response
   */
  addWorkflowInfo: (response: GrokResponse): GrokResponse => {
    const searchWorkflowInfo = '\n\nThis response was generated using a sequential search through: ' +
      '(1) Listing Rules, (2) Takeovers Code, and (3) Interpretation and Guidance documents.';
    
    // Only add workflow info if it's not already included
    if (!response.text.includes('sequential search through')) {
      response.text += searchWorkflowInfo;
    }
    
    return response;
  }
};
