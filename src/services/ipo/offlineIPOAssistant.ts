/**
 * Offline IPO Assistant - Provides basic guidance without API calls
 * Uses local HKEX database and static guidance when AI services are unavailable
 */

import { supabase } from '@/integrations/supabase/client';

interface OfflineResponse {
  type: 'OFFLINE_GUIDANCE' | 'OFFLINE_TEMPLATE' | 'OFFLINE_REQUIREMENTS';
  message: string;
  suggestions?: string[];
  templateContent?: string;
  confidence: number;
}

export class OfflineIPOAssistant {
  /**
   * Provide offline assistance for IPO content
   */
  async getOfflineAssistance(
    userMessage: string,
    sectionType: string,
    currentContent: string
  ): Promise<OfflineResponse> {
    try {
      // Check what type of help user needs
      const intent = this.analyzeUserIntent(userMessage);
      
      switch (intent) {
        case 'requirements':
          return await this.getOfflineRequirements(sectionType);
        case 'template':
          return await this.getOfflineTemplate(sectionType);
        case 'guidance':
        default:
          return this.getOfflineGuidance(sectionType, currentContent);
      }
    } catch (error) {
      console.error('Offline assistance error:', error);
      return this.getBasicFallback(sectionType);
    }
  }

  /**
   * Get HKEX requirements from database without AI
   */
  private async getOfflineRequirements(sectionType: string): Promise<OfflineResponse> {
    try {
      const { data: guidance } = await supabase
        .from('ipo_prospectus_section_guidance')
        .select('Section, "contents requirements", Guidance, references')
        .ilike('Section', `%${this.mapSectionType(sectionType)}%`)
        .limit(3);

      if (guidance && guidance.length > 0) {
        const requirements = guidance.map(g => 
          `**${g.Section}**: ${g['contents requirements'] || g.Guidance || 'Standard HKEX requirements'}`
        );

        return {
          type: 'OFFLINE_REQUIREMENTS',
          message: `**HKEX Requirements for ${this.getSectionTitle(sectionType)}**\n\n${requirements.join('\n\n')}\n\n*Note: Operating in offline mode. For AI-powered content generation, please configure your API key.*`,
          suggestions: [
            'Review each requirement carefully',
            'Ensure all mandatory disclosures are included',
            'Reference specific HKEX listing rules where applicable',
            'Consider industry-specific requirements'
          ],
          confidence: 0.9
        };
      }
    } catch (error) {
      console.warn('Error fetching offline requirements:', error);
    }

    return this.getBasicRequirements(sectionType);
  }

  /**
   * Get template content from database without AI
   */
  private async getOfflineTemplate(sectionType: string): Promise<OfflineResponse> {
    try {
      if (sectionType === 'business') {
        const { data: template } = await supabase
          .from('ipo_section_business_templates')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (template) {
          const templateAreas = [
            'Overview', 'Competitive Strengths', 'Business Strategies',
            'Business Model', 'Customers', 'Competition', 'Future Plan'
          ].filter(area => template[area]);

          const templateContent = templateAreas.map(area => 
            `**${area}**\n${template[area]?.substring(0, 200)}...`
          ).join('\n\n');

          return {
            type: 'OFFLINE_TEMPLATE',
            message: `**Business Section Template (Based on HKEX Examples)**\n\n${templateContent}\n\n*Note: This is template guidance. Customize with your company's specific information.*`,
            templateContent,
            suggestions: [
              'Replace template placeholders with company-specific information',
              'Ensure all sections are relevant to your business',
              'Add detailed examples and metrics',
              'Include regulatory compliance statements'
            ],
            confidence: 0.8
          };
        }
      }
    } catch (error) {
      console.warn('Error fetching offline template:', error);
    }

    return this.getBasicTemplate(sectionType);
  }

  /**
   * Provide basic offline guidance
   */
  private getOfflineGuidance(sectionType: string, currentContent: string): OfflineResponse {
    const hasContent = currentContent && currentContent.trim().length > 50;
    const sectionTitle = this.getSectionTitle(sectionType);
    
    const basicGuidance = this.getBasicSectionGuidance(sectionType);
    
    let message = `**Offline Guidance for ${sectionTitle}**\n\n`;
    
    if (!hasContent) {
      message += `No content detected. Here's what you should include:\n\n${basicGuidance.join('\n')}`;
    } else {
      message += `Current content: ${currentContent.length} characters\n\n`;
      message += `Key areas to review:\n\n${basicGuidance.join('\n')}`;
    }
    
    message += '\n\n*For detailed AI assistance and content generation, please configure your API key in settings.*';

    return {
      type: 'OFFLINE_GUIDANCE',
      message,
      suggestions: [
        'Connect to internet for AI-powered analysis',
        'Review HKEX listing rules manually',
        'Compare with similar company prospectuses',
        'Ensure compliance with disclosure requirements'
      ],
      confidence: 0.6
    };
  }

