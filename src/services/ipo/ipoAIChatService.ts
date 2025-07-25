import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { contextService } from '@/services/regulatory/contextService';
import { ipoMessageFormatter } from './ipoMessageFormatter';
import { commandProcessor, CommandAnalysis } from './commandProcessor';

interface SourceReference {
  type: 'regulation' | 'template' | 'guidance' | 'faq';
  title: string;
  content: string;
  reference: string;
  confidence: number;
}

interface IPOChatResponse {
  type: 'CONTENT_UPDATE' | 'PARTIAL_UPDATE' | 'DRAFT_SUGGESTION' | 'COMPLIANCE_CHECK' | 'STRUCTURE_GUIDANCE' | 'GUIDANCE' | 'SOURCE_REFERENCE' | 'SUGGESTION';
  message: string;
  updatedContent?: string;
  partialUpdate?: {
    searchText: string;
    replaceWith: string;
  };
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
      console.log('🟡 IPO Chat Service: Entry point reached');
      console.log('🟡 Input validation:', { 
        hasUserMessage: !!userMessage?.trim(), 
        hasProjectId: !!projectId, 
        hasSectionType: !!sectionType 
      });
      
      // Validate inputs
      if (!userMessage?.trim()) {
        console.error('❌ Validation failed: User message is empty');
        throw new Error('User message is required');
      }
      if (!projectId) {
        console.error('❌ Validation failed: Project ID is missing');
        throw new Error('Project ID is required');
      }
      if (!sectionType) {
        console.error('❌ Validation failed: Section type is missing');
        throw new Error('Section type is required');
      }

      console.log('✅ Input validation passed');
      
      // Check if Grok API key is available
      console.log('🟡 Checking API key availability...');
      const hasKey = grokService.hasApiKey();
      console.log('🟡 API key check result:', hasKey);
      
      if (!hasKey) {
        console.warn('⚠️ IPO Chat: No Grok API key available');
        return this.createFallbackResponse('Please configure your API key in the settings to use the AI chat feature.');
      }

      // Generate cache key with better uniqueness
      const cacheKey = this.generateCacheKey(userMessage, projectId, sectionType, currentContent);
      
