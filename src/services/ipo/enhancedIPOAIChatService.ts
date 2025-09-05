
import { ipoAIChatService } from './ipoAIChatService';
import { contentAnalysisService } from './contentAnalysisService';
import { sectionAnalysisService } from './sectionAnalysisService';
import { simpleAiClient } from './simpleAiClient';
import { ProactiveAnalysisResult, TargetedEdit } from '@/types/ipoAnalysis';

interface EnhancedChatResponse {
  type: 'PROACTIVE_ANALYSIS' | 'TARGETED_IMPROVEMENTS' | 'CONTENT_UPDATE' | 'GUIDANCE' | 'TABULAR_CONTENT' | 'SECTION_STRUCTURE' | 'COMPLIANCE_ENHANCEMENT';
  message: string;
  proactiveAnalysis?: ProactiveAnalysisResult;
  targetedEdits?: TargetedEdit[];
  updatedContent?: string;
  tabularData?: any;
  sectionStructure?: any;
  confidence: number;
}

/**
 * Enhanced IPO AI Chat Service that works like Lovable
 * Provides proactive analysis and intelligent suggestions
 */
export class EnhancedIPOAIChatService {
  
  /**
   * Extract suggested content from AI response for direct application - Enhanced for proactive detection
   */
  private extractSuggestedContent(response: string): { content: string; confidence: number } | null {
    // Enhanced content markers for better detection
    const contentMarkers = [
      /```(?:suggested|updated|revised|improved|content|text)?\s*([\s\S]*?)```/gi,
      /SUGGESTED_CONTENT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /UPDATED_TEXT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /REVISED_CONTENT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /IMPROVED_VERSION:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi,
      /NEW_CONTENT:\s*([\s\S]*?)(?=\n\n|\nEND|$)/gi
    ];

    for (const marker of contentMarkers) {
      const matches = response.match(marker);
      if (matches && matches.length > 0) {
        const content = matches[0]
          .replace(/```(?:suggested|updated|revised|improved|content|text)?/gi, '')
          .replace(/```/g, '')
          .replace(/SUGGESTED_CONTENT:|UPDATED_TEXT:|REVISED_CONTENT:|IMPROVED_VERSION:|NEW_CONTENT:/gi, '')
          .trim();
        
        if (content.length > 50) {
          const confidence = this.calculateContentConfidence(response, content);
          return { content, confidence };
        }
      }
    }

    // Enhanced proactive detection: Look for improvement patterns
    const improvementPatterns = [
      /(?:here'?s?\s+(?:a\s+)?(?:better|improved|enhanced|revised)\s+version[:\s]*)([\s\S]*?)(?=\n\n|$)/gi,
      /(?:try\s+this\s+instead[:\s]*)([\s\S]*?)(?=\n\n|$)/gi,
      /(?:i\s+(?:suggest|recommend)\s+changing\s+(?:this\s+)?to[:\s]*)([\s\S]*?)(?=\n\n|$)/gi,
      /(?:a\s+more\s+professional\s+version\s+would\s+be[:\s]*)([\s\S]*?)(?=\n\n|$)/gi
    ];

    for (const pattern of improvementPatterns) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        const content = matches[0]
          .replace(/here'?s?\s+(?:a\s+)?(?:better|improved|enhanced|revised)\s+version[:\s]*/gi, '')
          .replace(/try\s+this\s+instead[:\s]*/gi, '')
          .replace(/i\s+(?:suggest|recommend)\s+changing\s+(?:this\s+)?to[:\s]*/gi, '')
          .replace(/a\s+more\s+professional\s+version\s+would\s+be[:\s]*/gi, '')
          .trim();
        
        if (content.length > 50) {
          const confidence = this.calculateContentConfidence(response, content);
          return { content, confidence: confidence + 0.1 }; // Boost confidence for improvement patterns
        }
      }
    }

    // Proactive fallback: Look for substantial content blocks that could be implementations
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    let potentialContent = [];
    let inContentBlock = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip meta/instructional text
      if (trimmed.match(/^(here|this|consider|you|i|to|for|the|it|that|this\s+would|this\s+could)/i) ||
          trimmed.includes('suggest') || trimmed.includes('recommend') || 
          trimmed.includes('should') || trimmed.includes('would') ||
          trimmed.length < 20) {
        if (inContentBlock && potentialContent.length > 0) break; // End of content block
        continue;
      }
      
      // Detect start of content block
      if (!inContentBlock && trimmed.length > 30 && !trimmed.endsWith('?')) {
        inContentBlock = true;
      }
      
      if (inContentBlock) {
        potentialContent.push(line);
      }
    }

