
import { ipoAIChatService } from './ipoAIChatService';
import { contentAnalysisService } from './contentAnalysisService';
import { sectionAnalysisService } from './sectionAnalysisService';
import { simpleAiClient } from './simpleAiClient';
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
   * Extract suggested content from AI response for direct application
   */
  private extractSuggestedContent(response: string): { content: string; confidence: number } | null {
    // Look for content blocks marked for implementation
    const contentMarkers = [
      /```(?:suggested|updated|revised|improved)?\s*([\s\S]*?)```/gi,
      /SUGGESTED_CONTENT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /UPDATED_TEXT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /REVISED_CONTENT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi
    ];

    for (const marker of contentMarkers) {
      const matches = response.match(marker);
      if (matches && matches.length > 0) {
        const content = matches[0]
          .replace(/```(?:suggested|updated|revised|improved)?/gi, '')
          .replace(/```/g, '')
          .replace(/SUGGESTED_CONTENT:|UPDATED_TEXT:|REVISED_CONTENT:/gi, '')
          .trim();
        
        if (content.length > 50) { // Ensure meaningful content
          const confidence = this.calculateContentConfidence(response, content);
          return { content, confidence };
        }
      }
    }

    // Fallback: look for any substantial content block
    const lines = response.split('\n');
    const contentLines = lines.filter(line => 
      line.trim().length > 30 && 
      !line.includes('suggest') && 
      !line.includes('recommend') &&
      !line.match(/^(here|this|consider|you|i)/i)
    );

    if (contentLines.length >= 3) {
      const content = contentLines.join('\n').trim();
      return { content, confidence: 0.6 };
    }

    return null;
  }

  /**
   * Calculate confidence score for suggested content
   */
  private calculateContentConfidence(response: string, content: string): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for structured responses
    if (response.includes('SUGGESTED_CONTENT') || response.includes('UPDATED_TEXT')) confidence += 0.2;
    if (response.includes('regulatory') || response.includes('HKEX')) confidence += 0.1;
    if (content.length > 200) confidence += 0.1;
    if (content.includes('pursuant to') || content.includes('in accordance with')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

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
      console.log('🚀 Enhanced IPO Chat: Starting intelligent analysis...');
      
      // Step 1: Check if this is an amendment request
      const isAmendmentRequest = this.isAmendmentRequest(userMessage);
      
      // Step 2: If amendment, analyze cross-section impact
      if (isAmendmentRequest) {
        return await this.processAmendmentWithSectionReview(
          userMessage,
          projectId,
          sectionType,
          currentContent
        );
      }
      
      // Step 3: Regular content analysis with offline fallback
      let proactiveAnalysis;
      try {
        proactiveAnalysis = await contentAnalysisService.getProactiveSuggestions(
          currentContent,
          sectionType
        );
      } catch (error) {
        console.warn('Content analysis failed, using offline mode:', error);
        proactiveAnalysis = this.createOfflineAnalysis(currentContent);
      }
      
      // Step 4: Determine response type based on user message and analysis
      const responseType = this.determineResponseType(userMessage, proactiveAnalysis);
      
      // Step 5: Generate appropriate response
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
          
          // Extract suggested content if present
          const suggestedContent = this.extractSuggestedContent(originalResponse.message);
          const enhancedResponse = this.enhanceOriginalResponse(originalResponse, proactiveAnalysis);
          
          if (suggestedContent) {
            enhancedResponse.updatedContent = suggestedContent.content;
            enhancedResponse.confidence = Math.max(enhancedResponse.confidence, suggestedContent.confidence);
          }
          
          return enhancedResponse;
          
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

      const response = await simpleAiClient.generateContent({
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

      const response = await simpleAiClient.generateContent({
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
   * Check if user message is an amendment request
   */
  private isAmendmentRequest(userMessage: string): boolean {
    const amendmentKeywords = [
      'amend', 'change', 'update', 'modify', 'revise', 'edit', 'alter',
      'add to', 'remove from', 'replace', 'rewrite', 'correct'
    ];
    
    const message = userMessage.toLowerCase();
    return amendmentKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Process amendment with cross-section review
   */
  private async processAmendmentWithSectionReview(
    userMessage: string,
    projectId: string,
    sectionType: string,
    currentContent: string
  ): Promise<EnhancedChatResponse> {
    try {
      // Analyze impact on related sections
      const impactAnalysis = await sectionAnalysisService.analyzeAmendmentImpact(
        projectId,
        sectionType,
        userMessage,
        currentContent
      );

      // Fetch related section content for context
      const relatedContent = await sectionAnalysisService.fetchRelatedContent(
        projectId,
        impactAnalysis.affectedSections
      );

      // Generate enhanced prompt with cross-section context
      const enhancedPrompt = sectionAnalysisService.generateCrossSectionPrompt(
        sectionType,
        userMessage,
        currentContent,
        relatedContent
      );

      // Get AI response with full context
      const response = await simpleAiClient.generateContent({
        prompt: enhancedPrompt,
        metadata: { 
          requestType: 'amendment_with_review',
          affectedSections: impactAnalysis.affectedSections
        }
      });

      const updatedContent = this.extractUpdatedContent(response.text);
      
      let message = response.text;
      if (impactAnalysis.affectedSections.length > 0) {
        message += `\n\n**📋 Cross-Section Review:**\nThis change may affect: ${impactAnalysis.affectedSections.join(', ')}\n\n**⚠️ Consistency Checks Needed:**\n${impactAnalysis.consistencyIssues.map(issue => `• ${issue}`).join('\n')}`;
      }

      return {
        type: 'CONTENT_UPDATE',
        message,
        updatedContent,
        confidence: 0.85
      };

    } catch (error) {
      console.error('Amendment processing failed:', error);
      return this.createErrorResponse(error);
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
   * Create offline analysis fallback
   */
  private createOfflineAnalysis(content: string): ProactiveAnalysisResult {
    const hasContent = content && content.trim().length > 50;
    const contentLength = content?.length || 0;
    
    if (!hasContent) {
      return {
        hasIssues: true,
        urgentIssues: [{
          id: 'no_content',
          type: 'structural',
          severity: 'high',
          title: 'Missing Content',
          description: 'This section needs content to meet HKEX requirements',
          location: { section: 'general' },
          autoFixable: false
        }],
        quickWins: [],
        summary: "No content detected. This section requires substantial content to meet HKEX disclosure requirements.",
        nextSteps: ["Add content covering HKEX requirements", "Use AI assistance when online", "Review HKEX guidance materials"]
      };
    }
    
    // Basic offline analysis
    const quickWins = [];
    if (contentLength < 500) {
      quickWins.push({
        id: 'expand_content',
        title: 'Expand Content',
        description: 'Content appears brief for HKEX standards',
        impact: 'medium',
        effort: 'moderate',
        suggestedAction: 'Add more detailed information and examples'
      });
    }
    
    return {
      hasIssues: contentLength < 200,
      urgentIssues: [],
      quickWins,
      summary: `Operating in offline mode. Basic analysis shows ${contentLength} characters of content.`,
      nextSteps: ["Connect to internet for detailed HKEX analysis", "Review content against HKEX requirements", "Add specific examples and citations"]
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: any): EnhancedChatResponse {
    const isOfflineError = error?.message?.includes('API key') || error?.message?.includes('network') || error?.message?.includes('fetch');
    
    return {
      type: 'GUIDANCE',
      message: isOfflineError 
        ? 'Operating in offline mode. I can provide basic guidance, but for detailed HKEX analysis and content generation, please configure your API key settings.'
        : 'I encountered an issue while analyzing your content. Please try again or rephrase your request.',
      confidence: 0.1
    };
  }
}

export const enhancedIPOAIChatService = new EnhancedIPOAIChatService();
