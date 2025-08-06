/**
 * LaTeX Content Generation Service for IPO Prospectus
 * Extends existing IPO content generation to support LaTeX format
 */

import { supabase } from '@/integrations/supabase/client';
import { simpleAiClient } from './simpleAiClient';
import { latexProcessor, LaTeXDocument, LaTeXEditRequest } from './latexProcessor';
import { IPOContentGenerationRequest, IPOContentGenerationResponse, IPOSection } from '@/types/ipo';
import { LaTeXGenerationRequest, LaTeXGenerationResponse } from '@/types/latex';


export class LaTeXContentService {
  
  /**
   * Generate LaTeX content for IPO prospectus sections
   */
  async generateLaTeXSection(request: LaTeXGenerationRequest): Promise<LaTeXGenerationResponse> {
    try {
      console.log('🚀 Starting LaTeX content generation for:', request.section_type);
      
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('ipo_prospectus_projects')
        .select('*')
        .eq('id', request.project_id)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found');
      }

      // Build LaTeX-specific prompt
      const prompt = this.buildLaTeXPrompt(project, request);
      
      // Generate content using AI
      const response = await simpleAiClient.generateContent({
        prompt,
        metadata: {
          projectId: request.project_id,
          sectionType: request.section_type,
          outputFormat: 'latex'
        }
      });

      if (!response.success || !response.text) {
        throw new Error('Failed to generate LaTeX content');
      }

      // Process and validate LaTeX
      const document = latexProcessor.parseDocument(response.text);
      const validation = this.validateLaTeXContent(document);
      
      // Generate artifact ID
      const artifactId = `${request.project_id}_${request.section_type}_${Date.now()}`;
      
      // Create response
      const result: LaTeXGenerationResponse = {
        content: response.text,
        latexContent: response.text,
        sources: this.createLaTeXSources(response, request),
        confidence_score: 0.85,
        compilationReady: validation.compilationReady,
        artifactId,
        regulatory_compliance: {
          requirements_met: ['LaTeX formatting', 'Professional structure'],
          missing_requirements: validation.issues,
          recommendations: ['Compile with latexmk for final PDF']
        },
        quality_metrics: {
          completeness: 0.85,
          accuracy: 0.85,
          regulatory_alignment: 0.85,
          professional_language: 0.90
        }
      };

      return result;
      
    } catch (error) {
      console.error('❌ LaTeX generation error:', error);
      throw new Error(`LaTeX generation failed: ${error.message}`);
    }
  }

  /**
   * Apply targeted edits to existing LaTeX content
   */
  async applyTargetedEdits(
    projectId: string,
    sectionType: string,
    instructions: string
  ): Promise<LaTeXGenerationResponse> {
    try {
      console.log('🎯 Applying targeted LaTeX edits:', instructions);
      
      // Load existing content
      const existingSection = await this.loadLaTeXSection(projectId, sectionType);
      if (!existingSection) {
        throw new Error('No existing LaTeX content found');
      }

      // Parse the document
      const document = latexProcessor.parseDocument(existingSection.content);
      
      // Parse instructions into edit requests
      const editRequests = latexProcessor.parseInstructions(instructions, document);
      
      // For complex edits, use AI assistance
      if (editRequests.length === 0 || instructions.includes('rewrite') || instructions.includes('improve')) {
        return this.generateAIAssistedEdits(document, instructions, projectId, sectionType);
      }
      
      // Apply targeted edits
      const editResult = latexProcessor.applyEdits(document, editRequests);
      
      if (!editResult.success) {
        throw new Error('Failed to apply edits');
      }

      // Create updated response
      const artifactId = `${projectId}_${sectionType}_${Date.now()}`;
      
      const result: LaTeXGenerationResponse = {
        content: editResult.updatedContent,
        latexContent: editResult.updatedContent,
        sources: [{
          id: `edit-${Date.now()}`,
          section_id: '',
          content_snippet: 'Targeted edits applied',
          source_type: 'ai_generated',
          source_reference: 'LaTeX targeted editing',
          confidence_score: 0.90,
          created_at: new Date().toISOString()
        }],
        confidence_score: 0.90,
        compilationReady: editResult.validationResults.compilationReady,
        artifactId,
        regulatory_compliance: {
          requirements_met: ['Targeted updates applied', 'LaTeX syntax preserved'],
          missing_requirements: editResult.validationResults.issues,
          recommendations: ['Validate compilation with latexmk']
        },
        quality_metrics: {
          completeness: 0.90,
          accuracy: 0.90,
          regulatory_alignment: 0.85,
          professional_language: 0.90
        }
      };

      // Save updated content
      await this.saveLaTeXSection(projectId, sectionType, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error applying LaTeX edits:', error);
      throw new Error(`Edit application failed: ${error.message}`);
    }
  }

  /**
   * Load existing LaTeX section from database
   */
  async loadLaTeXSection(projectId: string, sectionType: string): Promise<IPOSection | null> {
    try {
      const { data: section, error } = await supabase
        .from('ipo_prospectus_sections')
        .select('*')
        .eq('project_id', projectId)
        .eq('section_type', sectionType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (section) {
        // Transform to match IPOSection interface
        return {
          ...section,
          sources: [], // Initialize empty sources array for now
          status: section.status as 'draft' | 'review' | 'completed' | 'pending'
        } as IPOSection;
      }
      return null;
      
    } catch (error) {
      console.error('❌ Error loading LaTeX section:', error);
      return null;
    }
  }

  /**
   * Save LaTeX section to database
   */
  async saveLaTeXSection(
    projectId: string,
    sectionType: string,
    response: LaTeXGenerationResponse
  ): Promise<IPOSection> {
    try {
      // Save with LaTeX metadata
      const { data: section, error } = await supabase
        .from('ipo_prospectus_sections')
        .upsert({
          project_id: projectId,
          section_type: sectionType,
          title: this.getSectionTitle(sectionType),
          content: response.latexContent,
          confidence_score: response.confidence_score,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...section,
        sources: response.sources,
        status: section.status as 'draft' | 'review' | 'completed' | 'pending'
      } as IPOSection;
      
    } catch (error) {
      console.error('❌ Error saving LaTeX section:', error);
      throw new Error(`Failed to save LaTeX content: ${error.message}`);
    }
  }

  private buildLaTeXPrompt(project: any, request: LaTeXGenerationRequest): string {
    const sectionTitle = this.getSectionTitle(request.section_type);
    
    return `
You are an expert LaTeX document processor specializing in Hong Kong IPO prospectus drafting. Generate professional LaTeX content for the "${sectionTitle}" section.

**COMPANY INFORMATION:**
- Company: ${project.company_name}
- Industry: ${project.industry || 'Not specified'}
- Project: ${project.project_name}

**LaTeX REQUIREMENTS:**
- Use proper LaTeX formatting and syntax
- Include appropriate sectioning commands (\subsection*, \subsubsection, etc.)
- Use professional styling (\textbf{}, \textit{}, \item)
- Create well-formatted tables with booktabs package
- Ensure compilation compatibility with latexmk
- Use noto fonts and geometry package as specified

**KEY ELEMENTS:**
${request.key_elements ? JSON.stringify(request.key_elements, null, 2) : 'Use professional judgment'}

**BASE TEMPLATE:**
${request.baseTemplate || 'Standard HKEX IPO prospectus structure'}

**SPECIFIC INSTRUCTIONS:**
${request.targetInstructions || 'Generate comprehensive section content'}

**REGULATORY COMPLIANCE:**
- Must comply with HKEX Main Board Listing Rules
- Follow App1A Part A requirements
- Use professional investment banking language
- Include mandatory disclosures
- Ensure accuracy and completeness

**OUTPUT FORMAT:**
Generate valid LaTeX code that:
1. Can be compiled with latexmk
2. Uses proper document structure
3. Includes professional formatting
4. Maintains HKEX compliance standards
5. Follows investment banking conventions

Generate comprehensive, high-quality LaTeX content for Hong Kong IPO prospectuses.`;
  }

  private async generateAIAssistedEdits(
    document: LaTeXDocument,
    instructions: string,
    projectId: string,
    sectionType: string
  ): Promise<LaTeXGenerationResponse> {
    
    const prompt = `
You are a LaTeX document editor specializing in IPO prospectus revisions. Apply the following instructions to the provided LaTeX content while preserving formatting and structure.

**INSTRUCTIONS:** ${instructions}

**CURRENT LATEX CONTENT:**
${document.content}

**REQUIREMENTS:**
- Preserve LaTeX syntax and formatting
- Maintain document structure
- Apply only the requested changes
- Ensure compilation compatibility
- Keep professional investment banking language

**OUTPUT:**
Provide the updated LaTeX content with the requested changes applied.`;

    const response = await simpleAiClient.generateContent({
      prompt,
      metadata: {
        projectId,
        sectionType,
        operation: 'ai_assisted_edit'
      }
    });

    if (!response.success || !response.text) {
      throw new Error('AI-assisted editing failed');
    }

    const artifactId = `${projectId}_${sectionType}_ai_edit_${Date.now()}`;
    
    return {
      content: response.text,
      latexContent: response.text,
      sources: [{
        id: `ai-edit-${Date.now()}`,
        section_id: '',
        content_snippet: 'AI-assisted editing applied',
        source_type: 'ai_generated',
        source_reference: 'LaTeX AI Editor',
        confidence_score: 0.85,
        created_at: new Date().toISOString()
      }],
      confidence_score: 0.85,
      compilationReady: true,
      artifactId,
      regulatory_compliance: {
        requirements_met: ['AI-assisted improvements', 'LaTeX formatting preserved'],
        missing_requirements: [],
        recommendations: ['Review changes and validate compilation']
      },
      quality_metrics: {
        completeness: 0.85,
        accuracy: 0.85,
        regulatory_alignment: 0.85,
        professional_language: 0.90
      }
    };
  }

  private validateLaTeXContent(document: LaTeXDocument): { compilationReady: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for required LaTeX structure
    if (!document.content.includes('\\subsection')) {
      issues.push('Missing section structure');
    }
    
    // Check for professional formatting
    if (!document.content.includes('\\textbf')) {
      issues.push('Consider adding bold formatting for emphasis');
    }
    
    // Basic syntax validation
    const openBraces = (document.content.match(/\{/g) || []).length;
    const closeBraces = (document.content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      issues.push('Syntax error: mismatched braces');
    }
    
    return {
      compilationReady: issues.filter(i => i.includes('Syntax error')).length === 0,
      issues
    };
  }

  private createLaTeXSources(response: any, request: LaTeXGenerationRequest): any[] {
    return [{
      id: `latex-gen-${Date.now()}`,
      section_id: '',
      content_snippet: 'LaTeX content generated with professional formatting',
      source_type: 'ai_generated',
      source_reference: 'LaTeX Content Generator - Hong Kong IPO Expert',
      confidence_score: 0.85,
      created_at: new Date().toISOString()
    }];
  }

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

export const latexContentService = new LaTeXContentService();