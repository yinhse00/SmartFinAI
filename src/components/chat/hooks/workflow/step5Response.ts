
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { universalAiClient } from '@/services/ai/universalAiClient';
import { AIProvider } from '@/types/aiProvider';

/**
 * Step 5: Enhanced Response Generation with quality-focused parameters
 */
export const executeStep5 = async (
  params: any, 
  setStepProgress: (progress: string) => void,
  lastInputWasChinese: boolean
) => {
  setStepProgress(lastInputWasChinese ? '正在生成回复' : 'Generating response');
  
  try {
    // Get combined context from all sources
    const responseContext = params.regulatoryContext || 
                           params.executionContext || 
                           params.listingRulesContext || 
                           params.takeoversCodeContext || '';
    
    // Check for missing query parameter
    if (!params.query) {
      console.error('executeStep5: Missing query in params', params);
      return { 
        completed: false,
        error: new Error("Missing query parameter"),
        response: "I couldn't process your request because the query was missing."
      };
    }
    
    // Check if this is a complex query
    const isComplexQuery = params.query.length > 150 || 
                          params.query.toLowerCase().includes('timetable') ||
                          params.query.toLowerCase().includes('rights issue');
    
    // Create quality-focused instructions with improved formatting guidance for semantic HTML
    // and professional tone guidance
    const enhancedInstructions = `
IMPORTANT: Provide a comprehensive and thorough response. Include all relevant information with appropriate formatting.

PROFESSIONAL TONE GUIDELINES:
- Adopt a formal, authoritative tone appropriate for financial professionals and regulatory experts
- Use precise technical terminology and avoid colloquial language
- Structure responses with clear sections: Introduction, Analysis, Requirements, Conclusion
- Begin with a concise executive summary of your response
- For definitions or key concepts, use formal language and cite specific regulatory provisions
- When providing advice, present options and implications in a measured, objective manner
- Conclude with clear recommendations or next steps
- Use confidence markers appropriately (e.g., "with certainty" vs "likely" vs "possibly")
- Format numbers consistently using financial conventions (e.g., "HK$1,000,000")
- For tables and data, include footnotes with clarifications where appropriate
- When referencing rules, include full citation format: "Rule X.XX of the [Regulatory Document]"

VERIFICATION REQUIREMENT:
- Verify all quotes against the provided regulatory database content
- If directly quoting from FAQs, Guidance Letters, or Listing Decisions, ensure verbatim accuracy
- If uncertain about exact wording, clearly indicate this (e.g., "According to the general principles of...")
- For specific rule citations, double-check rule numbers and paragraphs for accuracy
- Clearly distinguish between quoted regulatory text and your professional interpretation

FORMATTING GUIDELINES:
- Use semantic HTML elements for structure:
  • <h1>, <h2>, <h3> for headings instead of markdown symbols (#, ##, ###)
  • <p> tags for paragraphs with proper spacing
  • <strong> for bold/important text
  • <em> for italic/emphasized text
  • <ul> and <li> for bullet point lists
- Create clear visual separation between different sections
- Format bullet points properly with appropriate indentation
- Ensure proper spacing between paragraphs and sections
- Use tables with proper headers when presenting tabular data
- Bold key terms, rule references, and important concepts

For rules interpretation: 
- Include specific rule references with detailed explanations
- Cover all relevant requirements and implications
- For timetables, include all critical dates and explain their significance
- Use tables for clarity when appropriate
- Bold important points and rule references for emphasis

Ensure your response is complete, accurate, and addresses all aspects of the query.
`;
    
    // Quality-optimized response parameters - ALWAYS use full model
    const responseParams = {
      prompt: `${params.query}\n\n${enhancedInstructions}`,
      regulatoryContext: responseContext,
      maxTokens: isComplexQuery ? 25000 : 15000, // Higher token limits for quality
      temperature: 0.5, // Balanced temperature for better quality
      model: "grok-4-0709", // Always use the full model for user responses
      progressCallback: (progress: number, stage: string) => {
        // Update progress during response generation
        setStepProgress(`${lastInputWasChinese ? '生成回复' : 'Generating'} - ${Math.round(progress)}%`);
      }
    };
    
    // Get user's AI preference for chat
    const chatPreference = getFeatureAIPreference('chat');
    
    // Generate response using user's preferred AI provider
    let response;
    let responseText;
    
    if (chatPreference.provider === AIProvider.GROK) {
      // Use existing Grok service for Grok requests
      response = await grokService.generateResponse(responseParams);
      responseText = safelyExtractText(response);
    } else {
      // Use universal AI client for other providers
      const aiResponse = await universalAiClient.generateContent({
        prompt: responseParams.prompt,
        provider: chatPreference.provider,
        modelId: chatPreference.model,
        metadata: {
          regulatoryContext: responseParams.regulatoryContext,
          maxTokens: responseParams.maxTokens,
          temperature: responseParams.temperature
        }
      });
      
      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Failed to generate response');
      }
      
      responseText = aiResponse.text;
      response = {
        text: responseText,
        metadata: {
          provider: aiResponse.provider,
          modelId: aiResponse.modelId
        }
      };
    }
    
    // If no response text was extracted, provide a fallback
    if (!responseText || responseText.trim() === '') {
      return {
        completed: false,
        error: new Error("No response generated"),
        response: "I'm having trouble processing your request right now. Please try again."
      };
    }
    
    // Return appropriate response based on language
    if (lastInputWasChinese) {
      return {
        completed: true,
        response: responseText,
        metadata: response.metadata,
        requiresTranslation: true
      };
    }
    
    return {
      completed: true,
      response: responseText,
      metadata: response.metadata
    };
  } catch (error) {
    console.error('Error in step 5:', error);
    return { 
      completed: false,
      error,
      response: "I encountered an error while processing your request. Please try again."
    };
  }
};

