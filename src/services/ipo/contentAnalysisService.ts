
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
    return `
You are an expert IPO prospectus analyzer. Analyze this content comprehensively like a code analyzer.

CONTENT TO ANALYZE (${sectionType} section):
${content}

REGULATORY REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

Perform comprehensive analysis and return structured results:

STRUCTURAL_ISSUES:
- Missing required subsections
- Logical flow problems  
- Inconsistent formatting
- Poor organization

COMPLIANCE_GAPS:
- Missing HKEX requirements
- Regulatory violations
- Disclosure deficiencies
- Risk factor omissions

QUALITY_METRICS:
- Professional language: [score/10]
- Technical accuracy: [score/10]
- Completeness: [score/10]
- Investor clarity: [score/10]

IMPROVEMENT_OPPORTUNITIES:
- Quick wins (easy + high impact)
- Content enhancements needed
- Examples to add
- Language improvements

OVERALL_SCORE: [0-100]

MISSING_ELEMENTS:
- Required disclosures not present
- Standard section content gaps

Be specific and actionable in your analysis.`;
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
      // Use business templates as fallback for now
      const { data } = await supabase
        .from('ipo_section_business_templates')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      return data || {};
    } catch (error) {
      console.error('Error fetching requirements:', error);
      return {};
    }
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
