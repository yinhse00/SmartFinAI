
import { ipoAIChatService } from './ipoAIChatService';
import { contentAnalysisService } from './contentAnalysisService';
import { grokService } from '@/services/grokService';
import { ProactiveAnalysisResult, TargetedEdit } from '@/types/ipoAnalysis';

interface EnhancedChatResponse {
  type: 'PROACTIVE_ANALYSIS' | 'TARGETED_IMPROVEMENTS' | 'CONTENT_UPDATE' | 'GUIDANCE';
  message: string;
  proactiveAnalysis?: ProactiveAnalysisResult;
  targetedEdits?: TargetedEdit[];
  updatedContent?: string;
  confidence: number;
}

/**
 * Enhanced IPO AI Chat Service that works like Lovable
 * Provides proactive analysis and intelligent suggestions
 */
export class EnhancedIPOAIChatService {
  
  /**
   * Process message with proactive analysis (like Lovable's code analysis)
   */
  async processMessageWithAnalysis(
    userMessage: string,
    projectId: string,
    sectionType: string,
    currentContent: string
  ): Promise<EnhancedChatResponse> {
    try {
      console.log('🚀 Enhanced IPO Chat: Starting proactive analysis...');
      
      // Step 1: Always analyze content first (like Lovable analyzing code)
      const proactiveAnalysis = await contentAnalysisService.getProactiveSuggestions(
        currentContent,
        sectionType
      );
      
      // Step 2: Determine response type based on user message and analysis
      const responseType = this.determineResponseType(userMessage, proactiveAnalysis);
      
      // Step 3: Generate appropriate response
      switch (responseType) {
        case 'PROACTIVE_ANALYSIS':
          return this.createProactiveAnalysisResponse(proactiveAnalysis);
          
        case 'TARGETED_IMPROVEMENTS':
          const targetedEdits = await contentAnalysisService.generateTargetedEdits(
            currentContent,
            userMessage,
            sectionType
          );
          return this.createTargetedImprovementsResponse(targetedEdits, userMessage);
          
        case 'CONTENT_UPDATE':
          // Use existing service for content updates
          const originalResponse = await ipoAIChatService.processMessage(
            userMessage,
            projectId,
            sectionType,
            currentContent
          );
          return this.enhanceOriginalResponse(originalResponse, proactiveAnalysis);
          
        default:
          return this.createGuidanceResponse(userMessage, proactiveAnalysis);
      }
      
    } catch (error) {
      console.error('Enhanced chat processing failed:', error);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Generate automatic fix for specific issue
   */
  async generateAutoFix(
    issueId: string,
    currentContent: string,
    sectionType: string
  ): Promise<{ success: boolean; updatedContent?: string; message: string }> {
    try {
      // Analyze the specific issue
      const analysis = await contentAnalysisService.analyzeContent(currentContent, sectionType, '');
      const issue = [...analysis.structuralIssues, ...analysis.complianceGaps]
        .find(i => i.id === issueId);
      
      if (!issue || !issue.autoFixable) {
        return {
          success: false,
          message: 'This issue cannot be automatically fixed.'
        };
      }

      // Generate targeted fix
      const fixPrompt = `
Fix this specific issue in the IPO prospectus content:

ISSUE: ${issue.title}
DESCRIPTION: ${issue.description}
SUGGESTED FIX: ${issue.suggestedFix || 'Improve the content to address this issue'}

CURRENT CONTENT:
${currentContent}

Provide the complete updated content with the issue fixed. Make minimal changes focused only on addressing this specific issue.

Return format:
UPDATED_CONTENT:
[complete updated content here]
`;

      const response = await grokService.generateResponse({
        prompt: fixPrompt,
        metadata: { requestType: 'auto_fix' }
      });

      const updatedContent = this.extractUpdatedContent(response.text);
      
      if (updatedContent && updatedContent !== currentContent) {
        return {
          success: true,
          updatedContent,
          message: `Fixed: ${issue.title}`
        };
      } else {
        return {
          success: false,
          message: 'Unable to generate a suitable fix for this issue.'
        };
      }
      
    } catch (error) {
      console.error('Auto-fix generation failed:', error);
      return {
        success: false,
        message: 'Failed to generate auto-fix. Please try manual editing.'
      };
    }
  }

  /**
   * Apply improvement opportunity
   */
  async applyImprovement(
    opportunityId: string,
    currentContent: string,
    sectionType: string
  ): Promise<{ success: boolean; updatedContent?: string; message: string }> {
    try {
      const analysis = await contentAnalysisService.analyzeContent(currentContent, sectionType, '');
      const opportunity = analysis.improvementOpportunities.find(o => o.id === opportunityId);
      
      if (!opportunity) {
        return {
          success: false,
          message: 'Improvement opportunity not found.'
        };
      }

      const improvementPrompt = `
Apply this improvement to the IPO prospectus content:

IMPROVEMENT: ${opportunity.title}
DESCRIPTION: ${opportunity.description}
SUGGESTED ACTION: ${opportunity.suggestedAction}
EXPECTED IMPACT: ${opportunity.impact}

CURRENT CONTENT:
${currentContent}

Apply the improvement while maintaining the existing content structure and flow. Focus on enhancing quality without major restructuring.

Return format:
UPDATED_CONTENT:
[complete updated content with improvement applied]
`;

      const response = await grokService.generateResponse({
        prompt: improvementPrompt,
        metadata: { requestType: 'apply_improvement' }
      });

      const updatedContent = this.extractUpdatedContent(response.text);
      
      if (updatedContent && updatedContent !== currentContent) {
        return {
          success: true,
          updatedContent,
          message: `Applied improvement: ${opportunity.title}`
        };
      } else {
        return {
          success: false,
          message: 'Unable to apply this improvement automatically.'
        };
      }
      
    } catch (error) {
      console.error('Improvement application failed:', error);
      return {
        success: false,
        message: 'Failed to apply improvement. Please try manual editing.'
      };
    }
  }

  /**
   * Determine response type based on user input and analysis
   */
  private determineResponseType(userMessage: string, analysis: ProactiveAnalysisResult): string {
    const message = userMessage.toLowerCase();
    
    // If user asks for analysis or there are urgent issues
    if (message.includes('analyze') || message.includes('check') || message.includes('review')) {
      return 'PROACTIVE_ANALYSIS';
    }
    
    // If user asks for specific improvements
    if (message.includes('improve') || message.includes('enhance') || message.includes('fix')) {
      return 'TARGETED_IMPROVEMENTS';
    }
    
    // If user asks for content changes
    if (message.includes('add') || message.includes('update') || message.includes('change') || message.includes('write')) {
      return 'CONTENT_UPDATE';
    }
    
    return 'GUIDANCE';
  }

  /**
   * Create proactive analysis response
   */
  private createProactiveAnalysisResponse(analysis: ProactiveAnalysisResult): EnhancedChatResponse {
    const message = `**Content Analysis Complete**

${analysis.summary}

I've identified ${analysis.urgentIssues.length} urgent issue${analysis.urgentIssues.length !== 1 ? 's' : ''} and ${analysis.quickWins.length} quick improvement${analysis.quickWins.length !== 1 ? 's' : ''} for your content.

Click on the suggestions below to apply them automatically, or ask me to "fix compliance issues" or "apply improvements" for broader changes.`;

    return {
      type: 'PROACTIVE_ANALYSIS',
      message,
      proactiveAnalysis: analysis,
      confidence: 0.9
    };
  }

  /**
   * Create targeted improvements response
   */
  private createTargetedImprovementsResponse(edits: TargetedEdit[], userMessage: string): EnhancedChatResponse {
    const message = edits.length > 0 
      ? `**Targeted Improvements Ready**

I've analyzed your request "${userMessage}" and prepared ${edits.length} specific improvement${edits.length !== 1 ? 's' : ''} to your content.

Each improvement shows exactly what will change and why. You can apply them individually or ask me to apply all improvements.`
      : `I understand you want to improve the content, but I need more specific guidance. Try asking me to:

• "Make this more professional"
• "Add regulatory citations" 
• "Improve compliance"
• "Add specific examples"
• "Fix any issues you found"`;

    return {
      type: 'TARGETED_IMPROVEMENTS',
      message,
      targetedEdits: edits,
      confidence: edits.length > 0 ? 0.85 : 0.6
    };
  }

  /**
   * Enhance original response with proactive analysis
   */
  private enhanceOriginalResponse(originalResponse: any, analysis: ProactiveAnalysisResult): EnhancedChatResponse {
    return {
      type: 'CONTENT_UPDATE',
      message: originalResponse.message,
      updatedContent: originalResponse.updatedContent,
      proactiveAnalysis: analysis,
      confidence: originalResponse.confidence
    };
  }

  /**
   * Create guidance response
   */
  private createGuidanceResponse(userMessage: string, analysis: ProactiveAnalysisResult): EnhancedChatResponse {
    let message = `I'm here to help improve your IPO prospectus content. `;
    
    if (analysis.hasIssues) {
      message += `I noticed ${analysis.urgentIssues.length + analysis.quickWins.length} potential improvements in your current content. `;
    }
    
    message += `Here are some ways I can help:

• **"Analyze my content"** - Get detailed analysis with specific suggestions
• **"Fix compliance issues"** - Automatically address regulatory gaps  
• **"Make this more professional"** - Enhance language and tone
• **"Add specific examples"** - Include concrete details and cases
• **"Improve structure"** - Reorganize for better flow

What would you like me to help with?`;

    return {
      type: 'GUIDANCE',
      message,
      proactiveAnalysis: analysis,
      confidence: 0.8
    };
  }

  /**
   * Extract updated content from AI response
   */
  private extractUpdatedContent(response: string): string {
    const match = response.match(/UPDATED_CONTENT:\s*([\s\S]*?)(?:\n\n|$)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: any): EnhancedChatResponse {
    return {
      type: 'GUIDANCE',
      message: 'I encountered an issue while analyzing your content. Please try again or rephrase your request.',
      confidence: 0.1
    };
  }
}

export const enhancedIPOAIChatService = new EnhancedIPOAIChatService();
