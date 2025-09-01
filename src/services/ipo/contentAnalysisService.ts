
import { supabase } from '@/integrations/supabase/client';
import { grokService } from '@/services/grokService';
import { ContentAnalysis, AnalysisIssue, ProactiveAnalysisResult, TargetedEdit, ContentDiff } from '@/types/ipoAnalysis';

/**
 * Content Analysis Service - Analyzes IPO prospectus content like Lovable analyzes code
 * Provides proactive insights and suggestions for improvement
 */
export class ContentAnalysisService {
  
  /**
   * Perform comprehensive content analysis (like Lovable's code analysis)
   */
  async analyzeContent(
    content: string, 
    sectionType: string, 
    projectId: string
  ): Promise<ContentAnalysis> {
    console.log('🔍 Starting comprehensive content analysis...');
    
    try {
      // Get regulatory requirements for this section
      const requirements = await this.getRegulatoryRequirements(sectionType);
      
      // Build analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(content, sectionType, requirements);
      
      // Get AI analysis
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          projectId,
          sectionType,
          requestType: 'content_analysis'
        }
      });
      
      // Parse the analysis response
      return this.parseAnalysisResponse(response.text, content);
      
    } catch (error) {
      console.error('Content analysis failed:', error);
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Get proactive suggestions before user asks (like Lovable's proactive improvements)
   */
  async getProactiveSuggestions(
    content: string,
    sectionType: string,
    recentChanges?: string[]
  ): Promise<ProactiveAnalysisResult> {
    console.log('💡 Generating proactive suggestions...');
    
    if (!content || content.trim().length < 100) {
      return {
        hasIssues: false,
        urgentIssues: [],
        quickWins: [],
        summary: "Content is too short for meaningful analysis. Consider adding more details.",
        nextSteps: ["Add more content to get AI suggestions", "Use quick actions to generate content"]
      };
    }

    try {
      const analysis = await this.analyzeContent(content, sectionType, '');
      
      // Identify urgent issues
      const urgentIssues = analysis.structuralIssues
        .concat(analysis.complianceGaps)
        .filter(issue => issue.severity === 'high')
        .slice(0, 3);

      // Identify quick wins
      const quickWins = analysis.improvementOpportunities
        .filter(opp => opp.effort === 'easy' && opp.impact !== 'low')
        .slice(0, 3);

      const hasIssues = urgentIssues.length > 0 || quickWins.length > 0;

      return {
        hasIssues,
        urgentIssues,
        quickWins,
        summary: this.generateProactiveSummary(urgentIssues, quickWins, analysis.overallScore),
        nextSteps: this.generateNextSteps(urgentIssues, quickWins)
      };

    } catch (error) {
      console.error('Proactive analysis failed:', error);
      return {
        hasIssues: false,
        urgentIssues: [],
        quickWins: [],
        summary: "Unable to analyze content at this time.",
        nextSteps: ["Try regenerating the content", "Check your API key settings"]
      };
    }
  }

  /**
   * Generate targeted edits (like Lovable's precise code changes)
   */
  async generateTargetedEdits(
    content: string,
    userRequest: string,
    sectionType: string
  ): Promise<TargetedEdit[]> {
    console.log('🎯 Generating targeted edits...');
    
    const editPrompt = `
Analyze this IPO prospectus content and user request to generate precise, targeted edits.

CONTENT (${sectionType} section):
${content}

USER REQUEST: ${userRequest}

Generate specific, targeted edits following this format:

TARGETED_EDIT_1:
Title: [Brief edit title]
Description: [What this edit accomplishes]
Location: [Section/paragraph reference]
Original: "[exact text to change]"
New: "[exact replacement text]"
Reason: [Why this change improves the content]
Impact: [Expected improvement]
Confidence: [0.1-1.0]

TARGETED_EDIT_2:
[Continue for additional edits...]

Focus on:
- Precise text targeting (like code line changes)
- Regulatory compliance improvements
- Language and tone enhancements
- Structural improvements
- Factual accuracy

Provide 1-5 targeted edits maximum.`;

    try {
      const response = await grokService.generateResponse({
        prompt: editPrompt,
        metadata: { requestType: 'targeted_edits' }
      });

      return this.parseTargetedEdits(response.text, content);
    } catch (error) {
      console.error('Targeted edit generation failed:', error);
      return [];
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(content: string, sectionType: string, requirements: any): string {
    const { hkexGuidance = [], businessTemplate = null, sectionRequirements = [] } = requirements;
    
    return `
You are an expert Hong Kong IPO prospectus analyzer specialized in HKEX Main Board requirements. Analyze this content against actual HKEX standards and industry best practices.

CONTENT TO ANALYZE (${sectionType} section):
${content}

HKEX SECTION GUIDANCE (Actual regulatory requirements):
${hkexGuidance.map(g => `
- Section: ${g.Section || 'General'}
- Requirements: ${g['contents requirements'] || 'Standard disclosure requirements'}
- Guidance: ${g.Guidance || 'Follow HKEX standards'}
- References: ${g.references || 'HKEX Listing Rules'}
`).join('\n')}

BUSINESS TEMPLATE DEPTH REQUIREMENTS:
${businessTemplate ? `
Based on HKEX business section template, ensure coverage of:
- Overview: ${businessTemplate.Overview ? 'Required with comprehensive description' : 'Standard overview needed'}
- Competitive Strengths: ${businessTemplate['Competitive Strengths'] ? 'Detailed analysis required' : 'Basic strengths sufficient'}  
- Business Model: ${businessTemplate['Business Model'] ? 'Comprehensive model explanation required' : 'Basic model description'}
- Future Plans: ${businessTemplate['Future Plan'] ? 'Detailed strategic roadmap required' : 'General plans sufficient'}
- Risk Management: ${businessTemplate['Internal control and risk management'] ? 'Comprehensive framework required' : 'Basic controls sufficient'}
` : 'Standard HKEX requirements apply'}

SPECIFIC SECTION REQUIREMENTS:
${sectionRequirements.map(req => `- ${req}`).join('\n')}

Perform comprehensive HKEX-compliant analysis and return structured results:

STRUCTURAL_ISSUES:
- Missing HKEX-required subsections
- Non-compliance with listing rule structure
- Inconsistent with HKEX format requirements
- Poor logical flow for investor clarity

COMPLIANCE_GAPS:
- Missing HKEX App1A Part A requirements  
- Insufficient disclosure depth per HKEX standards
- Missing regulatory citations and references
- Non-compliance with specific listing rule provisions

QUALITY_METRICS:
- HKEX compliance level: [score/10]
- Investment banking standard: [score/10] 
- Content completeness vs template: [score/10]
- Professional disclosure quality: [score/10]

IMPROVEMENT_OPPORTUNITIES:
- Quick HKEX compliance wins
- Template alignment improvements
- Regulatory citation additions
- Industry-specific enhancements

OVERALL_SCORE: [0-100]

MISSING_ELEMENTS:
- HKEX-required disclosures not present
- Template-required content gaps
- Regulatory compliance deficiencies

Focus on HKEX Main Board compliance and investment banking standards. Be specific about listing rule requirements and provide actionable compliance guidance.`;
  }

  /**
   * Parse AI analysis response into structured format
   */
  private parseAnalysisResponse(response: string, content: string): ContentAnalysis {
    // Parse the structured response from AI
    const structuralIssues: AnalysisIssue[] = this.extractIssues(response, 'STRUCTURAL_ISSUES', 'structural');
    const complianceGaps: AnalysisIssue[] = this.extractIssues(response, 'COMPLIANCE_GAPS', 'compliance');
    
    return {
      structuralIssues,
      complianceGaps,
      qualityMetrics: this.extractQualityMetrics(response),
      missingElements: this.extractMissingElements(response),
      improvementOpportunities: this.extractImprovementOpportunities(response),
      overallScore: this.extractOverallScore(response)
    };
  }

  /**
   * Parse targeted edits from AI response
   */
  private parseTargetedEdits(response: string, originalContent: string): TargetedEdit[] {
    const edits: TargetedEdit[] = [];
    const editMatches = response.match(/TARGETED_EDIT_\d+:([\s\S]*?)(?=TARGETED_EDIT_\d+:|$)/g);
    
    if (editMatches) {
      editMatches.forEach((editBlock, index) => {
        const edit = this.parseEditBlock(editBlock, originalContent, index);
        if (edit) edits.push(edit);
      });
    }
    
    return edits;
  }

  /**
   * Parse individual edit block
   */
  private parseEditBlock(editBlock: string, originalContent: string, index: number): TargetedEdit | null {
    try {
      const title = this.extractField(editBlock, 'Title');
      const description = this.extractField(editBlock, 'Description');
      const originalText = this.extractField(editBlock, 'Original');
      const newText = this.extractField(editBlock, 'New');
      const reason = this.extractField(editBlock, 'Reason');
      const impact = this.extractField(editBlock, 'Impact');
      const confidenceStr = this.extractField(editBlock, 'Confidence');
      
      if (!title || !originalText || !newText) return null;
      
      const confidence = parseFloat(confidenceStr) || 0.8;
      
      // Find location in content
      const location = this.findTextLocation(originalContent, originalText);
      
      const diff: ContentDiff = {
        type: 'replace',
        originalText,
        newText,
        location,
        reason
      };
      
      return {
        id: `edit_${index + 1}`,
        title,
        description,
        diffs: [diff],
        confidence,
        impact,
        previewText: this.generatePreviewText(originalText, newText)
      };
    } catch (error) {
      console.error('Error parsing edit block:', error);
      return null;
    }
  }

  // Helper methods for parsing
  private extractField(text: string, field: string): string {
    const regex = new RegExp(`${field}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  }

  private extractIssues(response: string, section: string, type: string): AnalysisIssue[] {
    // Extract and parse issues from the response
    const sectionMatch = response.match(new RegExp(`${section}:(.*?)(?=[A-Z_]+:|$)`, 's'));
    if (!sectionMatch) return [];
    
    const issues = sectionMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map((line, index) => ({
        id: `${type}_${index}`,
        type: type as any,
        severity: 'medium' as const,
        title: line.replace('-', '').trim(),
        description: line.replace('-', '').trim(),
        location: { section: 'general' },
        autoFixable: type === 'structural'
      }));
    
    return issues;
  }

  private extractQualityMetrics(response: string) {
    const metrics = [];
    const metricsMatch = response.match(/QUALITY_METRICS:(.*?)(?=[A-Z_]+:|$)/s);
    if (metricsMatch) {
      const lines = metricsMatch[1].split('\n').filter(line => line.includes(':'));
      for (const line of lines) {
        const [aspect, scoreText] = line.split(':');
        const score = parseInt(scoreText.match(/\d+/)?.[0] || '5');
        metrics.push({
          aspect: aspect.replace('-', '').trim(),
          score,
          maxScore: 10,
          feedback: `Current score: ${score}/10`
        });
      }
    }
    return metrics;
  }

  private extractMissingElements(response: string): string[] {
    const missing = [];
    const missingMatch = response.match(/MISSING_ELEMENTS:(.*?)(?=[A-Z_]+:|$)/s);
    if (missingMatch) {
      const lines = missingMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace('-', '').trim());
      missing.push(...lines);
    }
    return missing;
  }

  private extractImprovementOpportunities(response: string) {
    const opportunities = [];
    const opportunitiesMatch = response.match(/IMPROVEMENT_OPPORTUNITIES:(.*?)(?=[A-Z_]+:|$)/s);
    if (opportunitiesMatch) {
      const lines = opportunitiesMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map((line, index) => ({
          id: `opportunity_${index}`,
          title: line.replace('-', '').trim(),
          description: line.replace('-', '').trim(),
          impact: 'medium' as const,
          effort: 'moderate' as const,
          suggestedAction: `Implement: ${line.replace('-', '').trim()}`
        }));
      opportunities.push(...lines);
    }
    return opportunities;
  }

  private extractOverallScore(response: string): number {
    const scoreMatch = response.match(/OVERALL_SCORE:\s*(\d+)/);
    return scoreMatch ? parseInt(scoreMatch[1]) : 70;
  }

  private findTextLocation(content: string, searchText: string) {
    const index = content.indexOf(searchText);
    if (index === -1) {
      return { section: 'general' };
    }
    
    // Find paragraph number (rough estimate)
    const beforeText = content.substring(0, index);
    const paragraphNumber = (beforeText.match(/\n\n/g) || []).length + 1;
    
    return {
      section: 'general',
      paragraph: paragraphNumber,
      sentenceStart: index,
      sentenceEnd: index + searchText.length
    };
  }

  private generatePreviewText(original: string, replacement: string): string {
    const maxLength = 100;
    const preview = `${original.substring(0, maxLength)}${original.length > maxLength ? '...' : ''} → ${replacement.substring(0, maxLength)}${replacement.length > maxLength ? '...' : ''}`;
    return preview;
  }

  private generateProactiveSummary(urgentIssues: any[], quickWins: any[], score: number): string {
    if (urgentIssues.length > 0) {
      return `I found ${urgentIssues.length} urgent issue${urgentIssues.length > 1 ? 's' : ''} that need attention. Quality score: ${score}/100.`;
    }
    if (quickWins.length > 0) {
      return `I found ${quickWins.length} quick improvement${quickWins.length > 1 ? 's' : ''} that could enhance your draft. Quality score: ${score}/100.`;
    }
    return `Your content looks good! Quality score: ${score}/100. I'm here if you need any improvements.`;
  }

  private generateNextSteps(urgentIssues: any[], quickWins: any[]): string[] {
    const steps = [];
    if (urgentIssues.length > 0) {
      steps.push("Review and fix urgent compliance issues");
    }
    if (quickWins.length > 0) {
      steps.push("Apply quick improvement suggestions");
    }
    if (steps.length === 0) {
      steps.push("Consider adding more specific examples", "Review regulatory citations");
    }
    return steps;
  }

  private async getRegulatoryRequirements(sectionType: string) {
    try {
      console.log(`🔍 Fetching HKEX requirements for section: ${sectionType}`);
      
      // Get HKEX section guidance
      const { data: guidance, error: guidanceError } = await supabase
        .from('ipo_prospectus_section_guidance')
        .select('*')
        .ilike('Section', `%${this.mapSectionTypeToGuidance(sectionType)}%`)
        .limit(3);

      if (guidanceError) {
        console.warn('Error fetching section guidance:', guidanceError);
      }

      // Get business templates for depth understanding
      const { data: templates, error: templateError } = await supabase
        .from('ipo_section_business_templates')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (templateError) {
        console.warn('Error fetching business templates:', templateError);
      }

      console.log(`✅ Found ${guidance?.length || 0} guidance items and ${templates ? 1 : 0} templates`);

      return {
        hkexGuidance: guidance || [],
        businessTemplate: templates,
        sectionRequirements: this.extractSectionRequirements(guidance, templates, sectionType)
      };
    } catch (error) {
      console.error('Error fetching HKEX requirements:', error);
      return { hkexGuidance: [], businessTemplate: null, sectionRequirements: [] };
    }
  }

  private mapSectionTypeToGuidance(sectionType: string): string {
    const mappings = {
      'business': 'Business',
      'financial': 'Financial Information',
      'risk': 'Risk Factors',
      'use_of_proceeds': 'Use of Proceeds',
      'directors': 'Directors',
      'shareholding': 'Shareholding Structure',
      'regulatory': 'Regulatory Environment'
    };
    return mappings[sectionType] || sectionType;
  }

  private extractSectionRequirements(guidance: any[], template: any, sectionType: string): string[] {
    const requirements = [];
    
    if (guidance && guidance.length > 0) {
      guidance.forEach(g => {
        if (g['contents requirements']) {
          requirements.push(g['contents requirements']);
        }
        if (g['Guidance']) {
          requirements.push(`Guidance: ${g['Guidance']}`);
        }
      });
    }
    
    if (template && sectionType === 'business') {
      // Extract specific requirements from business template structure
      const businessAreas = [
        'Overview', 'Competitive Strengths', 'Business Strategies', 
        'Business Model', 'Customers', 'Competition', 'Risk Management'
      ];
      businessAreas.forEach(area => {
        if (template[area]) {
          requirements.push(`${area}: Required based on HKEX template structure`);
        }
      });
    }
    
    return requirements;
  }

  private createFallbackAnalysis(): ContentAnalysis {
    return {
      structuralIssues: [],
      complianceGaps: [],
      qualityMetrics: [],
      missingElements: [],
      improvementOpportunities: [],
      overallScore: 50
    };
  }
}

export const contentAnalysisService = new ContentAnalysisService();
