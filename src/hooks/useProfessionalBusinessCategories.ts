import { useMemo } from 'react';
import { useSectionGuidance } from './useSectionGuidance';
import { 
  Building2, 
  Target, 
  Package, 
  Settings, 
  Truck, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  Award,
  Brain,
  FileText,
  Home,
  LucideIcon
} from 'lucide-react';

export interface ProfessionalBusinessField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'percentage';
  required: boolean;
  placeholder: string;
  description: string;
  hkexReference?: string;
  professionalGuidance?: string;
  minLength?: number;
  maxLength?: number;
  validation?: (value: string) => string | null;
}

export interface ProfessionalBusinessCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  fields: ProfessionalBusinessField[];
  hkexSection: string;
  professionalRequirements: string[];
  documentTypes: string[];
  suggestedDocuments: string[];
}

export const useProfessionalBusinessCategories = () => {
  const { data: guidanceData, loading } = useSectionGuidance('Business');

  const categories: ProfessionalBusinessCategory[] = useMemo(() => [
    {
      id: 'business-model',
      name: 'Business Model & Revenue',
      shortName: 'Model',
      description: 'Nature of business, revenue model, and product/service monetisation',
      icon: Building2,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Nature and major functions of each business segment',
        'Revenue model and product/service monetisation',
        'Business model complexity with flowcharts if applicable',
        'Changes in business focus and related cost structure impacts'
      ],
      documentTypes: ['business', 'financial'],
      suggestedDocuments: ['Business plan', 'Revenue model charts', 'Organizational structure', 'Segment analysis'],
      fields: [
        {
          id: 'business_nature',
          label: 'Nature of Business',
          type: 'textarea',
          required: true,
          placeholder: 'Describe the nature and major functions of each business segment, their scale and contribution...',
          description: 'Detailed description of business nature, segments, and their respective contributions to overall operations',
          hkexReference: 'Chapter 3.7(i)',
          professionalGuidance: 'Must include nature and major functions of each business segment, their scale and contribution',
          minLength: 100,
          maxLength: 1000
        },
        {
          id: 'revenue_model',
          label: 'Revenue Model & Monetisation',
          type: 'textarea',
          required: true,
          placeholder: 'Explain your revenue model and how products/services are monetised...',
          description: 'Comprehensive explanation of revenue generation mechanisms and monetisation strategies',
          hkexReference: 'Chapter 3.7(ii)',
          professionalGuidance: 'Must detail revenue model and product/service monetisation mechanisms',
          minLength: 150,
          maxLength: 1500
        },
        {
          id: 'business_complexity',
          label: 'Business Model Complexity',
          type: 'textarea',
          required: false,
          placeholder: 'If the business model is complicated, describe different parties/intermediaries and flow of products/services...',
          description: 'For complex business models, detail parties involved and flow of products/services with explanatory diagrams',
          hkexReference: 'Chapter 3.7(iii)',
          professionalGuidance: 'Required for complicated business models - include flowcharts showing parties/intermediaries',
          minLength: 100,
          maxLength: 1000
        },
        {
          id: 'business_changes',
          label: 'Business Focus Changes',
          type: 'textarea',
          required: false,
          placeholder: 'Describe any changes or proposed changes in business focus, reasons, and impact on cost structure...',
          description: 'Changes in business focus, rationale, and impacts on cost structure, profit margins, and risk profile',
          hkexReference: 'Chapter 3.7(iv)',
          professionalGuidance: 'Include reasons for changes and related impacts on cost structure, profit margins, and risk profile',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'products-services',
      name: 'Products & Services',
      shortName: 'Products',
      description: 'Product types, lifecycle, pricing, and warranty policies',
      icon: Package,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Product and service types with lifecycle analysis',
        'Pricing ranges by brands and product types',
        'Product returns and warranty policies',
        'Customer complaints handling procedures'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Product catalogs', 'Pricing schedules', 'Warranty policies', 'Customer service procedures'],
      fields: [
        {
          id: 'product_types',
          label: 'Product & Service Types',
          type: 'textarea',
          required: true,
          placeholder: 'Detail product and service types, product life cycle, seasonality, and changes during track record period...',
          description: 'Comprehensive overview of product/service portfolio including lifecycle and seasonal variations',
          hkexReference: 'Chapter 3.7 Products(i)',
          professionalGuidance: 'Must include product types, lifecycle, seasonality, and track record period changes',
          minLength: 150,
          maxLength: 1200
        },
        {
          id: 'pricing_structure',
          label: 'Pricing Structure & Trends',
          type: 'textarea',
          required: true,
          placeholder: 'Provide price ranges by brands and product types, reasons for fluctuations, and future price trends...',
          description: 'Detailed pricing information including ranges, fluctuation analysis, and trend projections',
          hkexReference: 'Chapter 3.7 Products(ii)',
          professionalGuidance: 'Include pictures of products, price ranges by brands/types, material fluctuation reasons, future trends',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'warranty_returns',
          label: 'Warranty & Returns Policy',
          type: 'textarea',
          required: true,
          placeholder: 'Detail product returns policy, warranty terms, time periods, and provisioning policies...',
          description: 'Comprehensive warranty and returns framework including terms, periods, and liability allocation',
          hkexReference: 'Chapter 3.7 Returns(i-iii)',
          professionalGuidance: 'Must cover returns policy, warranty terms/periods, liability allocation with suppliers',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'customer_complaints',
          label: 'Customer Complaints Management',
          type: 'textarea',
          required: true,
          placeholder: 'Describe customer complaints policies, handling procedures, and material complaints during track record...',
          description: 'Customer complaints framework and track record of material complaints with resolutions',
          hkexReference: 'Chapter 3.7 Returns(iv)',
          professionalGuidance: 'Include complaints handling procedures and material complaints during track record period',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'production-operations',
      name: 'Production & Operations',
      shortName: 'Operations',
      description: 'Production processes, capacity utilisation, and operational efficiency',
      icon: Settings,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Operation flows and production processes in flowcharts',
        'Production capacity and utilisation rates by category',
        'Major assets and equipment particulars',
        'Basis of calculating utilisation rates'
      ],
      documentTypes: ['business', 'technical'],
      suggestedDocuments: ['Process flowcharts', 'Capacity studies', 'Equipment lists', 'Facility layouts'],
      fields: [
        {
          id: 'production_processes',
          label: 'Production Processes & Flows',
          type: 'textarea',
          required: true,
          placeholder: 'Describe operation flows and production processes with time for each critical process...',
          description: 'Detailed production workflow including time requirements for critical processes',
          hkexReference: 'Chapter 3.7 Production(i)',
          professionalGuidance: 'Must include operation flows and production processes/time in flowcharts for each critical process',
          minLength: 150,
          maxLength: 1200
        },
        {
          id: 'capacity_utilisation',
          label: 'Capacity & Utilisation',
          type: 'textarea',
          required: true,
          placeholder: 'Provide particulars, capacity and utilisation rate of production facilities by major product category...',
          description: 'Production capacity analysis including utilisation rates and efficiency metrics by product category',
          hkexReference: 'Chapter 3.7 Production(ii-iii)',
          professionalGuidance: 'Include capacity, utilisation rates by category, calculation basis, and explain fluctuations',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'assets_equipment',
          label: 'Major Assets & Equipment',
          type: 'textarea',
          required: true,
          placeholder: 'Detail major assets and equipment - leased/owned, maintenance history, age, depreciation...',
          description: 'Comprehensive asset inventory including ownership status, condition, and replacement schedules',
          hkexReference: 'Chapter 3.7 Production(iv)',
          professionalGuidance: 'Must cover leased/owned status, maintenance history, age, depreciation method, replacement timeline',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'suppliers-materials',
      name: 'Suppliers & Raw Materials',
      shortName: 'Supply',
      description: 'Supplier relationships, raw materials sourcing, and inventory management',
      icon: Truck,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Five largest suppliers identification and background',
        'Costs and commercial terms with largest suppliers',
        'Long-term agreement details and enforceability',
        'Raw material sourcing countries and concentration risks'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Supplier agreements', 'Purchase records', 'Inventory reports', 'Supply chain maps'],
      fields: [
        {
          id: 'largest_suppliers',
          label: 'Five Largest Suppliers',
          type: 'textarea',
          required: true,
          placeholder: 'Identify and describe the five largest suppliers including background, business activities, relationship duration...',
          description: 'Comprehensive profiles of top five suppliers including operational details and relationship history',
          hkexReference: 'Chapter 3.7 Suppliers(i)',
          professionalGuidance: 'Must include identities, background, business activities, size, location, products supplied, relationship years, connected person status',
          minLength: 200,
          maxLength: 1500
        },
        {
          id: 'supplier_costs_terms',
          label: 'Supplier Costs & Terms',
          type: 'textarea',
          required: true,
          placeholder: 'Detail costs/purchases from five largest suppliers in dollar and percentage terms, key commercial terms...',
          description: 'Financial analysis of supplier relationships including costs, terms, and material deviations',
          hkexReference: 'Chapter 3.7 Suppliers(ii)',
          professionalGuidance: 'Include costs in dollar/percentage terms for each year/period, key commercial terms, material deviations',
          minLength: 150,
          maxLength: 1000
        },
        {
          id: 'longterm_agreements',
          label: 'Long-term Supplier Agreements',
          type: 'textarea',
          required: false,
          placeholder: 'Describe long-term agreements including duration, minimum commitments, penalties, renewal clauses...',
          description: 'Analysis of long-term supplier contracts including terms, enforceability, and breach history',
          hkexReference: 'Chapter 3.7 Suppliers(iii)',
          professionalGuidance: 'Detail duration, minimum purchase commitments, penalties, price adjustments, renewal/termination, enforceability, breaches',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'sourcing_risks',
          label: 'Sourcing Countries & Risks',
          type: 'textarea',
          required: true,
          placeholder: 'List major countries for raw material purchases, concentration risks, and risk management measures...',
          description: 'Geographic sourcing analysis with risk assessment and mitigation strategies',
          hkexReference: 'Chapter 3.7 Suppliers(iv-v)',
          professionalGuidance: 'Include major sourcing countries, concentration/counterparty risks, sensitivity analysis',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'customers-market',
      name: 'Customers & Market',
      shortName: 'Market',
      description: 'Customer base analysis, market position, and distribution channels',
      icon: Users,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Five largest customers identification and relationship details',
        'Customer concentration analysis and risks',
        'Sales channels and distribution networks',
        'Customer credit management and collection'
      ],
      documentTypes: ['business', 'market'],
      suggestedDocuments: ['Customer agreements', 'Market analysis', 'Sales reports', 'Distribution agreements'],
      fields: [
        {
          id: 'largest_customers',
          label: 'Five Largest Customers',
          type: 'textarea',
          required: true,
          placeholder: 'Identify five largest customers, their background, business relationship, and commercial terms...',
          description: 'Detailed analysis of key customer relationships including background and commercial arrangements',
          hkexReference: 'Chapter 3.7 Customers(i)',
          professionalGuidance: 'Must include identities, background, business activities, relationship duration, connected person status, credit terms',
          minLength: 150,
          maxLength: 1200
        },
        {
          id: 'customer_concentration',
          label: 'Customer Concentration & Risks',
          type: 'textarea',
          required: true,
          placeholder: 'Analyze customer concentration risks, revenue percentages, and risk mitigation strategies...',
          description: 'Customer concentration analysis with revenue impact assessment and risk management',
          hkexReference: 'Chapter 3.7 Customers(ii)',
          professionalGuidance: 'Include concentration analysis, revenue percentages, risks, and mitigation measures',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'sales_channels',
          label: 'Sales Channels & Distribution',
          type: 'textarea',
          required: true,
          placeholder: 'Describe sales channels, distribution networks, and go-to-market strategies...',
          description: 'Comprehensive overview of sales and distribution infrastructure',
          hkexReference: 'Chapter 3.7 Customers(iii)',
          professionalGuidance: 'Detail sales channels, distribution methods, geographical coverage, channel management',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'credit_management',
          label: 'Customer Credit Management',
          type: 'textarea',
          required: false,
          placeholder: 'Explain customer credit policies, collection procedures, and bad debt management...',
          description: 'Customer credit framework including policies, collection processes, and bad debt handling',
          professionalGuidance: 'Include credit assessment procedures, collection policies, bad debt provisions',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'competitive-strategy',
      name: 'Competitive Strategy',
      shortName: 'Strategy',
      description: 'Competitive advantages, market strategies, and expansion plans',
      icon: Target,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Business strategies and competitive advantages',
        'Targeted markets and penetration costs',
        'Expansion plans with financial projections',
        'Acquisition targets and selection criteria'
      ],
      documentTypes: ['business', 'financial'],
      suggestedDocuments: ['Strategic plans', 'Market research', 'Expansion studies', 'Acquisition analyses'],
      fields: [
        {
          id: 'business_strategies',
          label: 'Business Strategies',
          type: 'textarea',
          required: true,
          placeholder: 'Detail business strategies such as strengthening sales network, vertical expansion, long-term contracts...',
          description: 'Comprehensive business strategy framework including key strategic initiatives',
          hkexReference: 'Chapter 3.7 Strategies(i)',
          professionalGuidance: 'Include strengthening sales network, vertical expansion, long-term contracts, acquisitions',
          minLength: 150,
          maxLength: 1000
        },
        {
          id: 'competitive_advantages',
          label: 'Competitive Advantages & Markets',
          type: 'textarea',
          required: true,
          placeholder: 'Explain competitive advantages of products/services, targeted markets, penetration costs, and related risks...',
          description: 'Analysis of competitive positioning including market penetration strategies and associated risks',
          hkexReference: 'Chapter 3.7 Strategies(ii)',
          professionalGuidance: 'Detail competitive advantages, targeted markets, market penetration costs, related risks in Risk Factors section',
          minLength: 150,
          maxLength: 1200
        },
        {
          id: 'expansion_plans',
          label: 'Expansion Plans',
          type: 'textarea',
          required: false,
          placeholder: 'Describe expansion plans including reasons, site selection, capacity expectations, investment requirements...',
          description: 'Detailed expansion strategy with financial projections and implementation timeline',
          hkexReference: 'Chapter 3.7 Strategies(iii)',
          professionalGuidance: 'Include reasons, site selection, expected capacity, breakeven/payback periods, implementation timeline, capex, funding sources',
          minLength: 100,
          maxLength: 1000
        },
        {
          id: 'acquisition_targets',
          label: 'Acquisition Targets',
          type: 'textarea',
          required: false,
          placeholder: 'Detail identified acquisition targets and selection criteria...',
          description: 'Analysis of potential acquisition opportunities and evaluation framework',
          hkexReference: 'Chapter 3.7 Strategies(iv)',
          professionalGuidance: 'Include details of identified acquisition targets and selection criteria',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'quality-compliance',
      name: 'Quality & Compliance',
      shortName: 'Quality',
      description: 'Quality control systems, certifications, and regulatory compliance',
      icon: ShieldCheck,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Quality control systems and standards',
        'Industry certifications and compliance frameworks',
        'Regulatory requirements and compliance status',
        'Quality assurance processes and monitoring'
      ],
      documentTypes: ['legal', 'technical'],
      suggestedDocuments: ['Quality certificates', 'Compliance reports', 'Audit reports', 'Standard procedures'],
      fields: [
        {
          id: 'quality_control',
          label: 'Quality Control Systems',
          type: 'textarea',
          required: true,
          placeholder: 'Describe quality control processes, standards, and quality assurance systems...',
          description: 'Comprehensive quality management framework including processes and standards',
          professionalGuidance: 'Detail quality management systems, standards compliance, quality assurance processes',
          minLength: 120,
          maxLength: 800
        },
        {
          id: 'certifications',
          label: 'Certifications & Standards',
          type: 'textarea',
          required: false,
          placeholder: 'List relevant industry certifications, quality standards, and compliance frameworks...',
          description: 'Industry certifications and standards compliance status',
          professionalGuidance: 'Include relevant certifications, quality standards, compliance frameworks',
          minLength: 80,
          maxLength: 600
        },
        {
          id: 'regulatory_compliance',
          label: 'Regulatory Compliance',
          type: 'textarea',
          required: true,
          placeholder: 'Detail key regulatory requirements, compliance status, and regulatory relationships...',
          description: 'Regulatory compliance framework and status across all applicable jurisdictions',
          professionalGuidance: 'Include applicable regulations, compliance status, regulatory authority relationships',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'intellectual-property',
      name: 'Intellectual Property',
      shortName: 'IP',
      description: 'Patents, trademarks, R&D activities, and technology assets',
      icon: Brain,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Patent portfolio and trademark registrations',
        'Research and development activities',
        'Technology licensing agreements',
        'IP protection and enforcement strategies'
      ],
      documentTypes: ['legal', 'technical'],
      suggestedDocuments: ['Patent certificates', 'Trademark registrations', 'R&D reports', 'License agreements'],
      fields: [
        {
          id: 'ip_portfolio',
          label: 'IP Portfolio',
          type: 'textarea',
          required: false,
          placeholder: 'Detail patent portfolio, trademark registrations, and other intellectual property assets...',
          description: 'Comprehensive intellectual property asset inventory and protection status',
          professionalGuidance: 'Include patents, trademarks, copyrights, trade secrets, protection status',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'research_development',
          label: 'Research & Development',
          type: 'textarea',
          required: false,
          placeholder: 'Describe R&D activities, innovation processes, and technology development...',
          description: 'R&D framework including activities, investments, and innovation pipeline',
          professionalGuidance: 'Detail R&D activities, expenditure, innovation processes, technology roadmap',
          minLength: 80,
          maxLength: 600
        },
        {
          id: 'licensing_agreements',
          label: 'Technology Licensing',
          type: 'textarea',
          required: false,
          placeholder: 'Detail technology licensing agreements, both inbound and outbound...',
          description: 'Technology licensing framework including agreements and revenue streams',
          professionalGuidance: 'Include licensing agreements, terms, revenue/costs, IP dependencies',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'human-resources',
      name: 'Human Resources',
      shortName: 'HR',
      description: 'Employee structure, key personnel, and HR policies',
      icon: Users,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Employee structure and headcount analysis',
        'Key personnel and management team',
        'HR policies and employee relations',
        'Training and development programs'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Organizational charts', 'HR policies', 'Employment agreements', 'Training records'],
      fields: [
        {
          id: 'employee_structure',
          label: 'Employee Structure',
          type: 'textarea',
          required: true,
          placeholder: 'Describe employee structure, headcount by function, geographical distribution...',
          description: 'Comprehensive employee analysis including structure, distribution, and demographics',
          professionalGuidance: 'Include headcount by function/geography, employee structure, key demographics',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'key_personnel',
          label: 'Key Personnel',
          type: 'textarea',
          required: true,
          placeholder: 'Detail key management personnel, their backgrounds, and roles...',
          description: 'Key personnel profiles including backgrounds, roles, and importance to operations',
          professionalGuidance: 'Include key management profiles, backgrounds, roles, succession planning',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'hr_policies',
          label: 'HR Policies & Relations',
          type: 'textarea',
          required: false,
          placeholder: 'Describe HR policies, employee relations, compensation framework...',
          description: 'Human resources framework including policies, relations, and compensation',
          professionalGuidance: 'Include HR policies, employee relations, compensation, benefits',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'legal-regulatory',
      name: 'Legal & Regulatory',
      shortName: 'Legal',
      description: 'Licenses, permits, legal proceedings, and regulatory approvals',
      icon: FileText,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Business licenses and regulatory permits',
        'Legal proceedings and compliance issues',
        'Regulatory approvals and registrations',
        'Legal risk assessment and management'
      ],
      documentTypes: ['legal'],
      suggestedDocuments: ['Business licenses', 'Legal opinions', 'Court filings', 'Regulatory correspondence'],
      fields: [
        {
          id: 'licenses_permits',
          label: 'Licenses & Permits',
          type: 'textarea',
          required: true,
          placeholder: 'List all business licenses, permits, and regulatory approvals required for operations...',
          description: 'Comprehensive inventory of all required licenses, permits, and regulatory approvals',
          professionalGuidance: 'Include all business licenses, permits, regulatory approvals, renewal dates',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'legal_proceedings',
          label: 'Legal Proceedings',
          type: 'textarea',
          required: false,
          placeholder: 'Detail any material legal proceedings, litigation, or regulatory investigations...',
          description: 'Analysis of legal proceedings, litigation history, and regulatory investigations',
          professionalGuidance: 'Include material legal proceedings, litigation, regulatory investigations, potential impacts',
          minLength: 50,
          maxLength: 600
        },
        {
          id: 'compliance_status',
          label: 'Regulatory Compliance Status',
          type: 'textarea',
          required: true,
          placeholder: 'Describe compliance status with all applicable laws and regulations...',
          description: 'Comprehensive compliance assessment across all applicable regulatory frameworks',
          professionalGuidance: 'Include compliance status, regulatory relationships, compliance monitoring',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'properties-facilities',
      name: 'Properties & Facilities',
      shortName: 'Properties',
      description: 'Real estate portfolio, facilities, and infrastructure assets',
      icon: Home,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Property portfolio including owned and leased assets',
        'Facility locations and operational capacity',
        'Infrastructure requirements and investments',
        'Property valuations and lease terms'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Property deeds', 'Lease agreements', 'Valuation reports', 'Facility layouts'],
      fields: [
        {
          id: 'property_portfolio',
          label: 'Property Portfolio',
          type: 'textarea',
          required: true,
          placeholder: 'Detail all owned and leased properties including locations, sizes, and purposes...',
          description: 'Comprehensive property inventory including ownership status, locations, and utilization',
          professionalGuidance: 'Include owned/leased properties, locations, sizes, purposes, lease terms',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'facility_infrastructure',
          label: 'Facility Infrastructure',
          type: 'textarea',
          required: true,
          placeholder: 'Describe facility infrastructure, operational capacity, and critical infrastructure...',
          description: 'Infrastructure analysis including capacity, utilization, and operational requirements',
          professionalGuidance: 'Detail facility infrastructure, capacity, utilization, critical systems',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'property_valuations',
          label: 'Property Valuations & Terms',
          type: 'textarea',
          required: false,
          placeholder: 'Provide property valuations, lease terms, and key contractual obligations...',
          description: 'Property valuation and contractual analysis including lease terms and obligations',
          professionalGuidance: 'Include valuations, lease terms, contractual obligations, renewal options',
          minLength: 80,
          maxLength: 600
        }
      ]
    },
    {
      id: 'risk-management',
      name: 'Risk Management',
      shortName: 'Risk',
      description: 'Business risks, mitigation strategies, and contingency planning',
      icon: AlertTriangle,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Comprehensive business risk assessment',
        'Risk mitigation strategies and controls',
        'Contingency planning and business continuity',
        'Risk monitoring and management framework'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Risk assessments', 'Risk registers', 'Contingency plans', 'Insurance policies'],
      fields: [
        {
          id: 'business_risks',
          label: 'Business Risk Assessment',
          type: 'textarea',
          required: true,
          placeholder: 'Identify and analyze key business risks including operational, financial, and strategic risks...',
          description: 'Comprehensive business risk assessment covering all major risk categories',
          professionalGuidance: 'Include operational, financial, strategic, regulatory, market, and competitive risks',
          minLength: 150,
          maxLength: 1200
        },
        {
          id: 'risk_mitigation',
          label: 'Risk Mitigation Strategies',
          type: 'textarea',
          required: true,
          placeholder: 'Describe risk mitigation strategies, controls, and management procedures...',
          description: 'Risk mitigation framework including strategies, controls, and management procedures',
          professionalGuidance: 'Detail mitigation strategies, control measures, monitoring procedures, responsibility framework',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'contingency_planning',
          label: 'Contingency Planning',
          type: 'textarea',
          required: false,
          placeholder: 'Outline contingency plans for key business continuity scenarios...',
          description: 'Business continuity framework including contingency plans and crisis management',
          professionalGuidance: 'Include business continuity plans, crisis management, disaster recovery',
          minLength: 100,
          maxLength: 800
        }
      ]
    },
    {
      id: 'governance-esg',
      name: 'Corporate Governance & ESG',
      shortName: 'ESG',
      description: 'Corporate governance, environmental and social responsibility',
      icon: Award,
      hkexSection: 'Chapter 3.7',
      professionalRequirements: [
        'Corporate governance structure and practices',
        'Environmental management and sustainability',
        'Social responsibility and community engagement',
        'ESG reporting and compliance framework'
      ],
      documentTypes: ['business', 'legal'],
      suggestedDocuments: ['Governance policies', 'ESG reports', 'Sustainability plans', 'Board resolutions'],
      fields: [
        {
          id: 'governance_structure',
          label: 'Corporate Governance',
          type: 'textarea',
          required: true,
          placeholder: 'Describe corporate governance structure, board composition, and governance practices...',
          description: 'Corporate governance framework including structure, practices, and oversight mechanisms',
          professionalGuidance: 'Include governance structure, board composition, committees, oversight mechanisms',
          minLength: 120,
          maxLength: 1000
        },
        {
          id: 'environmental_management',
          label: 'Environmental Management',
          type: 'textarea',
          required: false,
          placeholder: 'Detail environmental management systems, sustainability initiatives, and environmental impact...',
          description: 'Environmental management framework including sustainability initiatives and impact assessment',
          professionalGuidance: 'Include environmental policies, sustainability initiatives, impact assessment, compliance',
          minLength: 100,
          maxLength: 800
        },
        {
          id: 'social_responsibility',
          label: 'Social Responsibility',
          type: 'textarea',
          required: false,
          placeholder: 'Describe social responsibility programs, community engagement, and stakeholder relations...',
          description: 'Social responsibility framework including community engagement and stakeholder management',
          professionalGuidance: 'Include social programs, community engagement, stakeholder relations, social impact',
          minLength: 80,
          maxLength: 600
        }
      ]
    }
  ], []);

  const getCompletionPercentage = (categoryId: string, categoryData: Record<string, any>) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;

    const requiredFields = category.fields.filter(f => f.required);
    const totalFields = category.fields.length;
    
    let completedFields = 0;
    let qualityScore = 0;

    category.fields.forEach(field => {
      const value = categoryData[field.id];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        completedFields++;
        
        // Quality scoring based on field requirements
        const minLength = field.minLength || (field.type === 'textarea' ? 50 : 10);
        const lengthScore = Math.min(100, (value.trim().length / minLength) * 100);
        qualityScore += lengthScore;
      }
    });

    const completionRate = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    const averageQuality = completedFields > 0 ? qualityScore / completedFields : 0;
    
    // Weighted score: 70% completion, 30% quality
    return (completionRate * 0.7) + (averageQuality * 0.3);
  };

  const getTotalCompletion = (allCategoryData: Record<string, Record<string, any>>) => {
    const totalCompletion = categories.reduce((acc, category) => {
      const categoryCompletion = getCompletionPercentage(category.id, allCategoryData[category.id] || {});
      return acc + (categoryCompletion / categories.length);
    }, 0);

    return totalCompletion;
  };

  const validateField = (field: ProfessionalBusinessField, value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return field.required ? 'This field is required' : null;
    }

    if (field.minLength && value.trim().length < field.minLength) {
      return `Minimum ${field.minLength} characters required for professional standard`;
    }

    if (field.maxLength && value.trim().length > field.maxLength) {
      return `Maximum ${field.maxLength} characters allowed`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  return {
    categories,
    getCompletionPercentage,
    getTotalCompletion,
    validateField,
    guidanceData,
    loading
  };
};