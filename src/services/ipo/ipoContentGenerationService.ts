import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { IPOContentGenerationRequest, IPOContentGenerationResponse, IPOSection, SourceAttribution } from '@/types/ipo';

/**
 * Service for generating high-quality IPO prospectus content using AI
 * Specialized for Hong Kong market requirements and HKEX compliance
 */
export class IPOContentGenerationService {
  
  /**
   * Generate content for a specific prospectus section
   */
  async generateSectionContent(request: IPOContentGenerationRequest): Promise<IPOContentGenerationResponse> {
    try {
      console.log('🚀 Starting IPO content generation for:', request.section_type);
      console.log('📝 Request details:', { 
        projectId: request.project_id, 
        sectionType: request.section_type,
        keyElements: request.key_elements 
      });

      // Get project details for context
      const { data: project, error: projectError } = await supabase
        .from('ipo_prospectus_projects')
        .select('*')
        .eq('id', request.project_id)
        .single();

      if (projectError) {
        console.error('❌ Database error fetching project:', projectError);
        throw new Error(`Database error: ${projectError.message}`);
      }

      if (!project) {
        console.error('❌ Project not found for ID:', request.project_id);
        throw new Error('Project not found');
      }

      console.log('✅ Project found:', project.company_name);

      // Get section template if specified
      let template = null;
      if (request.template_id) {
        const { data: templateData } = await supabase
          .from('ipo_section_templates')
          .select('*')
          .eq('id', request.template_id)
          .single();
        template = templateData;
      } else {
        // Get default template for section type and industry
        const { data: templateData } = await supabase
          .from('ipo_section_templates')
          .select('*')
          .eq('section_type', request.section_type)
          .eq('industry', project.industry || 'general')
          .limit(1)
          .single();
        template = templateData;
      }

      console.log('📋 Template found:', template?.template_name || 'No template');

      // Build comprehensive prompt for content generation
      const prompt = this.buildContentGenerationPrompt(
        project,
        request,
        template,
        request.key_elements
      );

      console.log('📝 Generated prompt length:', prompt.length);

      // Generate content using Grok AI
      console.log('🤖 Calling Grok AI service...');
      const response = await grokService.generateResponse({
        prompt: prompt,
        apiKey: undefined, // Will use stored key
        metadata: {
          projectId: request.project_id,
          sectionType: request.section_type,
          industry: project.industry
        }
      });

      console.log('✅ Grok AI response received, length:', response.text?.length || 0);
      console.log('📄 Response preview:', response.text?.substring(0, 200) + '...');

      if (!response.text || response.text.trim().length === 0) {
        throw new Error('Empty response from AI service');
      }

      // Parse the generated content and extract quality metrics
      console.log('📊 Analyzing generated content...');
      const contentAnalysis = this.analyzeGeneratedContent(response.text);
      console.log('✅ Content analysis complete:', {
        contentLength: contentAnalysis.content.length,
        confidence: contentAnalysis.confidence
      });

      // Create source attributions
      const sources = this.createSourceAttributions(response, template);
      console.log('📚 Source attributions created:', sources.length);

      const result = {
        content: contentAnalysis.content,
        sources,
        confidence_score: contentAnalysis.confidence,
        regulatory_compliance: {
          requirements_met: contentAnalysis.requirementsMet,
          missing_requirements: contentAnalysis.missingRequirements,
          recommendations: contentAnalysis.recommendations
        },
        quality_metrics: {
          completeness: contentAnalysis.completeness,
          accuracy: contentAnalysis.accuracy,
          regulatory_alignment: contentAnalysis.regulatoryAlignment,
          professional_language: contentAnalysis.professionalLanguage
        }
      };

      console.log('🎉 Content generation completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Error generating IPO content:', error);
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack,
        request: request
      });
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * Load existing section content from database
   */
  async loadSectionContent(projectId: string, sectionType: string): Promise<IPOSection | null> {
    try {
      console.log('🔍 Loading existing content for:', { projectId, sectionType });

      const { data: section, error } = await supabase
        .from('ipo_prospectus_sections')
        .select(`
          *,
          ipo_source_attribution (
            id,
            content_snippet,
            source_type,
            source_reference,
            confidence_score,
            created_at
          )
        `)
        .eq('project_id', projectId)
        .eq('section_type', sectionType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No content found - this is normal for new sections
          console.log('📝 No existing content found for section');
          return null;
        }
        throw error;
      }

      console.log('✅ Existing content loaded:', {
        contentLength: section.content?.length || 0,
        sourcesCount: section.ipo_source_attribution?.length || 0
      });

      // Transform the data to match our expected format
      const transformedSources = (section.ipo_source_attribution || []).map(source => ({
        ...source,
        section_id: section.id
      }));

      return {
        ...section,
        sources: transformedSources
      } as IPOSection;

    } catch (error) {
      console.error('❌ Error loading section content:', error);
      throw new Error(`Failed to load content: ${error.message}`);
    }
  }

  /**
   * Save generated content to database
   */
  async saveSectionContent(
    projectId: string,
    sectionType: string,
    generatedContent: IPOContentGenerationResponse
  ): Promise<IPOSection> {
    try {
      // Create or update the section
      const { data: section, error } = await supabase
        .from('ipo_prospectus_sections')
        .upsert({
          project_id: projectId,
          section_type: sectionType,
          title: this.getSectionTitle(sectionType),
          content: generatedContent.content,
          sources: generatedContent.sources as any, // JSON field
          confidence_score: generatedContent.confidence_score,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Save source attributions
      if (generatedContent.sources.length > 0) {
        await supabase
          .from('ipo_source_attribution')
          .insert(
            generatedContent.sources.map(source => ({
              section_id: section.id,
              content_snippet: source.content_snippet,
              source_type: source.source_type,
              source_reference: source.source_reference,
              confidence_score: source.confidence_score
            }))
          );
      }

      return {
        ...section,
        sources: generatedContent.sources
      } as IPOSection;
    } catch (error) {
      console.error('Error saving section content:', error);
      throw new Error(`Failed to save content: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for content generation
   */
  private buildContentGenerationPrompt(
    project: any,
    request: IPOContentGenerationRequest,
    template: any,
    keyElements?: Record<string, any>
  ): string {
    const sectionTitle = this.getSectionTitle(request.section_type);
    
    return `
You are an expert Hong Kong investment banking professional specializing in IPO prospectus drafting. Generate high-quality, professional content for the "${sectionTitle}" section of an IPO prospectus.

**COMPANY INFORMATION:**
- Company: ${project.company_name}
- Industry: ${project.industry || 'Not specified'}
- Project: ${project.project_name}

**SECTION REQUIREMENTS:**
${template ? `
Template Requirements: ${JSON.stringify(template.template_content, null, 2)}
Regulatory Requirements: ${template.regulatory_requirements?.join(', ') || 'Standard HKEX requirements'}
` : 'Standard HKEX Main Board Listing Requirements'}

**KEY ELEMENTS PROVIDED:**
${keyElements ? JSON.stringify(keyElements, null, 2) : 'None provided - use professional judgment'}

**REGULATORY COMPLIANCE:**
- Must comply with HKEX Main Board Listing Rules
- Follow App1A Part A paragraph requirements
- Include all mandatory disclosures
- Use professional investment banking language
- Ensure accuracy and completeness

**CONTENT REQUIREMENTS:**
1. Write in professional, formal investment banking style
2. Include specific details and quantitative information where possible
3. Ensure regulatory compliance with HKEX requirements
4. Use clear, structured paragraphs
5. Include relevant business context and market positioning
6. Maintain consistency with IPO prospectus standards

Generate comprehensive, high-quality content that meets investment banking standards for Hong Kong IPO prospectuses.`;
  }

  /**
   * Analyze generated content for quality metrics
   */
  private analyzeGeneratedContent(content: string) {
    // Basic content analysis - in production this would be more sophisticated
    const wordCount = content.split(' ').length;
    const hasStructure = content.includes('\n\n') || content.includes('•') || content.includes('-');
    const hasFinancialTerms = /revenue|profit|growth|market|business|operations/i.test(content);
    
    return {
      content,
      confidence: Math.min(0.9, wordCount / 500), // Higher confidence for longer content
      completeness: wordCount > 200 ? 0.8 : 0.5,
      accuracy: 0.85, // Would be determined by regulatory validation in production
      regulatoryAlignment: hasFinancialTerms ? 0.8 : 0.6,
      professionalLanguage: hasStructure ? 0.85 : 0.7,
      requirementsMet: ['Business description', 'Professional language'],
      missingRequirements: wordCount < 300 ? ['More detailed content needed'] : [],
      recommendations: wordCount < 200 ? ['Consider adding more specific business details'] : []
    };
  }

  /**
   * Create source attributions for generated content
   */
  private createSourceAttributions(response: any, template: any): SourceAttribution[] {
    const sources: SourceAttribution[] = [];

    // Add AI generation source
    sources.push({
      id: `ai-${Date.now()}`,
      section_id: '', // Will be set when saving
      content_snippet: response.text.substring(0, 200) + '...',
      source_type: 'ai_generated',
      source_reference: 'Grok AI - Hong Kong Financial Expert',
      confidence_score: 0.85,
      created_at: new Date().toISOString()
    });

    // Add template source if used
    if (template) {
      sources.push({
        id: `template-${Date.now()}`,
        section_id: '',
        content_snippet: 'HKEX compliant section template',
        source_type: 'template',
        source_reference: template.template_name,
        confidence_score: 0.95,
        created_at: new Date().toISOString()
      });
    }

    return sources;
  }

  /**
   * Get section title based on section type
   */
  private getSectionTitle(sectionType: string): string {
    const titles = {
      'overview': 'Business Overview',
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

export const ipoContentGenerationService = new IPOContentGenerationService();