/**
 * Compliance Validation Service - Enhanced semantic validation for IPO requirements
 */
import { grokService } from '@/services/grokService';
import { ipoRequirementsService } from './ipoRequirementsService';

export interface ComplianceValidationResult {
  overallScore: number;
  requirementScores: RequirementScore[];
  missingRequirements: string[];
  suggestions: string[];
  passesThreshold: boolean;
}

export interface RequirementScore {
  requirementId: string;
  title: string;
  score: number;
  feedback: string;
  isMandatory: boolean;
}

export class ComplianceValidationService {
  private readonly MINIMUM_COMPLIANCE_THRESHOLD = 0.85;

  /**
   * Perform comprehensive semantic compliance validation
   */
  async validateCompliance(
    content: string, 
    sectionType: string
  ): Promise<ComplianceValidationResult> {
    console.log('🔍 Starting semantic compliance validation...');
    
    try {
      // Get section requirements
      const requirements = ipoRequirementsService.getRequirements(sectionType);
      if (!requirements) {
        return this.createFallbackResult();
      }

      // Validate each requirement using AI semantic analysis
      const requirementScores = await this.validateRequirements(content, requirements, sectionType);
      
      // Calculate overall compliance score
      const overallScore = this.calculateOverallScore(requirementScores);
      
      // Identify missing requirements
      const missingRequirements = requirementScores
        .filter(req => req.isMandatory && req.score < 0.7)
        .map(req => req.title);
      
      // Generate improvement suggestions
      const suggestions = await this.generateImprovementSuggestions(requirementScores, content, sectionType);
      
      return {
        overallScore,
        requirementScores,
        missingRequirements,
        suggestions,
        passesThreshold: overallScore >= this.MINIMUM_COMPLIANCE_THRESHOLD
      };
      
    } catch (error) {
      console.error('Compliance validation failed:', error);
      return this.createFallbackResult();
    }
  }

  /**
   * Validate individual requirements using AI semantic analysis
   */
  private async validateRequirements(
    content: string, 
    requirements: any, 
    sectionType: string
  ): Promise<RequirementScore[]> {
    const scores: RequirementScore[] = [];
    
    for (const requirement of requirements.requirements) {
      const score = await this.validateSingleRequirement(content, requirement, sectionType);
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * Validate a single requirement using semantic AI analysis
   */
  private async validateSingleRequirement(
    content: string, 
    requirement: any, 
    sectionType: string
  ): Promise<RequirementScore> {
    const validationPrompt = `
Analyze this IPO prospectus content against a specific HKEX requirement and provide a compliance score.

CONTENT TO ANALYZE:
${content}

REQUIREMENT TO VALIDATE:
Title: ${requirement.title}
Description: ${requirement.description}
Required Elements: ${requirement.subsections.join(', ')}
Must Disclose: ${requirement.disclosures.join(', ')}
Is Mandatory: ${requirement.mandatory}

VALIDATION CRITERIA:
1. Does the content address the requirement comprehensively? (40% weight)
2. Are all required elements present? (30% weight)
3. Are all mandatory disclosures included? (20% weight)
4. Is the information quality sufficient for HKEX standards? (10% weight)

Provide analysis in this format:
SCORE: [0.0-1.0 decimal score]
ELEMENTS_FOUND: [list elements that are present]
MISSING_ELEMENTS: [list elements that are missing]
FEEDBACK: [specific feedback on compliance level]

Be strict with scoring - require genuine presence of required elements, not just related content.`;

    try {
      const response = await grokService.generateResponse({
        prompt: validationPrompt,
        metadata: { requestType: 'compliance_validation' }
      });

      const score = this.extractScore(response.text);
      const feedback = this.extractFeedback(response.text);

      return {
        requirementId: requirement.id,
        title: requirement.title,
        score,
        feedback,
        isMandatory: requirement.mandatory
      };
    } catch (error) {
      console.error(`Error validating requirement ${requirement.id}:`, error);
      return {
        requirementId: requirement.id,
        title: requirement.title,
        score: 0.5,
        feedback: 'Unable to validate - please review manually',
        isMandatory: requirement.mandatory
      };
    }
  }

  /**
   * Generate improvement suggestions based on validation results
   */
  private async generateImprovementSuggestions(
    requirementScores: RequirementScore[], 
    content: string, 
    sectionType: string
  ): Promise<string[]> {
    const lowScores = requirementScores.filter(req => req.score < 0.8);
    if (lowScores.length === 0) return [];

    const suggestionPrompt = `
Based on these compliance validation results, provide specific improvement suggestions:

LOW-SCORING REQUIREMENTS:
${lowScores.map(req => `
- ${req.title}: ${Math.round(req.score * 100)}%
  Feedback: ${req.feedback}
`).join('\n')}

CONTENT EXCERPT:
${content.substring(0, 1000)}...

Provide 3-5 specific, actionable suggestions to improve compliance scores. Focus on:
1. Adding missing mandatory elements
2. Enhancing disclosure quality
3. Meeting HKEX format requirements
4. Including required quantitative data

Format as numbered list of specific actions.`;

    try {
      const response = await grokService.generateResponse({
        prompt: suggestionPrompt,
        metadata: { requestType: 'improvement_suggestions' }
      });

      return this.parseSuggestions(response.text);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return ['Review content against HKEX requirements', 'Add missing mandatory disclosures'];
    }
  }

  /**
   * Calculate weighted overall compliance score
   */
  private calculateOverallScore(requirementScores: RequirementScore[]): number {
    if (requirementScores.length === 0) return 0.7;

    const mandatoryScores = requirementScores.filter(req => req.isMandatory);
    const optionalScores = requirementScores.filter(req => !req.isMandatory);

    // Weight mandatory requirements at 80%, optional at 20%
    const mandatoryWeight = 0.8;
    const optionalWeight = 0.2;

    const avgMandatory = mandatoryScores.length > 0 
      ? mandatoryScores.reduce((sum, req) => sum + req.score, 0) / mandatoryScores.length 
      : 0.7;

    const avgOptional = optionalScores.length > 0 
      ? optionalScores.reduce((sum, req) => sum + req.score, 0) / optionalScores.length 
      : 0.7;

    return (avgMandatory * mandatoryWeight) + (avgOptional * optionalWeight);
  }

  // Helper methods
  private extractScore(response: string): number {
    const scoreMatch = response.match(/SCORE:\s*([0-9.]+)/);
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1]);
      return Math.max(0, Math.min(1, score));
    }
    return 0.5; // Default fallback
  }

  private extractFeedback(response: string): string {
    const feedbackMatch = response.match(/FEEDBACK:\s*(.+)/);
    return feedbackMatch ? feedbackMatch[1].trim() : 'No specific feedback available';
  }

  private parseSuggestions(response: string): string[] {
    const lines = response.split('\n').filter(line => 
      line.trim().match(/^\d+\./) || line.trim().startsWith('-')
    );
    return lines.map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());
  }

  private createFallbackResult(): ComplianceValidationResult {
    return {
      overallScore: 0.7,
      requirementScores: [],
      missingRequirements: [],
      suggestions: ['Unable to validate compliance - please review against HKEX requirements'],
      passesThreshold: false
    };
  }
}

export const complianceValidationService = new ComplianceValidationService();