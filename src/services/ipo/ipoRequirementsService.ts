/**
 * IPO Requirements Service - Comprehensive Hong Kong IPO requirements mapping
 * Based on HKEX App1A requirements and listing rules
 */

export interface IPORequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  subsections: string[];
  disclosures: string[];
  formatRequirements?: string[];
}

export interface SectionRequirements {
  sectionName: string;
  requirements: IPORequirement[];
  mandatoryTables: string[];
  complianceNotes: string[];
}

export class IPORequirementsService {
  private requirements: Record<string, SectionRequirements> = {
    'overview': {
      sectionName: 'Overview',
      requirements: [
        {
          id: 'corporate_profile',
          title: 'Corporate Profile & Background',
          description: 'Nature of business, establishment history, headquarters and operations',
          mandatory: true,
          subsections: ['Nature of the business', 'Year of establishment and corporate history', 'Headquarters and principal operations'],
          disclosures: ['Business registration details', 'Corporate structure', 'Principal place of business']
        },
        {
          id: 'industry_market',
          title: 'Industry & Market Context',
          description: 'Industry trends, market size, growth rates and competitive position',
          mandatory: true,
          subsections: ['Key industry trends', 'Market size, growth rates, and forecasts', 'Competitive position and market share'],
          disclosures: ['Third-party consultant data', 'Market research citations', 'Industry outlook']
        },
        {
          id: 'business_model',
          title: 'Business Model & Segments',
          description: 'Description of services/products, client types and segments',
          mandatory: true,
          subsections: ['Principal services and products', 'Client types and sectors served', 'Revenue model'],
          disclosures: ['Service descriptions', 'Target markets', 'Business segments']
        },
        {
          id: 'key_customers',
          title: 'Key Customers & Track Record',
          description: 'Major customers, relationships and project examples',
          mandatory: true,
          subsections: ['Major customers and relationship length', 'Successful project examples', 'Track record period statistics'],
          disclosures: ['Customer profiles', 'Project completion rates', 'Revenue concentration']
        },
        {
          id: 'competitive_strengths',
          title: 'Competitive Strengths',
          description: 'Differentiating factors and key advantages',
          mandatory: true,
          subsections: ['Differentiating factors', 'Technological capabilities', 'Customer base stability', 'Management experience'],
          disclosures: ['Unique value propositions', 'Technology advantages', 'Team qualifications']
        },
        {
          id: 'financial_highlights',
          title: 'Financial Highlights',
          description: 'Revenue breakdown by business segments',
          mandatory: true,
          subsections: ['Segment revenue breakdown', 'Track record period summary'],
          disclosures: ['Historical financial data', 'Segment performance', 'Growth trends'],
          formatRequirements: ['Summary table format required']
        },
        {
          id: 'business_strategies',
          title: 'Business Strategies',
          description: 'Future growth plans and competitiveness strategies',
          mandatory: true,
          subsections: ['Growth plans', 'Competitiveness enhancement'],
          disclosures: ['Strategic initiatives', 'Investment plans', 'Market expansion']
        }
      ],
      mandatoryTables: ['Financial Highlights Summary', 'Business Segment Breakdown'],
      complianceNotes: ['Must include third-party market data', 'Require management confirmation of accuracy']
    },

    'competitive_strengths': {
      sectionName: 'Competitive Strengths',
      requirements: [
        {
          id: 'business_strategies_detail',
          title: 'Business Strategies',
          description: 'Detailed strategies for growth and market penetration',
          mandatory: true,
          subsections: ['Sales network strengthening', 'Vertical expansion', 'Long-term contracts', 'Acquisitions'],
          disclosures: ['Strategy implementation timeline', 'Resource allocation', 'Expected outcomes']
        },
        {
          id: 'competitive_advantages',
          title: 'Competitive Advantages',
          description: 'Product/service advantages and market penetration costs',
          mandatory: true,
          subsections: ['Product/service advantages', 'Target market advantages', 'Market penetration costs', 'Related risks'],
          disclosures: ['Cost analysis', 'Risk assessment', 'Market positioning']
        },
        {
          id: 'expansion_plans',
          title: 'Expansion Plans',
          description: 'Detailed expansion strategy and implementation',
          mandatory: true,
          subsections: ['Expansion reasons', 'Site selection criteria', 'Capacity expectations', 'Breakeven analysis', 'Investment payback'],
          disclosures: ['Capital expenditure requirements', 'Payment timing', 'Funding sources', 'Implementation timeline']
        },
        {
          id: 'acquisition_targets',
          title: 'Acquisition Strategy',
          description: 'Acquisition targets and selection criteria',
          mandatory: false,
          subsections: ['Target identification', 'Selection criteria'],
          disclosures: ['Due diligence process', 'Integration plans']
        }
      ],
      mandatoryTables: ['Expansion Timeline', 'Capital Expenditure Schedule'],
      complianceNotes: ['Cross-reference with Risk Factors section', 'Include sensitivity analysis']
    },

    'business_model': {
      sectionName: 'Business Model',
      requirements: [
        {
          id: 'business_segments',
          title: 'Business Segments',
          description: 'Nature and functions of each business segment',
          mandatory: true,
          subsections: ['Major functions', 'Scale and contribution', 'Revenue model'],
          disclosures: ['Segment descriptions', 'Financial contribution', 'Operational metrics']
        },
        {
          id: 'revenue_model',
          title: 'Revenue Model',
          description: 'Product/service monetization approach',
          mandatory: true,
          subsections: ['Revenue streams', 'Pricing models', 'Monetization strategies'],
          disclosures: ['Revenue recognition', 'Payment terms', 'Pricing methodology']
        },
        {
          id: 'business_flow',
          title: 'Business Flow',
          description: 'Parties involved and product/service flow',
          mandatory: true,
          subsections: ['Intermediaries involved', 'Product/service flow', 'Fund flow'],
          disclosures: ['Process flowcharts', 'Stakeholder relationships'],
          formatRequirements: ['Flowchart visualization required for complex models']
        },
        {
          id: 'business_focus_changes',
          title: 'Business Focus Changes',
          description: 'Changes in business focus and impact',
          mandatory: false,
          subsections: ['Reasons for changes', 'Cost structure impact', 'Profit margin changes', 'Risk profile changes'],
          disclosures: ['Change rationale', 'Financial impact', 'Risk assessment']
        }
      ],
      mandatoryTables: ['Revenue Model Summary', 'Business Segment Contribution'],
      complianceNotes: ['Include flowcharts for complex models', 'Validate revenue recognition policies']
    },

    'products_services': {
      sectionName: 'Products and Services',
      requirements: [
        {
          id: 'product_types',
          title: 'Product and Service Types',
          description: 'Product types, lifecycle, seasonality and mix changes',
          mandatory: true,
          subsections: ['Product types', 'Service types', 'Product lifecycle', 'Seasonality factors', 'Product mix changes'],
          disclosures: ['Product categories', 'Service offerings', 'Historical mix changes']
        },
        {
          id: 'product_details',
          title: 'Product Details',
          description: 'Product pictures, pricing and trends',
          mandatory: true,
          subsections: ['Product pictures', 'Price ranges by brand/type', 'Material price fluctuations', 'Future price trends'],
          disclosures: ['Visual documentation', 'Pricing strategy', 'Market pricing analysis']
        },
        {
          id: 'warranty_returns',
          title: 'Warranty and Returns',
          description: 'Return policies, warranty terms and liability',
          mandatory: true,
          subsections: ['Return policy', 'Warranty terms', 'Provisioning policy', 'Liability allocation'],
          disclosures: ['Policy documentation', 'Historical warranty expenses', 'Supplier liability arrangements']
        },
        {
          id: 'customer_complaints',
          title: 'Customer Service',
          description: 'Complaint policies and material incidents',
          mandatory: true,
          subsections: ['Complaint policies', 'Handling procedures', 'Material complaints during track record'],
          disclosures: ['Complaint statistics', 'Resolution procedures', 'Compensation details', 'Control measures']
        }
      ],
      mandatoryTables: ['Product Portfolio Summary', 'Warranty Expense History'],
      complianceNotes: ['Include product liability assessment', 'Document quality control measures']
    },

    'major_customers': {
      sectionName: 'Major Customers',
      requirements: [
        {
          id: 'customer_details',
          title: 'Customer Information',
          description: 'Top 5 customers identification and background',
          mandatory: true,
          subsections: ['Customer identities', 'Business activities', 'Operation size', 'Location', 'Products/services purchased', 'Relationship duration', 'Connected person status', 'Credit terms'],
          disclosures: ['Customer profiles', 'Relationship history', 'Payment terms']
        },
        {
          id: 'customer_revenue',
          title: 'Customer Revenue',
          description: 'Revenue from top 5 customers and terms',
          mandatory: true,
          subsections: ['Revenue amounts and percentages', 'Key commercial terms', 'Material deviations'],
          disclosures: ['Financial contribution', 'Contract terms', 'Payment performance'],
          formatRequirements: ['Tabular format required for Top Five Customers']
        },
        {
          id: 'long_term_agreements',
          title: 'Long-term Agreements',
          description: 'Detailed terms and enforceability',
          mandatory: true,
          subsections: ['Agreement duration', 'Minimum commitments', 'Penalties', 'Price adjustments', 'Renewal/termination clauses'],
          disclosures: ['Contract summaries', 'Breach history', 'Enforceability assessment']
        },
        {
          id: 'concentration_risks',
          title: 'Concentration Risks',
          description: 'Customer concentration and counterparty risks',
          mandatory: true,
          subsections: ['Concentration analysis', 'Counterparty risks', 'Geographic distribution'],
          disclosures: ['Risk assessment', 'Mitigation strategies', 'Geographic breakdown']
        }
      ],
      mandatoryTables: ['Top Five Customers by Track Record Period'],
      complianceNotes: ['Verify connected party disclosures', 'Assess customer concentration risks']
    },

    'major_suppliers': {
      sectionName: 'Major Suppliers',
      requirements: [
        {
          id: 'supplier_details',
          title: 'Supplier Information',
          description: 'Top 5 suppliers identification and background',
          mandatory: true,
          subsections: ['Supplier identities', 'Business activities', 'Operation size', 'Location', 'Products/services supplied', 'Relationship duration', 'Connected person status', 'Credit terms'],
          disclosures: ['Supplier profiles', 'Relationship history', 'Payment terms']
        },
        {
          id: 'supplier_costs',
          title: 'Supplier Costs',
          description: 'Costs from top 5 suppliers and terms',
          mandatory: true,
          subsections: ['Cost amounts and percentages', 'Key commercial terms', 'Material deviations'],
          disclosures: ['Cost contribution', 'Contract terms', 'Payment performance'],
          formatRequirements: ['Tabular format required for Top Five Suppliers']
        },
        {
          id: 'supply_chain_risks',
          title: 'Supply Chain Management',
          description: 'Supply risks and management measures',
          mandatory: true,
          subsections: ['Concentration risks', 'Shortage management', 'Price fluctuation management', 'Inventory control'],
          disclosures: ['Risk mitigation', 'Alternative suppliers', 'Cost sensitivity analysis']
        }
      ],
      mandatoryTables: ['Top Five Suppliers by Track Record Period'],
      complianceNotes: ['Verify supply chain sustainability', 'Assess supplier dependency risks']
    }

    // Continue with other sections...
  };

