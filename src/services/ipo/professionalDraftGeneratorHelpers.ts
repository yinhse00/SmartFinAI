/**
 * Helper methods for Professional Draft Generator - Enhanced Requirements Integration
 */
import { ipoRequirementsService } from './ipoRequirementsService';
import { complianceValidationService } from './complianceValidationService';

export class ProfessionalDraftGeneratorHelpers {
  
  /**
   * Get detailed HKEX requirements formatted for AI prompts
   */
  static async getDetailedRequirements(sectionType: string): Promise<string> {
    const requirements = ipoRequirementsService.getDetailedRequirements(sectionType);
    
    // Enhance with priority markers and compliance emphasis
    const enhancedRequirements = `
${requirements}

=== COMPLIANCE PRIORITY LEVELS ===
🔴 CRITICAL: All mandatory requirements MUST be addressed (85%+ compliance required)
🟡 IMPORTANT: Should be included for professional standards
🟢 RECOMMENDED: Enhances overall quality

VALIDATION CRITERIA:
- Each mandatory requirement will be scored individually
- Overall section must achieve 85%+ compliance score
- Missing mandatory elements will trigger regeneration
- Professional language and HKEX format standards apply`;

    return enhancedRequirements;
  }

  /**
   * Generate compliance checklist for specific section
   */
  static async generateComplianceChecklist(sectionType: string): Promise<string[]> {
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (!requirements) return [];

    const checklist: string[] = [];

    // Add mandatory requirements to checklist
    requirements.requirements
      .filter(req => req.mandatory)
      .forEach(req => {
        checklist.push(`🔴 MANDATORY: ${req.title} - ${req.description}`);
        req.subsections.forEach(sub => {
          checklist.push(`   • Include: ${sub}`);
        });
        req.disclosures.forEach(disc => {
          checklist.push(`   • Disclose: ${disc}`);
        });
      });

    // Add mandatory tables
    if (requirements.mandatoryTables.length > 0) {
      checklist.push('🔴 MANDATORY TABLES:');
      requirements.mandatoryTables.forEach(table => {
        checklist.push(`   • ${table}`);
      });
    }

    // Add compliance notes
    if (requirements.complianceNotes.length > 0) {
      checklist.push('🔴 COMPLIANCE REQUIREMENTS:');
      requirements.complianceNotes.forEach(note => {
        checklist.push(`   • ${note}`);
      });
    }

    return checklist;
  }

  /**
   * Validate compliance score using semantic analysis
   */
  static async validateComplianceScore(content: string, sectionType: string): Promise<number> {
    try {
      const validation = await complianceValidationService.validateCompliance(content, sectionType);
      return validation.overallScore;
    } catch (error) {
      console.error('Error validating compliance score:', error);
      return 0.5; // Conservative fallback
    }
  }

  /**
   * Check for missing mandatory requirements
   */
  static async checkMissingRequirements(content: string, sectionType: string): Promise<string[]> {
    try {
      const compliance = ipoRequirementsService.checkCompliance(content, sectionType);
      return compliance.missingRequirements.map(req => req.title);
    } catch (error) {
      console.error('Error checking missing requirements:', error);
      return [];
    }
  }

  /**
   * Validate structure requirements
   */
  static async validateStructureRequirements(content: string, sectionType: string): Promise<string[]> {
    const issues: string[] = [];
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    
    if (!requirements) return issues;

    // Check for required tables
    const contentLower = content.toLowerCase();
    requirements.mandatoryTables.forEach(table => {
      if (!contentLower.includes('table') && !contentLower.includes(table.toLowerCase())) {
        issues.push(`Missing required table: ${table}`);
      }
    });

    // Check for format requirements
    requirements.requirements.forEach(req => {
      if (req.formatRequirements) {
        req.formatRequirements.forEach(format => {
          if (format.includes('table') && !contentLower.includes('table')) {
            issues.push(`Format requirement not met: ${format}`);
          }
          if (format.includes('flowchart') && !contentLower.includes('flow')) {
            issues.push(`Format requirement not met: ${format}`);
          }
        });
      }
    });

    // Check section structure
    const expectedSections = requirements.requirements
      .filter(req => req.mandatory)
      .flatMap(req => req.subsections);
    
    const missingSections = expectedSections.filter(section => 
      !contentLower.includes(section.toLowerCase().substring(0, 10))
    );

    if (missingSections.length > expectedSections.length * 0.5) {
      issues.push('Content structure does not match HKEX requirements');
    }

    return issues;
  }

  /**
   * Get minimum content length based on section complexity
   */
  static getMinimumContentLength(sectionType: string): number {
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (!requirements) return 800;

    const mandatoryCount = requirements.requirements.filter(req => req.mandatory).length;
    const baseLength = 800;
    const lengthPerRequirement = 200;
    
    return baseLength + (mandatoryCount * lengthPerRequirement);
  }
}