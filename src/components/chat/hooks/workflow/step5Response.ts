
import { grokService } from '@/services/grokService';
import { safelyExtractText } from '@/services/utils/responseUtils';

/**
 * Step 5: Enhanced Response Generation with visual output optimization
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
    
    // Determine if this query would benefit from visual representation
    const isProcessQuery = params.query.toLowerCase().includes('process') ||
                          params.query.toLowerCase().includes('procedure') ||
                          params.query.toLowerCase().includes('steps') ||
                          params.query.toLowerCase().includes('how to');
    
    const isTimelineQuery = params.query.toLowerCase().includes('timeline') ||
                           params.query.toLowerCase().includes('timetable') ||
                           params.query.toLowerCase().includes('schedule') ||
                           params.query.toLowerCase().includes('deadline');
    
    const isDecisionQuery = params.query.toLowerCase().includes('criteria') ||
                           params.query.toLowerCase().includes('requirement') ||
                           params.query.toLowerCase().includes('exemption') ||
                           params.query.toLowerCase().includes('whether');
    
    // Create enhanced instructions with visual formatting guidance
    let enhancedInstructions = `
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

    // Add specific visual formatting hints based on query type
    if (isTimelineQuery) {
      enhancedInstructions += `

TIMELINE FORMATTING:
- Structure timeline information clearly with T-X or T+X notation (e.g., T-15, T+5)
- Use consistent date formats and include day descriptions
- Organize chronologically from earliest to latest events
- Include both deadlines and milestones
- Specify business days vs calendar days where relevant
- Bold critical deadlines and submission dates
`;
    }
    
    if (isProcessQuery) {
      enhancedInstructions += `

PROCESS FORMATTING:
- Number each step clearly (Step 1, Step 2, etc.)
- Use action-oriented language for each step
- Include responsible parties and timeframes
- Show decision points and alternative paths
- Highlight approval requirements and checkpoints
- Include any parallel processes or dependencies
`;
    }
    
    if (isDecisionQuery) {
      enhancedInstructions += `

DECISION CRITERIA FORMATTING:
- Clearly state the main decision question
- Present criteria in a logical order
- Use "if/then" structure for conditional requirements
- Distinguish between mandatory and optional criteria
- Include exemption conditions and their requirements
- Show the decision outcomes clearly
`;
    }
    
    // Quality-optimized response parameters - ALWAYS use full model
    const responseParams = {
      prompt: `${params.query}\n\n${enhancedInstructions}`,
      regulatoryContext: responseContext,
      maxTokens: isComplexQuery ? 25000 : 15000, // Higher token limits for quality
      temperature: 0.5, // Balanced temperature for better quality
      model: "grok-3-beta", // Always use the full model for user responses
      progressCallback: (progress: number, stage: string) => {
        // Update progress during response generation
        setStepProgress(`${lastInputWasChinese ? '生成回复' : 'Generating'} - ${Math.round(progress)}%`);
      }
    };
    
    // Generate response using Grok with quality-optimized parameters
    const response = await grokService.generateResponse(responseParams);
    const responseText = safelyExtractText(response);
    
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