  /**
   * Get comprehensive requirements for a section
   */
  getRequirements(sectionType: string): SectionRequirements | null {
    const normalizedType = this.normalizeSectionType(sectionType);
    return this.requirements[normalizedType] || null;
  }

  /**
   * Get all mandatory requirements for a section
   */
  getMandatoryRequirements(sectionType: string): IPORequirement[] {
    const requirements = this.getRequirements(sectionType);
    return requirements?.requirements.filter(req => req.mandatory) || [];
  }

  /**
   * Check content against requirements
   */
  checkCompliance(content: string, sectionType: string): {
    missingRequirements: IPORequirement[];
    missingTables: string[];
    complianceScore: number;
    recommendations: string[];
  } {
    const requirements = this.getRequirements(sectionType);
    if (!requirements) {
      return {
        missingRequirements: [],
        missingTables: [],
        complianceScore: 0.7,
        recommendations: ['Section type not recognized - apply general IPO standards']
      };
    }

    const contentLower = content.toLowerCase();
    const missingRequirements: IPORequirement[] = [];
    const missingTables: string[] = [];
    const recommendations: string[] = [];

    // Check mandatory requirements
    requirements.requirements.forEach(req => {
      if (req.mandatory) {
        const hasRequirement = req.subsections.some(subsection => 
          contentLower.includes(subsection.toLowerCase()) ||
          req.disclosures.some(disclosure => contentLower.includes(disclosure.toLowerCase()))
        );

        if (!hasRequirement) {
          missingRequirements.push(req);
          recommendations.push(`Add ${req.title}: ${req.description}`);
        }
      }
    });

    // Check mandatory tables
    requirements.mandatoryTables.forEach(table => {
      if (!contentLower.includes('table') && !contentLower.includes(table.toLowerCase())) {
        missingTables.push(table);
        recommendations.push(`Include required table: ${table}`);
      }
    });

    // Calculate compliance score
    const totalMandatory = requirements.requirements.filter(req => req.mandatory).length;
    const met = totalMandatory - missingRequirements.length;
    const complianceScore = totalMandatory > 0 ? met / totalMandatory : 0.7;

    return {
      missingRequirements,
      missingTables,
      complianceScore,
      recommendations
    };
  }

