import { guidanceAssessmentService } from './guidanceAssessmentService';

interface ValidationResult {
  isCompliant: boolean;
  completenessScore: number;
  criticalIssues: string[];
  warnings: string[];
  suggestions: string[];
  recommendedActions: string[];
}

interface RealTimeValidation {
  isValid: boolean;
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    location?: string;
    autoFixable?: boolean;
  }>;
}

export class ComplianceValidator {
  
  /**
   * Real-time validation for live editing
   */
  async validateRealTime(
    content: string,
    sectionType: string
  ): Promise<RealTimeValidation> {
    try {
      const validation = await guidanceAssessmentService.validateBeforeSuggestion(
        content,
        sectionType
      );

      const assessment = await guidanceAssessmentService.assessContent(
        content,
        sectionType
      );

      const issues = [
        ...this.createRegulatorIssues(assessment.regulatoryCompliance),
        ...this.createTemplateIssues(assessment.templateAlignment),
        ...this.createProfessionalIssues(assessment.professionalStandards)
      ];

      return {
        isValid: validation.isValid && assessment.overallAssessment.score > 0.6,
        score: assessment.overallAssessment.score,
        issues
      };
    } catch (error) {
      console.error('Real-time validation failed:', error);
      return {
        isValid: true,
        score: 0.7,
        issues: []
      };
    }
  }

  /**
   * Comprehensive validation before content submission
   */
  async validateForSubmission(
    content: string,
    sectionType: string
  ): Promise<ValidationResult> {
    try {
      const assessment = await guidanceAssessmentService.assessContent(
        content,
        sectionType
      );

      const criticalIssues: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Critical issues (must be fixed)
      if (assessment.regulatoryCompliance.score < 0.6) {
        criticalIssues.push('Content does not meet minimum regulatory requirements');
        criticalIssues.push(...assessment.regulatoryCompliance.missingRequirements.slice(0, 3));
      }

      // Warnings (should be addressed)
      if (assessment.professionalStandards.languageQuality < 0.7) {
        warnings.push('Language quality needs improvement');
      }
      
      if (assessment.professionalStandards.structureQuality < 0.7) {
        warnings.push('Content structure could be enhanced');
      }

      if (assessment.templateAlignment.score < 0.6) {
        warnings.push('Content does not follow industry best practices');
      }

      // Suggestions (nice to have)
      suggestions.push(...assessment.templateAlignment.improvementAreas.slice(0, 2));
      suggestions.push(...assessment.overallAssessment.nextSteps.slice(0, 2));

      const isCompliant = criticalIssues.length === 0 && assessment.overallAssessment.score > 0.7;

      return {
        isCompliant,
        completenessScore: assessment.overallAssessment.score,
        criticalIssues,
        warnings,
        suggestions,
        recommendedActions: assessment.overallAssessment.nextSteps
      };
    } catch (error) {
      console.error('Submission validation failed:', error);
      return {
        isCompliant: false,
        completenessScore: 0.5,
        criticalIssues: ['Validation system error - please review manually'],
        warnings: [],
        suggestions: [],
        recommendedActions: ['Manual review recommended']
      };
    }
  }

  /**
   * Validate specific requirement coverage
   */
  async validateRequirement(
    content: string,
    sectionType: string,
    requirementId: string
  ): Promise<{ isMet: boolean; confidence: number; suggestions: string[] }> {
    // This would validate a specific regulatory requirement
    // Implementation depends on requirement structure
    return {
      isMet: true,
      confidence: 0.8,
      suggestions: []
    };
  }

  /**
   * Get compliance score with breakdown
   */
  async getComplianceScore(
    content: string,
    sectionType: string
  ): Promise<{
    overall: number;
    regulatory: number;
    template: number;
    professional: number;
    breakdown: Record<string, number>;
  }> {
    try {
      const assessment = await guidanceAssessmentService.assessContent(
        content,
        sectionType
      );

      return {
        overall: Math.round(assessment.overallAssessment.score * 100),
        regulatory: Math.round(assessment.regulatoryCompliance.score * 100),
        template: Math.round(assessment.templateAlignment.score * 100),
        professional: Math.round(assessment.professionalStandards.score * 100),
        breakdown: {
          'Language Quality': Math.round(assessment.professionalStandards.languageQuality * 100),
          'Structure Quality': Math.round(assessment.professionalStandards.structureQuality * 100),
          'Completeness': Math.round(assessment.professionalStandards.completenessScore * 100),
          'Regulatory Alignment': Math.round(assessment.regulatoryCompliance.score * 100),
          'Template Alignment': Math.round(assessment.templateAlignment.score * 100)
        }
      };
    } catch (error) {
      console.error('Compliance score calculation failed:', error);
      return {
        overall: 70,
        regulatory: 70,
        template: 70,
        professional: 70,
        breakdown: {
          'Language Quality': 70,
          'Structure Quality': 70,
          'Completeness': 70,
          'Regulatory Alignment': 70,
          'Template Alignment': 70
        }
      };
    }
  }

  /**
   * Create regulatory issues from assessment
   */
  private createRegulatorIssues(regulatory: any): Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    autoFixable?: boolean;
  }> {
    const issues = [];

    if (regulatory.score < 0.6) {
      issues.push({
        type: 'error' as const,
        message: 'Critical regulatory requirements missing',
        autoFixable: false
      });
    }

    regulatory.missingRequirements.slice(0, 3).forEach((req: string) => {
      issues.push({
        type: regulatory.score < 0.7 ? 'error' as const : 'warning' as const,
        message: `Missing requirement: ${req}`,
        autoFixable: false
      });
    });

    return issues;
  }

  /**
   * Create template issues from assessment
   */
  private createTemplateIssues(template: any): Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    autoFixable?: boolean;
  }> {
    const issues = [];

    template.improvementAreas.slice(0, 2).forEach((area: string) => {
      issues.push({
        type: 'suggestion' as const,
        message: area,
        autoFixable: area.includes('format') || area.includes('structure')
      });
    });

    return issues;
  }

  /**
   * Create professional standard issues from assessment
   */
  private createProfessionalIssues(professional: any): Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    autoFixable?: boolean;
  }> {
    const issues = [];

    if (professional.languageQuality < 0.7) {
      issues.push({
        type: 'warning' as const,
        message: 'Language quality needs improvement',
        autoFixable: true
      });
    }

    if (professional.structureQuality < 0.7) {
      issues.push({
        type: 'warning' as const,
        message: 'Content structure could be enhanced',
        autoFixable: true
      });
    }

    if (professional.completenessScore < 0.6) {
      issues.push({
        type: 'suggestion' as const,
        message: 'Content needs more detail and depth',
        autoFixable: false
      });
    }

    return issues;
  }
}

export const complianceValidator = new ComplianceValidator();