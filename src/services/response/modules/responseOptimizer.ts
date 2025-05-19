import { analyzeFinancialResponse } from '@/utils/truncation/financialResponseAnalyzer';
import { mappingValidationService } from '../../regulatory/mappingValidationService';

/**
 * Optimizes and enhances responses with verification against mapping guides
 */
export const responseOptimizer = {
  /**
   * Calculate relevance score based on query and response
   */
  calculateRelevanceScore: (query: string, response: string): number => {
    // Simple relevance calculation based on keywords
    const queryKeywords = query.toLowerCase().split(/\s+/);
    const uniqueKeywords = [...new Set(queryKeywords)].filter(word => word.length > 3);
    
    // Calculate how many keywords from the query appear in the response
    const matchedKeywords = uniqueKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    // Calculate relevance score (0 to 1)
    return uniqueKeywords.length > 0 ? 
      Math.min(1, matchedKeywords.length / uniqueKeywords.length) : 0.5;
  },
  
  /**
   * Get optimized parameters based on query type and prompt content
   */
  getOptimizedParameters: (
    queryType: string,
    prompt: string
  ): { temperature: number; maxTokens: number } => {
    // Default parameters
    let temperature = 0.5;
    let maxTokens = 40000;
    
    // Adjust based on query type
    switch (queryType) {
      case 'listing_rules':
        temperature = 0.4;
        maxTokens = 45000;
        break;
      case 'takeovers':
        temperature = 0.4;
        maxTokens = 45000;
        break;
      case 'open_offer':
      case 'rights_issue':
        temperature = 0.35;
        maxTokens = 50000;
        break;
      case 'connected_transaction':
        temperature = 0.4;
        maxTokens = 45000;
        break;
      case 'new_listing':
        temperature = 0.3; // Lower temperature for more accuracy on new listings
        maxTokens = 45000;
        break;
      default:
        // Use defaults
    }
    
    // Further adjust based on prompt complexity
    if (prompt.length > 200) {
      // For complex queries, increase tokens but keep temperature controlled
      maxTokens = Math.min(60000, maxTokens * 1.2);
    }
    
    return { temperature, maxTokens };
  },
  
  /**
   * Enhance response with metadata about completeness and relevance
   */
  enhanceResponseWithMetadata: async (
    response: string,
    query: string,
    queryType: string
  ): Promise<{ 
    enhancedResponse: string;
    metadata: {
      relevanceScore: number;
      completenessScore: number;
      isVerified: boolean;
      verificationConfidence?: number;
      correctionsMade?: boolean;
    };
  }> => {
    let enhancedResponse = response;
    
    // Calculate relevance score
    const relevanceScore = responseOptimizer.calculateRelevanceScore(query, response);
    
    // Check if response is complete based on query type
    const completenessAnalysis = analyzeFinancialResponse(response, queryType);
    const completenessScore = completenessAnalysis.isComplete ? 1 : 0.5;
    
    // Detect if this is related to new listing applicants
    const isNewListingQuery = 
      query.toLowerCase().includes('new listing') ||
      query.toLowerCase().includes('ipo') ||
      query.toLowerCase().includes('initial public offering') ||
      query.toLowerCase().includes('listing applicant');
    
    // Only verify responses for new listing queries
    if (isNewListingQuery) {
      console.log('Verifying new listing response against mapping guide');
      
      // Verify the response against the mapping guide
      const validationResult = await mappingValidationService.validateAgainstListingGuidance(
        response,
        query
      );
      
      // If the response is invalid with high confidence, make corrections
      if (!validationResult.isValid && validationResult.confidence > 0.7 && validationResult.corrections) {
        console.log('Making corrections based on mapping guide validation');
        
        // Add corrected information to the response
        enhancedResponse = response + "\n\n---\n\n**Important clarification based on the New Listing Applicant Guide:**\n\n" + 
          validationResult.corrections;
        
        return {
          enhancedResponse,
          metadata: {
            relevanceScore,
            completenessScore,
            isVerified: true,
            verificationConfidence: validationResult.confidence,
            correctionsMade: true
          }
        };
      }
      
      // Return metadata about verification even if no corrections were made
      return {
        enhancedResponse,
        metadata: {
          relevanceScore,
          completenessScore,
          isVerified: true,
          verificationConfidence: validationResult.confidence,
          correctionsMade: false
        }
      };
    }
    
    // For non-listing queries, return standard metadata
    return {
      enhancedResponse,
      metadata: {
        relevanceScore,
        completenessScore,
        isVerified: false
      }
    };
  }
};

export default responseOptimizer;