  private analyzeUserIntent(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('requirement') || message.includes('rule') || message.includes('must')) {
      return 'requirements';
    }
    if (message.includes('template') || message.includes('example') || message.includes('format')) {
      return 'template';
    }
    return 'guidance';
  }

  private mapSectionType(sectionType: string): string {
    const mappings = {
      'business': 'Business',
      'financial': 'Financial Information',
      'risk': 'Risk Factors',
      'use_of_proceeds': 'Use of Proceeds',
      'directors': 'Directors',
      'shareholding': 'Shareholding Structure'
    };
    return mappings[sectionType] || sectionType;
  }

  private getSectionTitle(sectionType: string): string {
    const titles = {
      'business': 'Business Overview',
      'financial': 'Financial Information',
      'risk': 'Risk Factors',
      'use_of_proceeds': 'Use of Proceeds',
      'directors': 'Directors and Senior Management',
      'shareholding': 'Shareholding Structure'
    };
    return titles[sectionType] || 'Section Content';
  }

  private getBasicSectionGuidance(sectionType: string): string[] {
    const guidance = {
      'business': [
        '• Comprehensive business overview and history',
        '• Competitive strengths and market position',
        '• Business model and revenue streams',
        '• Future development plans and strategies',
        '• Key customers, suppliers, and partnerships',
        '• Risk management and internal controls'
      ],
      'financial': [
        '• Historical financial performance (3 years)',
        '• Key financial metrics and ratios',
        '• Revenue recognition policies',
        '• Profit margin analysis',
        '• Cash flow and liquidity position',
        '• Debt structure and financing arrangements'
      ],
      'risk': [
        '• Business and operational risks',
        '• Market and competition risks',
        '• Regulatory and compliance risks',
        '• Financial and liquidity risks',
        '• Technology and cyber security risks',
        '• ESG and sustainability risks'
      ],
      'directors': [
        '• Directors and senior management profiles',
        '• Qualifications and experience',
        '• Roles and responsibilities',
        '• Compensation and benefits',
        '• Share ownership and interests',
        '• Corporate governance experience'
      ]
    };
    
    return guidance[sectionType] || [
      '• Complete and accurate disclosure',
      '• Compliance with HKEX requirements',
      '• Clear and investor-friendly language',
      '• Relevant examples and supporting data'
    ];
  }

  private getBasicRequirements(sectionType: string): OfflineResponse {
    return {
      type: 'OFFLINE_REQUIREMENTS',
      message: `**Basic HKEX Requirements for ${this.getSectionTitle(sectionType)}**\n\n${this.getBasicSectionGuidance(sectionType).join('\n')}\n\n*Note: These are general guidelines. For specific HKEX requirements, please review the listing rules or connect to internet for detailed guidance.*`,
      suggestions: [
        'Review HKEX App1A Part A requirements',
        'Check specific listing rule provisions',
        'Consider industry-specific requirements',
        'Ensure complete and accurate disclosure'
      ],
      confidence: 0.5
    };
  }

  private getBasicTemplate(sectionType: string): OfflineResponse {
    const templateStructure = this.getBasicSectionGuidance(sectionType)
      .map(item => `${item}\n[Your content here]\n`)
      .join('\n');

    return {
      type: 'OFFLINE_TEMPLATE',
      message: `**Basic Template for ${this.getSectionTitle(sectionType)}**\n\n${templateStructure}\n\n*Note: This is a basic structure. For detailed templates with examples, please connect to internet.*`,
      templateContent: templateStructure,
      suggestions: [
        'Replace placeholders with specific information',
        'Add detailed examples and data',
        'Ensure HKEX compliance',
        'Review similar company disclosures'
      ],
      confidence: 0.4
    };
  }

  private getBasicFallback(sectionType: string): OfflineResponse {
    return {
      type: 'OFFLINE_GUIDANCE',
      message: `**Offline Mode - Basic Assistance**\n\nI'm operating in offline mode with limited functionality. For the ${this.getSectionTitle(sectionType)} section, please:\n\n• Review HKEX listing rules manually\n• Ensure complete disclosure of required information\n• Use professional, investor-friendly language\n• Include relevant examples and supporting data\n\n*To access full AI assistance, please configure your API key in settings.*`,
      suggestions: [
        'Connect to internet for full AI assistance',
        'Review HKEX guidance documents',
        'Check similar company prospectuses',
        'Consult with legal and financial advisors'
      ],
      confidence: 0.3
    };
  }
}

export const offlineIPOAssistant = new OfflineIPOAssistant();