    // Check if we found substantial implementable content
    if (potentialContent.length >= 2) {
      const content = potentialContent.join('\n').trim();
      if (content.length > 100) { // Ensure meaningful content
        return { content, confidence: 0.7 };
      }
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
          // Enhanced content update with HKIPO-compliant suggestion generation
          const enhancedPrompt = this.buildHKIPOEnhancedPrompt(userMessage, sectionType, currentContent);
          const originalResponse = await simpleAiClient.generateContent({
            prompt: enhancedPrompt,
            metadata: { requestType: 'hkipo_compliant_content_update' }
          });
          
          // Extract suggested content if present
          let suggestedContent = this.extractSuggestedContent(originalResponse.text);
          const enhancedResponse = this.enhanceOriginalResponseWithHKIPO(originalResponse, proactiveAnalysis);
          
          // If no implementable content found, generate it proactively
          if (!suggestedContent && (userMessage.toLowerCase().includes('improve') || 
              userMessage.toLowerCase().includes('enhance') || 
              userMessage.toLowerCase().includes('better'))) {
            
            const fallbackPrompt = `${userMessage}

CURRENT CONTENT:
${currentContent}

Please provide the complete improved content ready for implementation. Format as:

IMPROVED_VERSION:
[complete updated content here]`;
            
            try {
              const fallbackResponse = await simpleAiClient.generateContent({
                prompt: this.buildHKIPOFallbackPrompt(fallbackPrompt, sectionType),
                metadata: { requestType: 'hkipo_proactive_content_generation' }
              });
              
              suggestedContent = this.extractSuggestedContent(fallbackResponse.text);
              if (suggestedContent) {
                enhancedResponse.message += `\n\n✨ **Ready to Implement**\nI've prepared an improved version of your content below.`;
              }
            } catch (error) {
              console.warn('Fallback content generation failed:', error);
            }
          }
          
          if (suggestedContent) {
            enhancedResponse.updatedContent = suggestedContent.content;
            enhancedResponse.confidence = Math.max(enhancedResponse.confidence, suggestedContent.confidence);
          }
          
          return enhancedResponse;

        case 'TABULAR_CONTENT':
          return await this.createTabularContentResponse(userMessage, sectionType, currentContent, proactiveAnalysis);
          
        case 'SECTION_STRUCTURE':
          return await this.createSectionStructureResponse(userMessage, sectionType, currentContent, proactiveAnalysis);
          
        case 'COMPLIANCE_ENHANCEMENT':
          return await this.createComplianceEnhancementResponse(userMessage, sectionType, currentContent, proactiveAnalysis);
          
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
   * Determine response type based on user input and analysis - Enhanced for HKIPO proactive content updates
   */
  private determineResponseType(userMessage: string, analysis: ProactiveAnalysisResult): string {
    const message = userMessage.toLowerCase();
    
    // HKIPO-specific tabular content detection
    const tabularKeywords = [
      'table', 'customers', 'suppliers', 'licences', 'permits', 'awards',
      'top five', 'major customers', 'major suppliers', 'track record',
      'revenue breakdown', 'segment', 'breakdown'
    ];
    
    const hasTabularRequest = tabularKeywords.some(keyword => message.includes(keyword));
    if (hasTabularRequest) {
      return 'TABULAR_CONTENT';
    }
    
    // HKIPO section structure requests
    const structureKeywords = [
      'structure', 'organize', 'format', 'section', 'headings', 'outline',
      'flow', 'layout', 'numbering', 'headers'
    ];
    
    const hasStructureRequest = structureKeywords.some(keyword => message.includes(keyword));
    if (hasStructureRequest) {
      return 'SECTION_STRUCTURE';
    }
    
    // HKIPO compliance enhancement requests
    const complianceKeywords = [
      'hkipo', 'hkex', 'compliance', 'regulatory', 'listing rules',
      'disclosure', 'requirements', 'guidelines', 'standards',
      'plain language', 'clear', 'specific', 'material'
    ];
    
    const hasComplianceRequest = complianceKeywords.some(keyword => message.includes(keyword));
    if (hasComplianceRequest) {
      return 'COMPLIANCE_ENHANCEMENT';
    }
    
    // Prioritize CONTENT_UPDATE for any actionable requests (like Lovable AI)
    const contentUpdateKeywords = [
      'improve', 'enhance', 'better', 'fix', 'optimize', 'refine',
      'make', 'add', 'change', 'update', 'modify', 'edit',
      'rewrite', 'revise', 'adjust', 'polish', 'professional',
      'examples', 'details', 'citations', 'expand', 'develop'
    ];
    
    // Check if message contains any actionable keywords
    const hasActionableContent = contentUpdateKeywords.some(keyword => message.includes(keyword));
    
    if (hasActionableContent) {
      return 'CONTENT_UPDATE'; // Always generate implementable content for improvements
    }
    
    // Analysis requests
    if (message.includes('analyze') || message.includes('check') || message.includes('review') ||
        message.includes('assess') || message.includes('evaluate')) {
      return 'PROACTIVE_ANALYSIS';
    }
    
    // Guidance requests
    if (message.includes('guidance') || message.includes('help') || message.includes('how to') || 
        message.includes('best practice') || message.includes('recommend') || message.includes('advice')) {
      return 'GUIDANCE';
    }
    
    // Default: if we have actionable analysis results, provide content updates
    if (analysis.urgentIssues.length > 0 || analysis.quickWins.length > 0) {
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
   * Build HKIPO-compliant enhanced prompt with comprehensive guidelines
   */
  private buildHKIPOEnhancedPrompt(userMessage: string, sectionType: string, currentContent: string): string {
    const sectionTemplates = this.getHKIPOSectionTemplate(sectionType);
    
    return `You are an expert Hong Kong IPO prospectus drafting AI assistant specialized in HKIPO compliance.

**HKIPO DRAFTING GUIDELINES:**
A. CORE PRINCIPLES:
   - Fairly present relevant, material and specific information
   - Use plain language that is clear and easy to comprehend
   - Be accurate and complete in all material respects and not misleading or deceptive

B. DRAFTING REQUIREMENTS:
   - Disclose relevant, material and specific information (avoid general information)
   - Use everyday language and break up descriptions into shorter sentences
   - Define technical terms consistently in "Definitions" section
   - Use tables, bullets, diagrams and flow charts
   - Organize disclosure logically with descriptive headers
   - Avoid emotional expression and unsubstantiated descriptions
   - Do not avoid disclosing unfavourable information

**CURRENT SECTION: ${sectionType.toUpperCase()}**
**SECTION REQUIREMENTS:**
${sectionTemplates}

**CURRENT CONTENT:**
${currentContent || 'No content yet - ready to start drafting'}

**USER REQUEST:**
${userMessage}

**RESPONSE FORMAT:**
IMPROVED_VERSION:
[Complete HKIPO-compliant content here with proper structure, tables where required, and regulatory citations]

Focus on creating implementable content that follows HKIPO principles and includes specific, material information relevant to investors.`;
  }

  /**
   * Build HKIPO fallback prompt for proactive content generation
   */
  private buildHKIPOFallbackPrompt(basePrompt: string, sectionType: string): string {
    const sectionGuidance = this.getHKIPOSectionTemplate(sectionType);
    
    return `${basePrompt}

**ADDITIONAL HKIPO COMPLIANCE REQUIREMENTS:**
${sectionGuidance}

**FORMATTING REQUIREMENTS:**
- Use clear headers and sub-headers with appropriate numbering
- Present information in tables where specified in templates
- Include specific examples and concrete data
- Use descriptive language that is clear and easy to comprehend
- Ensure content is accurate and not misleading

Generate content that meets HKIPO standards for investor clarity and regulatory compliance.`;
  }

  /**
   * Get HKIPO section-specific templates and requirements
   */
  private getHKIPOSectionTemplate(sectionType: string): string {
    const templates = {
      overview: `
**OVERVIEW SECTION REQUIREMENTS:**
1. Corporate Profile & Background:
   - Nature of business, year of establishment, corporate history
   - Headquarters and principal operations
2. Industry & Market Context:
   - Key industry trends with third-party consultant data
   - Market size, growth rates, and forecasts
   - Competitive position and market share
3. Business Model & Segments:
   - Description of principal services and products
   - Client types and sectors served
4. Key Customers & Track Record:
   - Major customers and length of relationship
   - Examples of successful projects
   - Number of projects completed during track record period
5. Financial Highlights:
   - Summary table of revenue contribution by business line across track record period`,

      business: `
**BUSINESS MODEL SECTION REQUIREMENTS:**
1. Nature and major functions of each business segment, their scale and contribution
2. Revenue model and product/service monetisation
3. Where business model is complicated, describe different parties/intermediaries with flowcharts
4. For any change in business focus, explain reasons and related changes in cost structure
5. Product/service types, life cycle, seasonality, changes during track record period
6. Pictures of products, price ranges by brands, reasons for material fluctuations`,

      customers: `
**MAJOR CUSTOMERS SECTION REQUIREMENTS:**
Must include tabular format showing Top Five Customers for each Track Record Period:
- Rank
- Customer Background
- Year business relationship commenced
- Type(s) of services provided by Group
- Credit term
- Revenue derived from customer
- Percentage of total revenue

Additional requirements:
- Identities and background of five largest customers
- Detailed terms of long-term agreements
- Concentration and counterparty risks
- Third party payment arrangements (should be terminated before listing)`,

      suppliers: `
**MAJOR SUPPLIERS SECTION REQUIREMENTS:**
Must include tabular format showing Top Five Suppliers for each Track Record Period:
- Supplier background (industry, business scope, registered capital)
- Year relationship commenced
- Types of services provided
- Credit/payment terms
- Transaction amount and % of total purchases

Additional requirements:
- Sensitivity and breakeven analysis of cost changes
- Measures to manage supply shortages and price fluctuations
- Inventory control measures and provision policy`,

      licences: `
**LICENCES AND PERMITS SECTION REQUIREMENTS:**
Must include tabulated list with:
- Holder
- Name of licence/permit
- Issuing authority
- Date of grant/filing
- Date of expiry/validity period

General statements required:
- Confirmation all material licences obtained
- Compliance status and renewal procedures
- No material legal impediments to renewal`,

      default: `
**GENERAL HKIPO REQUIREMENTS:**
- Present information in simple, clear manner
- Use tables and bullet points for better readability
- Include specific, material information relevant to investors
- Avoid general statements that obscure important information
- Ensure accuracy and completeness in all material respects`
    };

    return templates[sectionType] || templates.default;
  }

  /**
   * Enhance original response with HKIPO compliance analysis
   */
  private enhanceOriginalResponseWithHKIPO(originalResponse: any, analysis: ProactiveAnalysisResult): EnhancedChatResponse {
    return {
      type: 'CONTENT_UPDATE',
      message: originalResponse.text || originalResponse.message,
      updatedContent: originalResponse.updatedContent,
      proactiveAnalysis: analysis,
      confidence: originalResponse.confidence || 0.8
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
   * Create tabular content response for HKIPO-specific tables
   */
  private async createTabularContentResponse(
    userMessage: string, 
    sectionType: string, 
    currentContent: string, 
    analysis: ProactiveAnalysisResult
  ): Promise<EnhancedChatResponse> {
    const tablePrompt = this.buildHKIPOTablePrompt(userMessage, sectionType, currentContent);
    
    try {
      const response = await simpleAiClient.generateContent({
        prompt: tablePrompt,
        metadata: { requestType: 'hkipo_tabular_content' }
      });
      
      const suggestedContent = this.extractSuggestedContent(response.text);
      
      return {
        type: 'TABULAR_CONTENT',
        message: '✨ **HKIPO-Compliant Table Generated**\n\nI\'ve created a structured table following HKIPO disclosure requirements.',
        updatedContent: suggestedContent?.content || response.text,
        tabularData: this.extractTableData(response.text),
        confidence: suggestedContent?.confidence || 0.85
      };
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  /**
   * Create section structure response for HKIPO organization
   */
  private async createSectionStructureResponse(
    userMessage: string,
    sectionType: string,
    currentContent: string,
    analysis: ProactiveAnalysisResult
  ): Promise<EnhancedChatResponse> {
    const structurePrompt = this.buildHKIPOStructurePrompt(userMessage, sectionType, currentContent);
    
    try {
      const response = await simpleAiClient.generateContent({
        prompt: structurePrompt,
        metadata: { requestType: 'hkipo_section_structure' }
      });
      
      const suggestedContent = this.extractSuggestedContent(response.text);
      
      return {
        type: 'SECTION_STRUCTURE',
        message: '📋 **HKIPO-Compliant Structure Organized**\n\nI\'ve restructured your content following HKIPO organizational principles.',
        updatedContent: suggestedContent?.content || response.text,
        sectionStructure: this.extractStructureData(response.text),
        confidence: suggestedContent?.confidence || 0.85
      };
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  /**
   * Create compliance enhancement response for HKIPO standards
   */
  private async createComplianceEnhancementResponse(
    userMessage: string,
    sectionType: string,
    currentContent: string,
    analysis: ProactiveAnalysisResult
  ): Promise<EnhancedChatResponse> {
    const compliancePrompt = this.buildHKIPOCompliancePrompt(userMessage, sectionType, currentContent);
    
    try {
      const response = await simpleAiClient.generateContent({
        prompt: compliancePrompt,
        metadata: { requestType: 'hkipo_compliance_enhancement' }
      });
      
      const suggestedContent = this.extractSuggestedContent(response.text);
      
      return {
        type: 'COMPLIANCE_ENHANCEMENT',
        message: '✅ **HKIPO Compliance Enhanced**\n\nI\'ve improved your content to meet HKIPO drafting principles and regulatory requirements.',
        updatedContent: suggestedContent?.content || response.text,
        confidence: suggestedContent?.confidence || 0.9
      };
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  /**
   * Build HKIPO table-specific prompt
   */
  private buildHKIPOTablePrompt(userMessage: string, sectionType: string, currentContent: string): string {
    const tableTemplates = this.getHKIPOTableTemplate(sectionType);
    
    return `${this.buildHKIPOEnhancedPrompt(userMessage, sectionType, currentContent)}

**SPECIFIC TABLE REQUIREMENTS:**
${tableTemplates}

Create properly formatted tables with all required columns and representative data that follows HKIPO standards.`;
  }

  /**
   * Build HKIPO structure-specific prompt  
   */
  private buildHKIPOStructurePrompt(userMessage: string, sectionType: string, currentContent: string): string {
    return `${this.buildHKIPOEnhancedPrompt(userMessage, sectionType, currentContent)}

**STRUCTURE ORGANIZATION FOCUS:**
- Use descriptive headers and sub-headers with logical numbering
- Break content into digestible sections
- Apply zoom-in approach (general to specific)
- Group related information together
- Use bullet points and numbered lists for clarity

Reorganize the content with proper HKIPO-compliant structure and clear information hierarchy.`;
  }

  /**
   * Build HKIPO compliance-specific prompt
   */
  private buildHKIPOCompliancePrompt(userMessage: string, sectionType: string, currentContent: string): string {
    return `${this.buildHKIPOEnhancedPrompt(userMessage, sectionType, currentContent)}

**COMPLIANCE ENHANCEMENT FOCUS:**
- Replace general information with specific, material details
- Convert complex language to plain, everyday language  
- Break long sentences into shorter, clearer ones
- Add regulatory citations where appropriate
- Ensure balanced disclosure (include unfavorable information)
- Remove emotional expressions and unsubstantiated claims

Focus specifically on making the content more compliant with HKIPO drafting principles.`;
  }

  /**
   * Get HKIPO table templates by section type
   */
  private getHKIPOTableTemplate(sectionType: string): string {
    const tableTemplates = {
      customers: `
**CUSTOMERS TABLE FORMAT:**
| Rank | Customer Background | Year Commenced | Services Provided | Credit Terms | Revenue (Period 1) | % of Revenue | Revenue (Period 2) | % of Revenue | Revenue (Period 3) | % of Revenue |`,
      
      suppliers: `
**SUPPLIERS TABLE FORMAT:**
| Rank | Supplier Background | Year Commenced | Services/Products | Credit Terms | Purchases (Period 1) | % of Total | Purchases (Period 2) | % of Total | Purchases (Period 3) | % of Total |`,
      
      licences: `
**LICENCES TABLE FORMAT:**
| Holder | Licence/Permit Name | Issuing Authority | Grant Date | Expiry Date | Status |`,
      
      awards: `
**AWARDS TABLE FORMAT:**
| Award Name | Awarding Authority | Year Received | Category | Description |`,
      
      default: `
**GENERAL TABLE FORMAT:**
Use appropriate column headers and ensure all data is specific and material to investors.`
    };
    
    return tableTemplates[sectionType] || tableTemplates.default;
  }

  /**
   * Extract table data from response
   */
  private extractTableData(response: string): any {
    // Extract table structure and data for potential future use
    const tableMatch = response.match(/\|.*\|/g);
    return tableMatch ? { tables: tableMatch } : null;
  }

  /**
   * Extract structure data from response
   */
  private extractStructureData(response: string): any {
    // Extract heading structure for potential future use
    const headings = response.match(/^#+\s+.*/gm);
    return headings ? { headings } : null;
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