  /**
   * Get detailed requirements for AI prompting
   */
  getDetailedRequirements(sectionType: string): string {
    const requirements = this.getRequirements(sectionType);
    if (!requirements) return 'Apply general IPO disclosure standards';

    let prompt = `\n=== ${requirements.sectionName.toUpperCase()} SECTION REQUIREMENTS ===\n\n`;
    
    requirements.requirements.forEach((req, index) => {
      prompt += `${index + 1}. ${req.title.toUpperCase()}\n`;
      prompt += `   Description: ${req.description}\n`;
      prompt += `   Required Elements:\n`;
      req.subsections.forEach(sub => prompt += `   • ${sub}\n`);
      prompt += `   Must Disclose:\n`;
      req.disclosures.forEach(disc => prompt += `   • ${disc}\n`);
      if (req.formatRequirements) {
        prompt += `   Format Requirements:\n`;
        req.formatRequirements.forEach(format => prompt += `   • ${format}\n`);
      }
      prompt += `\n`;
    });

    if (requirements.mandatoryTables.length > 0) {
      prompt += `MANDATORY TABLES:\n`;
      requirements.mandatoryTables.forEach(table => prompt += `• ${table}\n`);
      prompt += `\n`;
    }

    prompt += `COMPLIANCE NOTES:\n`;
    requirements.complianceNotes.forEach(note => prompt += `• ${note}\n`);

    return prompt;
  }

  private normalizeSectionType(sectionType: string): string {
    const typeMap: Record<string, string> = {
      'business_overview': 'overview',
      'overview': 'overview',
      'competitive_strengths': 'competitive_strengths',
      'business_model': 'business_model',
      'products_and_services': 'products_services',
      'products': 'products_services',
      'services': 'products_services',
      'major_customers': 'major_customers',
      'customers': 'major_customers',
      'major_suppliers': 'major_suppliers',
      'suppliers': 'major_suppliers'
    };

    return typeMap[sectionType.toLowerCase()] || sectionType.toLowerCase();
  }
}

export const ipoRequirementsService = new IPORequirementsService();