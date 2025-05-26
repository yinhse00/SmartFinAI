
import { contextService } from '../contextService';
import { announcementVettingService, VettingCheck } from '../../vetting/announcementVettingService';
import { guidanceValidationService, GuidanceValidation } from '../guidanceValidationService';

export interface EnhancedContext {
  regulatoryContext: string;
  vettingInfo: VettingCheck;
  guidanceValidation: GuidanceValidation;
  contextMetadata: {
    hasVettingRequirements: boolean;
    hasRelevantGuidance: boolean;
    processingTime: number;
    sources: string[];
  };
}

/**
 * Enhanced context service that includes vetting and guidance validation
 */
export const enhancedContextService = {
  /**
   * Get comprehensive regulatory context with vetting and guidance checks
   */
  getEnhancedContext: async (
    query: string,
    options?: { isPreliminaryAssessment?: boolean, metadata?: any }
  ): Promise<EnhancedContext> => {
    const startTime = Date.now();
    
    try {
      console.log('Getting enhanced regulatory context with vetting and guidance checks');
      
      // Run all context gathering in parallel for optimal performance
      const [regulatoryContext, vettingInfo, guidanceValidation] = await Promise.all([
        // Original regulatory context
        contextService.getRegulatoryContext(query, options),
        
        // Vetting requirements check
        announcementVettingService.getVettingInfo(query).catch(error => {
          console.error('Error getting vetting info:', error);
          return { isRequired: false, confidence: 0 };
        }),
        
        // Guidance validation check
        guidanceValidationService.findRelevantGuidance(query, 5).catch(error => {
          console.error('Error finding relevant guidance:', error);
          return { hasRelevantGuidance: false, matches: [], confidence: 0, searchStrategy: 'error' };
        })
      ]);
      
      const processingTime = Date.now() - startTime;
      
      // Collect sources
      const sources = ['regulatory-database'];
      if (vettingInfo.isRequired) sources.push('vetting-requirements');
      if (guidanceValidation.hasRelevantGuidance) sources.push('regulatory-guidance');
      
      console.log(`Enhanced context gathered in ${processingTime}ms`);
      console.log(`Vetting required: ${vettingInfo.isRequired}`);
      console.log(`Relevant guidance found: ${guidanceValidation.hasRelevantGuidance}`);
      
      return {
        regulatoryContext,
        vettingInfo,
        guidanceValidation,
        contextMetadata: {
          hasVettingRequirements: vettingInfo.isRequired,
          hasRelevantGuidance: guidanceValidation.hasRelevantGuidance,
          processingTime,
          sources
        }
      };
    } catch (error) {
      console.error('Error in enhanced context service:', error);
      
      // Fallback to basic context
      const basicContext = await contextService.getRegulatoryContext(query, options);
      
      return {
        regulatoryContext: basicContext,
        vettingInfo: { isRequired: false, confidence: 0 },
        guidanceValidation: { hasRelevantGuidance: false, matches: [], confidence: 0, searchStrategy: 'fallback' },
        contextMetadata: {
          hasVettingRequirements: false,
          hasRelevantGuidance: false,
          processingTime: Date.now() - startTime,
          sources: ['regulatory-database']
        }
      };
    }
  },

  /**
   * Format enhanced context for Grok response generation
   */
  formatEnhancedContextForGrok: (enhancedContext: EnhancedContext): string => {
    let formattedContext = enhancedContext.regulatoryContext;
    
    // Add vetting information if applicable
    if (enhancedContext.vettingInfo.isRequired) {
      formattedContext += '\n\n[VETTING REQUIREMENTS]\n';
      formattedContext += `This announcement requires pre-vetting by the Exchange.\n`;
      
      if (enhancedContext.vettingInfo.headlineCategory) {
        formattedContext += `Headline Category: ${enhancedContext.vettingInfo.headlineCategory}\n`;
      }
      
      if (enhancedContext.vettingInfo.description) {
        formattedContext += `Description: ${enhancedContext.vettingInfo.description}\n`;
      }
      
      if (enhancedContext.vettingInfo.exemptions) {
        formattedContext += `Exemptions: ${enhancedContext.vettingInfo.exemptions}\n`;
      }
      
      if (enhancedContext.vettingInfo.ruleReference) {
        formattedContext += `Rule Reference: ${enhancedContext.vettingInfo.ruleReference}\n`;
      }
    }
    
    // Add relevant guidance if found
    if (enhancedContext.guidanceValidation.hasRelevantGuidance) {
      formattedContext += '\n\n[RELEVANT REGULATORY GUIDANCE]\n';
      
      enhancedContext.guidanceValidation.matches.forEach((match, index) => {
        formattedContext += `\n${index + 1}. ${match.type.toUpperCase()}: ${match.title}\n`;
        formattedContext += `${match.content}\n`;
        
        if (match.applicableRules && match.applicableRules.length > 0) {
          formattedContext += `Applicable Rules: ${match.applicableRules.join(', ')}\n`;
        }
        
        if (match.guidanceNumber) {
          formattedContext += `Guidance Number: ${match.guidanceNumber}\n`;
        }
      });
    }
    
    return formattedContext;
  },

  /**
   * Validate response against enhanced context
   */
  validateResponseAgainstEnhancedContext: async (
    response: string,
    query: string,
    enhancedContext: EnhancedContext
  ): Promise<{
    isValid: boolean;
    vettingConsistency: boolean;
    guidanceConsistency: boolean;
    validationNotes: string[];
    confidence: number;
  }> => {
    try {
      console.log('Validating response against enhanced context');
      
      const validationNotes: string[] = [];
      let vettingConsistency = true;
      let guidanceConsistency = true;
      
      // Check vetting consistency
      if (enhancedContext.vettingInfo.isRequired) {
        const mentionsVetting = response.toLowerCase().includes('vetting') || 
                              response.toLowerCase().includes('pre-vetting') ||
                              response.toLowerCase().includes('exchange approval');
        
        if (!mentionsVetting) {
          vettingConsistency = false;
          validationNotes.push('Response should mention pre-vetting requirement');
        }
      }
      
      // Check guidance consistency
      if (enhancedContext.guidanceValidation.hasRelevantGuidance) {
        const guidanceValidation = await guidanceValidationService.validateResponseAgainstGuidance(
          response, 
          query, 
          enhancedContext.guidanceValidation.matches
        );
        guidanceConsistency = guidanceValidation.isConsistent;
        
        if (guidanceValidation.conflictingGuidance.length > 0) {
          validationNotes.push(`Response conflicts with ${guidanceValidation.conflictingGuidance.length} guidance document(s)`);
        }
      }
      
      const isValid = vettingConsistency && guidanceConsistency;
      const confidence = calculateOverallConfidence(
        enhancedContext.vettingInfo.confidence,
        enhancedContext.guidanceValidation.confidence,
        vettingConsistency,
        guidanceConsistency
      );
      
      return {
        isValid,
        vettingConsistency,
        guidanceConsistency,
        validationNotes,
        confidence
      };
    } catch (error) {
      console.error('Error validating response against enhanced context:', error);
      return {
        isValid: true, // Default to valid on error
        vettingConsistency: true,
        guidanceConsistency: true,
        validationNotes: ['Validation error occurred'],
        confidence: 0
      };
    }
  }
};

/**
 * Calculate overall validation confidence
 */
function calculateOverallConfidence(
  vettingConfidence: number,
  guidanceConfidence: number,
  vettingConsistency: boolean,
  guidanceConsistency: boolean
): number {
  const consistencyBonus = (vettingConsistency ? 0.2 : -0.3) + (guidanceConsistency ? 0.2 : -0.3);
  const avgConfidence = (vettingConfidence + guidanceConfidence) / 2;
  
  return Math.max(0, Math.min(1, avgConfidence + consistencyBonus));
}