      // Check cache first
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        console.log('IPO Chat: Using cached response');
        return cachedResponse;
      }

      console.log('IPO Chat: Getting regulatory context...');
      // Get regulatory context for the message with error handling
      const regulatoryContext = await this.getRegulatoryContext(userMessage, sectionType);
      
      console.log('IPO Chat: Getting section guidance...');
      // Get section-specific templates and guidance with error handling
      const sectionGuidance = await this.getSectionGuidance(sectionType, projectId);
      
      console.log('IPO Chat: Analyzing command...');
      // Analyze user command for intent and targets
      const commandAnalysis = commandProcessor.analyzeCommand(userMessage);
      console.log('IPO Chat: Command analysis:', commandAnalysis);
      
      console.log('IPO Chat: Building enhanced prompt...');
      // Build enhanced prompt with command analysis and sources
      const prompt = this.buildEnhancedPrompt(
        userMessage,
        sectionType,
        currentContent,
        regulatoryContext,
        sectionGuidance,
        commandAnalysis
      );

      console.log('IPO Chat: Generating response via Grok...');
      // Generate response using Grok with enhanced error handling
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          projectId,
          sectionType,
          requestType: 'ipo_chat_assistance',
          useAdvancedModel: true
        }
      });

      if (!response?.text) {
        throw new Error('No response received from AI service');
      }

      console.log('IPO Chat: Parsing response...');
      // Parse enhanced response
      const parsedResponse = this.parseEnhancedResponse(response.text, currentContent, regulatoryContext.sources);
      
      // Cache the response
      this.setCache(cacheKey, parsedResponse);
      
      console.log('IPO Chat: Response processed successfully');
      return parsedResponse;

    } catch (error) {
      console.error('🚨 IPO CHAT SERVICE ERROR - DETAILED ANALYSIS:');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Input params:', { userMessage, projectId, sectionType });
      console.error('API key available:', !!grokService.hasApiKey());
      
      // Log the exact step where it failed
      if (error?.message?.includes('Project ID')) {
        console.error('❌ FAILURE: Missing or invalid project ID');
      } else if (error?.message?.includes('API key')) {
        console.error('❌ FAILURE: API key configuration issue');
      } else if (error?.message?.includes('timeout')) {
        console.error('❌ FAILURE: Service timeout (likely contextService or grokService)');
      } else if (error?.message?.includes('network')) {
        console.error('❌ FAILURE: Network connectivity issue');
      } else if (error?.message?.includes('database') || error?.message?.includes('supabase')) {
        console.error('❌ FAILURE: Database query issue');
      } else {
        console.error('❌ FAILURE: Unknown error - investigating service chain...');
        console.error('Available services check:');
        console.error('- grokService available:', typeof grokService);
        console.error('- contextService available:', typeof contextService);
        console.error('- supabase available:', typeof supabase);
      }
      
      // Return user-friendly error response with more specificity
      return this.createErrorResponse(error);
    }
  }

  /**
   * Get regulatory context from database sources
   */
  private async getRegulatoryContext(userMessage: string, sectionType: string) {
    const sources: SourceReference[] = [];
    
    try {
      console.log('IPO Chat: Fetching regulatory documents...');
      
      // Get relevant listing rules and guidance
      const { data: listingDocs, error: docsError } = await supabase
        .from('mb_listingrule_documents')
        .select('title, description, file_url')
        .ilike('title', '%prospectus%')
        .limit(3);

      if (docsError) {
        console.warn('Error fetching listing documents:', docsError);
      } else if (listingDocs && listingDocs.length > 0) {
        sources.push(...listingDocs.map(doc => ({
          type: 'regulation' as const,
          title: doc.title || 'Untitled Document',
          content: doc.description || 'No description available',
          reference: doc.file_url || 'No URL available',
          confidence: 0.9
        })));
        console.log(`IPO Chat: Found ${listingDocs.length} regulatory documents`);
      }

      // Get relevant FAQs with better error handling
      console.log('IPO Chat: Fetching relevant FAQs...');
      const searchTerm = userMessage.split(' ')[0] || 'general';
      const { data: faqs, error: faqsError } = await supabase
        .from('listingrule_listed_faq')
        .select('category, particulars, listingrules')
        .or(`particulars.ilike.%${searchTerm}%,category.ilike.%prospectus%`)
        .limit(2);

      if (faqsError) {
        console.warn('Error fetching FAQs:', faqsError);
      } else if (faqs && faqs.length > 0) {
        sources.push(...faqs.map(faq => ({
          type: 'faq' as const,
          title: faq.category || 'General FAQ',
          content: faq.particulars || 'No details available',
          reference: faq.listingrules || 'HKEX Listing Rules',
          confidence: 0.8
        })));
        console.log(`IPO Chat: Found ${faqs.length} relevant FAQs`);
      }

      // Get Grok's regulatory context with timeout and error handling
      console.log('IPO Chat: Getting contextual regulatory information...');
      let grokContext = '';
      try {
        grokContext = await Promise.race([
          contextService.getRegulatoryContext(
            `Hong Kong IPO prospectus ${sectionType}: ${userMessage}`,
            { isPreliminaryAssessment: false }
          ),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Context service timeout')), 10000)
          )
        ]);
      } catch (contextError) {
        console.warn('Error getting Grok context, continuing without it:', contextError);
        grokContext = '';
      }

      console.log(`IPO Chat: Regulatory context prepared with ${sources.length} sources`);
      return {
        context: grokContext,
        sources
      };
    } catch (error) {
      console.error('Error getting regulatory context:', error);
      return { 
        context: 'Unable to fetch regulatory context at this time.', 
        sources: [] 
      };
    }
  }

  /**
   * Get section-specific guidance and templates
   */
  private async getSectionGuidance(sectionType: string, projectId: string) {
    try {
      console.log('IPO Chat: Getting project details...');
      
      // Get project details with error handling
      const { data: project, error: projectError } = await supabase
        .from('ipo_prospectus_projects')
        .select('industry, company_name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.warn('Error fetching project details:', projectError);
      }

      console.log('IPO Chat: Getting section templates...');
      
      // Get section template with fallback logic
      let template = null;
      const industry = project?.industry || 'general';
      
      // Try industry-specific template first
      const { data: industryTemplate, error: templateError } = await supabase
        .from('ipo_section_templates')
        .select('template_name, template_content, regulatory_requirements, sample_content')
        .eq('section_type', sectionType)
        .eq('industry', industry)
        .limit(1)
        .maybeSingle();

      if (!templateError && industryTemplate) {
        template = industryTemplate;
        console.log(`IPO Chat: Found industry-specific template for ${industry}`);
      } else {
        // Fallback to general template
        console.log('IPO Chat: Falling back to general template...');
        const { data: generalTemplate } = await supabase
          .from('ipo_section_templates')
          .select('template_name, template_content, regulatory_requirements, sample_content')
          .eq('section_type', sectionType)
          .eq('industry', 'general')
          .limit(1)
          .maybeSingle();
        
        template = generalTemplate;
      }

      return {
        project,
        template,
        industryContext: industry
      };
    } catch (error) {
      console.error('Error getting section guidance:', error);
      return { 
        project: null, 
        template: null, 
        industryContext: 'general' 
      };
    }
  }

  /**
   * Build enhanced prompt with regulatory context and sources - DRAFT-FOCUSED
   */
  private buildEnhancedPrompt(
    userMessage: string,
    sectionType: string,
    currentContent: string,
    regulatoryContext: any,
    sectionGuidance: any,
    commandAnalysis: CommandAnalysis
  ): string {
    const sectionTitle = this.getSectionTitle(sectionType);
    
    // Generate command-specific guidance
    const commandGuidance = commandProcessor.generateEnhancedPrompt(
      commandAnalysis, 
      currentContent, 
      sectionType
    );
    
    return `
You are an expert Hong Kong IPO prospectus drafting AI assistant. Your primary role is to ACTIVELY HELP USERS DRAFT AND IMPROVE their IPO prospectus content through specific, actionable assistance.

**CURRENT DRAFT SECTION: ${sectionTitle}**
**CURRENT CONTENT LENGTH: ${currentContent?.length || 0} characters**

**COMMAND ANALYSIS:**
Intent: ${commandAnalysis.intent}
Targets: ${commandAnalysis.targets.join(', ') || 'General content'}
Modifiers: ${commandAnalysis.modifiers.join(', ') || 'Standard approach'}
Confidence: ${Math.round(commandAnalysis.confidence * 100)}%

**COMMAND-SPECIFIC GUIDANCE:**
${commandGuidance}

**EXISTING DRAFT:**
${currentContent || '⚠️ NO CONTENT YET - Ready to start drafting from scratch.'}

**USER REQUEST:**
${userMessage}

**REGULATORY CONTEXT & SOURCES:**
${regulatoryContext.context}

**AVAILABLE REGULATORY SOURCES:**
${regulatoryContext.sources.map(source => 
  `- ${source.type.toUpperCase()}: ${source.title}\n  Content: ${source.content.substring(0, 200)}...\n  Reference: ${source.reference}`
).join('\n')}

**SECTION REQUIREMENTS:**
${sectionGuidance.template ? `
Template: ${sectionGuidance.template.template_name}
Requirements: ${JSON.stringify(sectionGuidance.template.regulatory_requirements)}
Sample Content: ${sectionGuidance.template.sample_content?.substring(0, 300)}...
` : 'Using standard HKEX requirements'}

**COMPANY CONTEXT:**
Industry: ${sectionGuidance.industryContext}
Company: ${sectionGuidance.project?.company_name || 'Not specified'}

**RESPONSE TYPES - BE ACTIONABLE:**

1. **CONTENT_UPDATE:** For content improvements/additions (PREFERRED for drafting)
   Format: "CONTENT_UPDATE: [complete improved section content]"
   Use when: User wants content written, improved, or expanded

2. **PARTIAL_UPDATE:** For specific paragraph/section improvements
   Format: "PARTIAL_UPDATE: REPLACE '[existing text snippet]' WITH '[new text]'"
   Use when: User wants specific parts modified

3. **DRAFT_SUGGESTION:** For multiple specific drafting recommendations
   Format: "DRAFT_SUGGESTION: 1. Add [specific content]... 2. Improve [specific area]..."
   Use when: User wants suggestions they can apply themselves

4. **COMPLIANCE_CHECK:** For regulatory compliance analysis
   Format: "COMPLIANCE_CHECK: [analysis with specific fixes needed]"
   Use when: User wants compliance validation

5. **STRUCTURE_GUIDANCE:** For section organization and flow
   Format: "STRUCTURE_GUIDANCE: [recommended structure with content outline]"
   Use when: User needs help organizing content

**DRAFTING PRIORITIES:**
✅ ALWAYS provide concrete, implementable suggestions
✅ Write in professional investment banking language
✅ Ensure HKEX Main Board compliance (App1A Part A)
✅ Include specific regulatory references
✅ Consider industry-specific requirements
✅ Make content ready-to-use in prospectus
✅ Focus on ACTIONABLE improvements user can apply immediately

**KEY COMPLIANCE AREAS:**
- App1A Part A disclosure requirements
- HKEX Listing Rules Chapter 9 (continuing obligations)
- Chapter 14 (notifiable transactions if relevant)
- Chapter 17 (financial services if relevant)
- SFC codes and guidelines

**RESPONSE APPROACH:**
Be DIRECTIVE and HELPFUL. Don't just give advice - provide actual content improvements, specific text suggestions, and ready-to-implement solutions. Focus on making the user's draft better through concrete actions.

Respond with the most actionable assistance to improve their IPO prospectus draft.`;
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
        message: ipoMessageFormatter.formatMessage('I\'ve updated your content based on your request and regulatory requirements. The changes incorporate HKEX compliance standards.'),
        updatedContent,
        sources,
        confidence
      };
    }
    
    if (aiText.startsWith('PARTIAL_UPDATE:')) {
      const updateText = aiText.replace('PARTIAL_UPDATE:', '').trim();
      const match = updateText.match(/REPLACE '(.+?)' WITH '(.+?)'/s);
      if (match) {
        return {
          type: 'PARTIAL_UPDATE',
          message: ipoMessageFormatter.formatMessage('I can help you make this specific improvement to your content.'),
          partialUpdate: {
            searchText: match[1],
            replaceWith: match[2]
          },
          sources,
          confidence
        };
      }
    }
    
    if (aiText.startsWith('DRAFT_SUGGESTION:')) {
      const suggestions = this.extractSuggestions(aiText.replace('DRAFT_SUGGESTION:', '').trim());
      return {
        type: 'DRAFT_SUGGESTION',
        message: ipoMessageFormatter.formatMessage(aiText.replace('DRAFT_SUGGESTION:', '').trim()),
        sources,
        suggestions,
        confidence
      };
    }
    
    if (aiText.startsWith('STRUCTURE_GUIDANCE:')) {
      return {
        type: 'STRUCTURE_GUIDANCE',
        message: ipoMessageFormatter.formatMessage(aiText.replace('STRUCTURE_GUIDANCE:', '').trim()),
        sources,
        confidence
      };
    }
    
    if (aiText.startsWith('COMPLIANCE_CHECK:')) {
      const analysis = aiText.replace('COMPLIANCE_CHECK:', '').trim();
      const complianceIssues = this.extractComplianceIssues(analysis);
      return {
        type: 'COMPLIANCE_CHECK',
        message: ipoMessageFormatter.formatMessage(analysis),
        sources,
        complianceIssues,
        confidence
      };
    }
    
    if (aiText.startsWith('SOURCE_REFERENCE:')) {
      return {
        type: 'SOURCE_REFERENCE',
        message: ipoMessageFormatter.formatMessage(aiText.replace('SOURCE_REFERENCE:', '').trim()),
        sources,
        confidence
      };
    }
    
    if (aiText.startsWith('SUGGESTION:')) {
      const suggestions = this.extractSuggestions(aiText.replace('SUGGESTION:', '').trim());
      return {
        type: 'SUGGESTION',
        message: ipoMessageFormatter.formatMessage(aiText.replace('SUGGESTION:', '').trim()),
        sources,
        suggestions,
        confidence
      };
    }
    
    if (aiText.startsWith('GUIDANCE:')) {
      return {
        type: 'GUIDANCE',
        message: ipoMessageFormatter.formatMessage(aiText.replace('GUIDANCE:', '').trim()),
        sources,
        confidence
      };
    }
    
    // Default case - treat as guidance
    return {
      type: 'GUIDANCE',
      message: ipoMessageFormatter.formatMessage(aiText),
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

  /**
   * Create fallback response when API key is missing
   */
  private createFallbackResponse(message: string): IPOChatResponse {
    return {
      type: 'GUIDANCE',
      message,
      sources: [],
      confidence: 0.5
    };
  }

  /**
   * Create error response for failed requests
   */
  private createErrorResponse(error: any): IPOChatResponse {
    const isApiKeyError = error?.message?.toLowerCase().includes('api key') || 
                         error?.message?.toLowerCase().includes('unauthorized');
    
    let message = '';
    if (isApiKeyError) {
      message = 'Please check your API key configuration. Go to settings to verify your Grok API key is correctly set up.';
    } else if (error?.message?.includes('timeout')) {
      message = 'The request timed out. Please try again with a shorter message or check your internet connection.';
    } else if (error?.message?.includes('network')) {
      message = 'Network error occurred. Please check your internet connection and try again.';
    } else {
      message = 'I encountered an issue processing your request. Please try rephrasing your question or try again in a moment.';
    }

    return {
      type: 'GUIDANCE',
      message,
      sources: [],
      confidence: 0.1
    };
  }
}

export const ipoAIChatService = new IPOAIChatService();