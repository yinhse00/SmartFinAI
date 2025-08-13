import { supabase } from '@/integrations/supabase/client';
import { IPOSection } from '@/types/ipo';

interface SectionRelationship {
  section: string;
  relatedSections: string[];
  dependencies: string[];
  consistency_checks: string[];
}

/**
 * Service for cross-section analysis and review
 */
export class SectionAnalysisService {
  
  private sectionRelationships: SectionRelationship[] = [
    {
      section: 'business_overview',
      relatedSections: ['financial_information', 'risk_factors', 'directors_management'],
      dependencies: ['company_information'],
      consistency_checks: ['Business segments vs financial reporting segments', 'Revenue sources alignment']
    },
    {
      section: 'financial_information', 
      relatedSections: ['business_overview', 'use_of_proceeds', 'risk_factors'],
      dependencies: ['business_overview'],
      consistency_checks: ['Financial metrics vs business performance', 'Historical trends alignment']
    },
    {
      section: 'risk_factors',
      relatedSections: ['business_overview', 'financial_information', 'regulatory_overview'],
      dependencies: [],
      consistency_checks: ['Risk materiality vs business operations', 'Risk mitigation strategies']
    },
    {
      section: 'use_of_proceeds',
      relatedSections: ['financial_information', 'business_overview', 'future_plans'],
      dependencies: ['financial_information'],
      consistency_checks: ['Proceeds allocation vs business strategy', 'Capital requirements alignment']
    }
  ];

  /**
   * Get related sections for amendment impact analysis
   */
  async getRelatedSections(sectionType: string): Promise<string[]> {
    const relationship = this.sectionRelationships.find(r => r.section === sectionType);
    return relationship?.relatedSections || [];
  }

  /**
   * Fetch content from multiple sections for analysis
   */
  async fetchRelatedContent(projectId: string, sectionTypes: string[]): Promise<Map<string, string>> {
    // Since we don't have direct database access to ipo_sections table yet,
    // return empty map for now - this will be populated when database schema is available
    console.log('Fetching related content for sections:', sectionTypes);
    return new Map<string, string>();
  }

  /**
   * Analyze amendment impact across sections
   */
  async analyzeAmendmentImpact(
    projectId: string,
    targetSection: string,
    proposedChanges: string,
    currentContent: string
  ): Promise<{
    affectedSections: string[];
    consistencyIssues: string[];
    recommendations: string[];
  }> {
    const relatedSections = await this.getRelatedSections(targetSection);
    const relatedContent = await this.fetchRelatedContent(projectId, relatedSections);
    
    const relationship = this.sectionRelationships.find(r => r.section === targetSection);
    const checks = relationship?.consistency_checks || [];
    
    return {
      affectedSections: relatedSections,
      consistencyIssues: checks,
      recommendations: [
        `Review ${relatedSections.join(', ')} sections for consistency`,
        'Ensure all cross-references remain accurate',
        'Update any dependent calculations or metrics'
      ]
    };
  }

  /**
   * Generate cross-section analysis prompt
   */
  generateCrossSectionPrompt(
    targetSection: string,
    userRequest: string,
    currentContent: string,
    relatedContent: Map<string, string>
  ): string {
    const relatedSectionsList = Array.from(relatedContent.keys()).join(', ');
    
    let contextContent = '';
    relatedContent.forEach((content, section) => {
      contextContent += `\n\n${section.toUpperCase()} SECTION:\n${content.substring(0, 1000)}...`;
    });

    return `
You are an expert IPO prospectus reviewer. The user wants to amend the ${targetSection} section.

USER REQUEST: ${userRequest}

CURRENT ${targetSection.toUpperCase()} CONTENT:
${currentContent}

RELATED SECTIONS CONTEXT:${contextContent}

Please:
1. Analyze how the requested changes to ${targetSection} might affect related sections (${relatedSectionsList})
2. Identify any consistency issues that may arise
3. Suggest specific updates needed in related sections
4. Provide the amended content that maintains document-wide coherence

Focus on HKEX compliance and ensure all cross-references and dependencies remain accurate.
`;
  }
}

export const sectionAnalysisService = new SectionAnalysisService();