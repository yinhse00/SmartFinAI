import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { contextService } from '@/services/regulatory/contextService';

interface SourceReference {
  type: 'regulation' | 'template' | 'guidance' | 'faq';
  title: string;
  content: string;
  reference: string;
  confidence: number;
}

interface IPOChatResponse {
  type: 'CONTENT_UPDATE' | 'GUIDANCE' | 'COMPLIANCE_CHECK' | 'SOURCE_REFERENCE' | 'SUGGESTION';
  message: string;
  updatedContent?: string;
  sources: SourceReference[];
  complianceIssues?: string[];
  suggestions?: string[];
  confidence: number;
}

/**
 * Enhanced IPO AI Chat Service with regulatory source integration
 * Provides intelligent content assistance with HKEX compliance
 */
export class IPOAIChatService {
  private cachePrefix = 'ipo_chat_';
  private cacheTimeout = 300000; // 5 minutes

  /**
   * Process user message with enhanced context and source integration
   */
  async processMessage(
    userMessage: string,
    projectId: string,
    sectionType: string,
    currentContent: string
  ): Promise<IPOChatResponse> {
    try {
      // Generate cache key with better uniqueness
      const cacheKey = this.generateCacheKey(userMessage, projectId, sectionType, currentContent);
      
      // Check cache first
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Get regulatory context for the message
      const regulatoryContext = await this.getRegulatoryContext(userMessage, sectionType);
      
      // Get section-specific templates and guidance
      const sectionGuidance = await this.getSectionGuidance(sectionType, projectId);
      
      // Build enhanced prompt with sources
      const prompt = this.buildEnhancedPrompt(
        userMessage,
        sectionType,
        currentContent,
        regulatoryContext,
        sectionGuidance
      );

      // Generate response using Grok
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          projectId,
          sectionType,
          requestType: 'ipo_chat_assistance',
          useAdvancedModel: true
        }
      });

      // Parse enhanced response
      const parsedResponse = this.parseEnhancedResponse(response.text, currentContent, regulatoryContext.sources);
      
      // Cache the response
      this.setCache(cacheKey, parsedResponse);
      
      return parsedResponse;

    } catch (error) {
      console.error('Error in IPO chat service:', error);
      throw new Error(`Chat processing failed: ${error.message}`);
    }
  }

  /**
   * Get regulatory context from database sources
   */
  private async getRegulatoryContext(userMessage: string, sectionType: string) {
    const sources: SourceReference[] = [];
    
    try {
      // Get relevant listing rules and guidance
      const { data: listingDocs } = await supabase
        .from('mb_listingrule_documents')
        .select('title, description, file_url')
        .ilike('title', '%prospectus%')
        .limit(3);

      if (listingDocs) {
        sources.push(...listingDocs.map(doc => ({
          type: 'regulation' as const,
          title: doc.title,
          content: doc.description || '',
          reference: doc.file_url,
          confidence: 0.9
        })));
      }

      // Get relevant FAQs
      const { data: faqs } = await supabase
        .from('listingrule_listed_faq')
        .select('category, particulars, listingrules')
        .or(`particulars.ilike.%${userMessage.split(' ')[0]}%,category.ilike.%prospectus%`)
        .limit(2);

      if (faqs) {
        sources.push(...faqs.map(faq => ({
          type: 'faq' as const,
          title: faq.category,
          content: faq.particulars,
          reference: faq.listingrules || 'HKEX Listing Rules',
          confidence: 0.8
        })));
      }

      // Get Grok's regulatory context
      const grokContext = await contextService.getRegulatoryContext(
        `Hong Kong IPO prospectus ${sectionType}: ${userMessage}`,
        { isPreliminaryAssessment: false }
      );

      return {
        context: grokContext,
        sources
      };
    } catch (error) {
      console.error('Error getting regulatory context:', error);
      return { context: '', sources: [] };
    }
  }

  /**
   * Get section-specific guidance and templates
   */
  private async getSectionGuidance(sectionType: string, projectId: string) {
    try {
      // Get project details
      const { data: project } = await supabase
        .from('ipo_prospectus_projects')
        .select('industry, company_name')
        .eq('id', projectId)
        .single();

      // Get section template
      const { data: template } = await supabase
        .from('ipo_section_templates')
        .select('template_name, template_content, regulatory_requirements, sample_content')
        .eq('section_type', sectionType)
        .eq('industry', project?.industry || 'general')
        .limit(1)
        .single();

      return {
        project,
        template,
        industryContext: project?.industry || 'general'
      };
    } catch (error) {
      console.error('Error getting section guidance:', error);
      return { project: null, template: null, industryContext: 'general' };
    }
  }

  /**
   * Build enhanced prompt with regulatory context and sources
   */
  private buildEnhancedPrompt(
    userMessage: string,
    sectionType: string,
    currentContent: string,
    regulatoryContext: any,
    sectionGuidance: any
  ): string {
    const sectionTitle = this.getSectionTitle(sectionType);
    
    return `
You are an expert Hong Kong IPO prospectus drafting specialist with deep HKEX regulatory knowledge. You are assisting with the "${sectionTitle}" section of an IPO prospectus.

**CURRENT SECTION CONTENT:**
${currentContent || 'No content yet - starting from scratch.'}

**USER REQUEST:**
${userMessage}

**REGULATORY CONTEXT & SOURCES:**
${regulatoryContext.context}

**AVAILABLE REGULATORY SOURCES:**
${regulatoryContext.sources.map(source => 
  `- ${source.type.toUpperCase()}: ${source.title}\n  Content: ${source.content.substring(0, 200)}...\n  Reference: ${source.reference}`
).join('\n')}

**SECTION TEMPLATE GUIDANCE:**
${sectionGuidance.template ? `
Template: ${sectionGuidance.template.template_name}
Requirements: ${JSON.stringify(sectionGuidance.template.regulatory_requirements)}
Sample Content: ${sectionGuidance.template.sample_content?.substring(0, 300)}...
` : 'Using standard HKEX requirements'}

**COMPANY CONTEXT:**
Industry: ${sectionGuidance.industryContext}
Company: ${sectionGuidance.project?.company_name || 'Not specified'}

**RESPONSE INSTRUCTIONS:**
Choose the most appropriate response type:

1. **CONTENT_UPDATE:** Use when user wants to modify/improve the current content
   Format: "CONTENT_UPDATE: [new complete content]"

2. **GUIDANCE:** Use for advice, explanations, or recommendations
   Format: "GUIDANCE: [your advice]"

3. **COMPLIANCE_CHECK:** Use when reviewing compliance issues
   Format: "COMPLIANCE_CHECK: [compliance analysis]"

4. **SOURCE_REFERENCE:** Use when providing specific regulatory references
   Format: "SOURCE_REFERENCE: [specific regulation/rule citations]"

5. **SUGGESTION:** Use for multiple improvement suggestions
   Format: "SUGGESTION: [numbered list of suggestions]"

**QUALITY REQUIREMENTS:**
- Maintain professional investment banking language
- Ensure HKEX Main Board compliance
- Include specific regulatory references where relevant
- Consider industry-specific requirements
- Provide actionable, detailed guidance
- Reference sources from the regulatory context when applicable

**COMPLIANCE FOCUS AREAS:**
- App1A Part A requirements
- HKEX Listing Rules Chapter 9 (for continuing obligations)
- Chapter 14 (if transaction-related)
- Chapter 17 (if financial services)
- SFC codes and guidelines

Respond with the most helpful and accurate assistance based on the user's request and available regulatory sources.`;
  }

  /**
   * Parse enhanced AI response with multiple response types
   */
  private parseEnhancedResponse(aiText: string, originalContent: string, sources: SourceReference[]): IPOChatResponse {
    const confidence = this.calculateConfidence(aiText, sources);
    
    if (aiText.startsWith('CONTENT_UPDATE:')) {
      const updatedContent = aiText.replace('CONTENT_UPDATE:', '').trim();
      return {
        type: 'CONTENT_UPDATE',
        message: 'I\'ve updated your content based on your request and regulatory requirements. The changes incorporate HKEX compliance standards.',
        updatedContent,
        sources,
        confidence
      };
    }
    
    if (aiText.startsWith('COMPLIANCE_CHECK:')) {
      const analysis = aiText.replace('COMPLIANCE_CHECK:', '').trim();
      const complianceIssues = this.extractComplianceIssues(analysis);
      return {
        type: 'COMPLIANCE_CHECK',
        message: analysis,
        sources,
        complianceIssues,
        confidence
      };
    }
    
    if (aiText.startsWith('SOURCE_REFERENCE:')) {
      return {
        type: 'SOURCE_REFERENCE',
        message: aiText.replace('SOURCE_REFERENCE:', '').trim(),
        sources,
        confidence
      };
    }
    
    if (aiText.startsWith('SUGGESTION:')) {
      const suggestions = this.extractSuggestions(aiText.replace('SUGGESTION:', '').trim());
      return {
        type: 'SUGGESTION',
        message: aiText.replace('SUGGESTION:', '').trim(),
        sources,
        suggestions,
        confidence
      };
    }
    
    if (aiText.startsWith('GUIDANCE:')) {
      return {
        type: 'GUIDANCE',
        message: aiText.replace('GUIDANCE:', '').trim(),
        sources,
        confidence
      };
    }
    
    // Default case - treat as guidance
    return {
      type: 'GUIDANCE',
      message: aiText,
      sources,
      confidence
    };
  }

  /**
   * Calculate confidence score based on response quality and sources
   */
  private calculateConfidence(aiText: string, sources: SourceReference[]): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence if sources are referenced
    if (sources.length > 0) confidence += 0.1;
    
    // Increase confidence for longer, detailed responses
    if (aiText.length > 500) confidence += 0.1;
    
    // Increase confidence if regulatory terms are mentioned
    const regulatoryTerms = ['HKEX', 'App1A', 'Listing Rules', 'SFC', 'prospectus'];
    const mentionedTerms = regulatoryTerms.filter(term => 
      aiText.toLowerCase().includes(term.toLowerCase())
    );
    confidence += mentionedTerms.length * 0.02;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Extract compliance issues from analysis
   */
  private extractComplianceIssues(analysis: string): string[] {
    const issues: string[] = [];
    const lines = analysis.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('missing') || 
          line.toLowerCase().includes('required') || 
          line.toLowerCase().includes('must include')) {
        issues.push(line.trim());
      }
    });
    
    return issues;
  }

  /**
   * Extract suggestions from response
   */
  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        suggestions.push(trimmed);
      }
    });
    
    return suggestions;
  }

  /**
   * Generate improved cache key
   */
  private generateCacheKey(userMessage: string, projectId: string, sectionType: string, currentContent: string): string {
    const messageHash = btoa(userMessage).substring(0, 20);
    const contentHash = btoa(currentContent || '').substring(0, 10);
    return `${this.cachePrefix}${projectId}_${sectionType}_${messageHash}_${contentHash}`;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): IPOChatResponse | null {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheTimeout) {
          return data;
        }
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  private setCache(key: string, data: IPOChatResponse): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Get section title
   */
  private getSectionTitle(sectionType: string): string {
    const titles = {
      'business': 'Business Overview',
      'history': 'History & Development',
      'products': 'Products & Services',
      'strengths': 'Competitive Strengths',
      'strategy': 'Business Strategy',
      'financial_summary': 'Financial Summary',
      'risk_factors': 'Risk Factors'
    };
    return titles[sectionType] || 'Business Section';
  }
}

export const ipoAIChatService = new IPOAIChatService();