import { supabase } from '@/integrations/supabase/client';

interface GuidanceData {
  guidance?: string | null;
  contents?: string | null;
  contentsRequirements?: string | null;
  references?: string | null;
}

interface TemplateData {
  [key: string]: string | null;
}

interface AssessmentResult {
  regulatoryCompliance: {
    score: number;
    missingRequirements: string[];
    metRequirements: string[];
    recommendations: string[];
  };
  templateAlignment: {
    score: number;
    bestPractices: string[];
    improvementAreas: string[];
    industryBenchmarks: string[];
  };
  professionalStandards: {
    score: number;
    languageQuality: number;
    structureQuality: number;
    completenessScore: number;
  };
  overallAssessment: {
    score: number;
    confidence: number;
    readinessLevel: 'draft' | 'review' | 'near-complete' | 'complete';
    nextSteps: string[];
  };
}

interface ContentValidation {
  isValid: boolean;
  completeness: number;
  missingElements: string[];
  suggestedImprovements: string[];
}

export class GuidanceAssessmentService {
  
  /**
   * Main assessment workflow: combines regulatory guidance with template analysis
   */
  async assessContent(
    userContent: string, 
    sectionType: string, 
    userInput?: string
  ): Promise<AssessmentResult> {
    try {
      // Step 1: Fetch both guidance and template data
      const [guidanceData, templateData] = await Promise.all([
        this.fetchGuidanceData(sectionType),
        this.fetchTemplateData(sectionType)
      ]);

      // Step 2: Assess regulatory compliance
      const regulatoryCompliance = await this.assessRegulatoryCompliance(
        userContent, 
        guidanceData
      );

      // Step 3: Assess template alignment
      const templateAlignment = await this.assessTemplateAlignment(
        userContent, 
        templateData,
        sectionType
      );

      // Step 4: Assess professional standards
      const professionalStandards = this.assessProfessionalStandards(userContent);

      // Step 5: Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(
        regulatoryCompliance,
        templateAlignment,
        professionalStandards,
        userInput
      );

      return {
        regulatoryCompliance,
        templateAlignment,
        professionalStandards,
        overallAssessment
      };
    } catch (error) {
      console.error('Guidance assessment failed:', error);
      return this.createFallbackAssessment();
    }
  }

  /**
   * Validate content against requirements before AI suggestions
   */
  async validateBeforeSuggestion(
    userContent: string,
    sectionType: string
  ): Promise<ContentValidation> {
    const guidanceData = await this.fetchGuidanceData(sectionType);
    
    if (!guidanceData?.contentsRequirements) {
      return {
        isValid: true,
        completeness: 0.8,
        missingElements: [],
        suggestedImprovements: []
      };
    }

    const requirements = this.parseRequirements(guidanceData.contentsRequirements);
    const missingElements = requirements.filter(req => 
      !this.checkRequirementInContent(userContent, req)
    );

    const completeness = Math.max(0, (requirements.length - missingElements.length) / requirements.length);
    
    return {
      isValid: completeness > 0.6,
      completeness,
      missingElements: missingElements.map(el => el.label),
      suggestedImprovements: this.generateImprovementSuggestions(missingElements)
    };
  }

  /**
   * Get assessment-based prompt enhancement
   */
  async enhancePromptWithAssessment(
    originalPrompt: string,
    sectionType: string,
    userContent: string
  ): Promise<string> {
    const assessment = await this.assessContent(userContent, sectionType);
    
    return `${originalPrompt}

**REGULATORY COMPLIANCE REQUIREMENTS:**
${assessment.regulatoryCompliance.missingRequirements.length > 0 
  ? `Missing Requirements: ${assessment.regulatoryCompliance.missingRequirements.join(', ')}`
  : 'All requirements met'
}

**TEMPLATE BEST PRACTICES:**
${assessment.templateAlignment.bestPractices.slice(0, 3).join(', ')}

**PROFESSIONAL STANDARDS:**
- Language Quality: ${assessment.professionalStandards.languageQuality * 100}%
- Structure Quality: ${assessment.professionalStandards.structureQuality * 100}%
- Completeness: ${assessment.professionalStandards.completenessScore * 100}%

**IMPROVEMENT PRIORITIES:**
${assessment.overallAssessment.nextSteps.slice(0, 3).map((step, i) => `${i + 1}. ${step}`).join('\n')}

Ensure all suggestions address the above assessment findings and maintain compliance with HKEX requirements.`;
  }

  /**
   * Fetch regulatory guidance data
   */
  private async fetchGuidanceData(sectionType: string): Promise<GuidanceData> {
    const { data, error } = await supabase
      .from('ipo_prospectus_section_guidance')
      .select('Guidance, Section, contents, "contents requirements", references')
      .ilike('Section', `%${sectionType}%`);

    if (error || !data) {
      console.warn('Failed to fetch guidance data:', error);
      return {};
    }

    const rows = Array.isArray(data) ? data : [data];
    return {
      guidance: rows.map(r => r?.Guidance).filter(Boolean).join('\n\n') || null,
      contentsRequirements: rows.map(r => r?.["contents requirements"]).filter(Boolean).join('\n') || null,
      contents: rows.map(r => r?.contents).filter(Boolean).join('\n') || null,
      references: rows.map(r => r?.references).filter(Boolean).join('\n') || null,
    };
  }

  /**
   * Fetch template reference data
   */
  private async fetchTemplateData(sectionType: string): Promise<TemplateData> {
    const { data, error } = await supabase
      .from('ipo_section_business_templates')
      .select('*')
      .limit(5);

    if (error || !data) {
      console.warn('Failed to fetch template data:', error);
      return {};
    }

    // Return the most relevant template data
    return data[0] || {};
  }

  /**
   * Assess regulatory compliance
   */
  private async assessRegulatoryCompliance(
    content: string,
    guidanceData: GuidanceData
  ): Promise<AssessmentResult['regulatoryCompliance']> {
    if (!guidanceData.contentsRequirements) {
      return {
        score: 0.8,
        missingRequirements: [],
        metRequirements: ['Basic content structure'],
        recommendations: ['Add specific regulatory requirements']
      };
    }

    const requirements = this.parseRequirements(guidanceData.contentsRequirements);
    const metRequirements: string[] = [];
    const missingRequirements: string[] = [];

    requirements.forEach(req => {
      if (this.checkRequirementInContent(content, req)) {
        metRequirements.push(req.label);
      } else {
        missingRequirements.push(req.label);
      }
    });

    const score = requirements.length > 0 
      ? metRequirements.length / requirements.length 
      : 0.8;

    return {
      score,
      missingRequirements,
      metRequirements,
      recommendations: this.generateComplianceRecommendations(missingRequirements)
    };
  }

  /**
   * Assess template alignment
   */
  private async assessTemplateAlignment(
    content: string,
    templateData: TemplateData,
    sectionType: string
  ): Promise<AssessmentResult['templateAlignment']> {
    const bestPractices = this.extractBestPractices(templateData, sectionType);
    const improvementAreas = this.identifyImprovementAreas(content, templateData);
    const industryBenchmarks = this.getIndustryBenchmarks(templateData);

    const alignmentScore = this.calculateTemplateAlignmentScore(content, bestPractices);

    return {
      score: alignmentScore,
      bestPractices,
      improvementAreas,
      industryBenchmarks
    };
  }

  /**
   * Assess professional standards
   */
  private assessProfessionalStandards(content: string): AssessmentResult['professionalStandards'] {
    const languageQuality = this.assessLanguageQuality(content);
    const structureQuality = this.assessStructureQuality(content);
    const completenessScore = this.assessCompleteness(content);

    const score = (languageQuality + structureQuality + completenessScore) / 3;

    return {
      score,
      languageQuality,
      structureQuality,
      completenessScore
    };
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    regulatory: AssessmentResult['regulatoryCompliance'],
    template: AssessmentResult['templateAlignment'],
    professional: AssessmentResult['professionalStandards'],
    userInput?: string
  ): AssessmentResult['overallAssessment'] {
    const weights = { regulatory: 0.4, template: 0.3, professional: 0.3 };
    const score = 
      regulatory.score * weights.regulatory +
      template.score * weights.template +
      professional.score * weights.professional;

    const confidence = Math.min(score + 0.1, 1.0);
    
    let readinessLevel: 'draft' | 'review' | 'near-complete' | 'complete';
    if (score >= 0.9) readinessLevel = 'complete';
    else if (score >= 0.75) readinessLevel = 'near-complete';
    else if (score >= 0.6) readinessLevel = 'review';
    else readinessLevel = 'draft';

    const nextSteps = this.generateNextSteps(regulatory, template, professional, userInput);

    return {
      score,
      confidence,
      readinessLevel,
      nextSteps
    };
  }

  /**
   * Parse requirements from guidance text
   */
  private parseRequirements(requirementsText: string): Array<{ label: string; keywords: string[] }> {
    const segments = requirementsText.split(/(?=\([ivxlcdmv]+\)\s+)/i);
    
    return segments
      .map(segment => segment.trim())
      .filter(Boolean)
      .map(segment => {
        const cleaned = segment
          .replace(/^\([ivxlcdmv]+\)\s+/i, '')
          .replace(/^\([a-zA-Z]\)\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .trim();
        
        if (cleaned.length < 3) return null;
        
        const label = cleaned.split(/\s*\(|(?:\s+e\.g\.)/i)[0].trim();
        const keywords = this.extractKeywords(cleaned);
        
        return { label, keywords };
      })
      .filter(Boolean) as Array<{ label: string; keywords: string[] }>;
  }

  /**
   * Check if requirement is present in content
   */
  private checkRequirementInContent(content: string, requirement: { label: string; keywords: string[] }): boolean {
    const contentLower = content.toLowerCase();
    const labelWords = requirement.label.toLowerCase().split(/\s+/);
    
    // Check if main topic is covered
    const hasMainTopic = labelWords.some(word => 
      word.length > 3 && contentLower.includes(word)
    );
    
    // Check if any keywords are present
    const hasKeywords = requirement.keywords.some(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    return hasMainTopic || hasKeywords;
  }

  /**
   * Extract keywords from requirement text
   */
  private extractKeywords(text: string): string[] {
    const businessKeywords = [
      'business model', 'revenue', 'customers', 'suppliers', 'products', 'services',
      'operations', 'management', 'strategy', 'competitive', 'market', 'industry',
      'financial', 'risks', 'compliance', 'regulatory', 'licensing', 'permits'
    ];
    
    return businessKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Generate improvement suggestions based on missing elements
   */
  private generateImprovementSuggestions(missingElements: Array<{ label: string; keywords: string[] }>): string[] {
    return missingElements.map(element => 
      `Add section covering: ${element.label}`
    );
  }

  /**
   * Extract best practices from template data
   */
  private extractBestPractices(templateData: TemplateData, sectionType: string): string[] {
    const practices: string[] = [];
    
    // Look for structured content examples
    Object.entries(templateData).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.length > 50) {
        if (value.includes('•') || value.includes('table') || value.includes('breakdown')) {
          practices.push(`Use structured format like in ${key}`);
        }
        if (value.includes('%') || value.includes('million') || value.includes('period')) {
          practices.push('Include quantitative data and metrics');
        }
      }
    });

    return practices.length > 0 ? practices : ['Follow standard business section format', 'Include quantitative metrics', 'Use professional language'];
  }

  /**
   * Calculate template alignment score
   */
  private calculateTemplateAlignmentScore(content: string, bestPractices: string[]): number {
    if (bestPractices.length === 0) return 0.7;
    
    const contentLower = content.toLowerCase();
    let matches = 0;
    
    bestPractices.forEach(practice => {
      if (practice.includes('structured') && (contentLower.includes('•') || contentLower.includes('table'))) {
        matches++;
      }
      if (practice.includes('quantitative') && /\d+%|\d+\s*(million|billion|thousand)/.test(content)) {
        matches++;
      }
      if (practice.includes('professional') && content.length > 200) {
        matches++;
      }
    });
    
    return Math.min(matches / bestPractices.length, 1.0);
  }

  /**
   * Identify improvement areas
   */
  private identifyImprovementAreas(content: string, templateData: TemplateData): string[] {
    const areas: string[] = [];
    
    if (content.length < 500) {
      areas.push('Expand content with more detailed information');
    }
    
    if (!/\d+%|\d+\s*(million|billion|thousand)/.test(content)) {
      areas.push('Add quantitative metrics and financial data');
    }
    
    if (!content.includes('•') && !content.includes('table')) {
      areas.push('Use structured format with bullet points or tables');
    }
    
    return areas.length > 0 ? areas : ['Continue improving content quality'];
  }

  /**
   * Get industry benchmarks
   */
  private getIndustryBenchmarks(templateData: TemplateData): string[] {
    return [
      'Industry standard section length: 800-1200 words',
      'Include 3-5 quantitative metrics',
      'Follow HKEX formatting guidelines',
      'Maintain professional tone throughout'
    ];
  }

  /**
   * Assess language quality
   */
  private assessLanguageQuality(content: string): number {
    let score = 0.7; // Base score
    
    // Check for professional terms
    const professionalTerms = ['pursuant to', 'in accordance with', 'during the period', 'our group'];
    const hasTerms = professionalTerms.some(term => content.toLowerCase().includes(term));
    if (hasTerms) score += 0.15;
    
    // Check for complete sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) score += 0.1;
    
    // Check against common issues
    if (!content.includes('...') && !content.includes('[TBD]')) score += 0.05;
    
    return Math.min(score, 1.0);
  }

  /**
   * Assess structure quality
   */
  private assessStructureQuality(content: string): number {
    let score = 0.6; // Base score
    
    // Check for paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 2) score += 0.2;
    
    // Check for lists or structured content
    if (content.includes('•') || content.includes('-') || /^\d+\./.test(content)) {
      score += 0.15;
    }
    
    // Check for headers or sections
    if (/^[A-Z][^.]*:/.test(content) || content.includes('**')) {
      score += 0.05;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Assess completeness
   */
  private assessCompleteness(content: string): number {
    let score = 0.5; // Base score
    
    // Length indicator
    if (content.length > 300) score += 0.2;
    if (content.length > 600) score += 0.15;
    if (content.length > 1000) score += 0.1;
    
    // Content richness
    if (/\d+/.test(content)) score += 0.05; // Has numbers
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(missing: string[]): string[] {
    if (missing.length === 0) {
      return ['Content meets regulatory requirements'];
    }
    
    return missing.slice(0, 3).map(req => `Address requirement: ${req}`);
  }

  /**
   * Generate next steps based on assessment
   */
  private generateNextSteps(
    regulatory: AssessmentResult['regulatoryCompliance'],
    template: AssessmentResult['templateAlignment'],
    professional: AssessmentResult['professionalStandards'],
    userInput?: string
  ): string[] {
    const steps: string[] = [];
    
    // Prioritize regulatory compliance
    if (regulatory.score < 0.8 && regulatory.missingRequirements.length > 0) {
      steps.push(`Address missing requirements: ${regulatory.missingRequirements.slice(0, 2).join(', ')}`);
    }
    
    // Template alignment
    if (template.score < 0.7 && template.improvementAreas.length > 0) {
      steps.push(template.improvementAreas[0]);
    }
    
    // Professional standards
    if (professional.languageQuality < 0.8) {
      steps.push('Improve language quality and professional tone');
    }
    
    if (professional.structureQuality < 0.7) {
      steps.push('Enhance content structure and organization');
    }
    
    // User-specific guidance
    if (userInput && userInput.toLowerCase().includes('improve')) {
      steps.push('Focus on content enhancement as requested');
    }
    
    return steps.length > 0 ? steps : ['Continue refining content quality'];
  }

  /**
   * Create fallback assessment for error cases
   */
  private createFallbackAssessment(): AssessmentResult {
    return {
      regulatoryCompliance: {
        score: 0.7,
        missingRequirements: [],
        metRequirements: ['Basic content structure'],
        recommendations: ['Continue developing content']
      },
      templateAlignment: {
        score: 0.7,
        bestPractices: ['Follow professional formatting'],
        improvementAreas: ['Enhance content detail'],
        industryBenchmarks: ['Meet industry standards']
      },
      professionalStandards: {
        score: 0.7,
        languageQuality: 0.7,
        structureQuality: 0.7,
        completenessScore: 0.7
      },
      overallAssessment: {
        score: 0.7,
        confidence: 0.6,
        readinessLevel: 'review',
        nextSteps: ['Continue content development']
      }
    };
  }
}

export const guidanceAssessmentService = new GuidanceAssessmentService();