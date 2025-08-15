import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  Globe,
  Factory,
  CreditCard,
  Scale,
  TreePine,
  UserCheck,
  Briefcase,
  Calendar,
  Server,
  LucideIcon
} from 'lucide-react';

export interface EnhancedBusinessField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect';
  required: boolean;
  placeholder: string;
  description?: string;
  example?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  options?: string[];
  dependsOn?: string[];
  suggestedDocuments?: string[];
  hkexReference?: string;
}

export interface EnhancedBusinessCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  fields: EnhancedBusinessField[];
  documentType: string;
  suggestedDocuments?: string[];
  hkexReference?: string;
  required: boolean;
  order: number;
}

// Map business template columns to category IDs
const TEMPLATE_CATEGORY_MAPPING: Record<string, string> = {
  'Overview': 'overview',
  'business Nature': 'business_nature',
  'Business Model': 'business_model',
  'Competitive Strengths': 'competitive_strengths',
  'Business Strategies': 'business_strategies',
  'Future Plan': 'future_plans',
  'Customers': 'customers',
  'Production and manufacturing': 'production',
  'Marketing': 'marketing',
  'Pricing': 'pricing',
  'Suppliers': 'suppliers',
  'Quality Control': 'quality_control',
  'Research and Development': 'research_development',
  'Competition': 'competition',
  'Awards': 'awards',
  'Intelliectual Properties': 'intellectual_properties',
  'Employee': 'employees',
  'Seasonality': 'seasonality',
  'License, Permits and Certificates': 'licenses_permits',
  'Insurance': 'insurance',
  'Properties': 'properties',
  'Environment, Social and Corporate Governance': 'esg',
  'non-compliance and legal proceedings': 'legal_proceedings',
  'Internal control and risk management': 'risk_management',
  'Transfer Pricing': 'transfer_pricing',
  'Covid-19': 'covid_impact',
  'Concentration of customers or suppliers': 'concentration_risks',
  'Information Technology': 'information_technology',
  'Services': 'services'
};

export const useEnhancedBusinessCategories = () => {
  // Fetch IPO section guidance
  const { data: sectionGuidance } = useQuery({
    queryKey: ['ipo-section-guidance', 'Business'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipo_prospectus_section_guidance')
        .select('*')
        .eq('Section', 'Business')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch business templates for examples
  const { data: businessTemplates } = useQuery({
    queryKey: ['ipo-business-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipo_section_business_templates')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const categories: EnhancedBusinessCategory[] = useMemo(() => [
    {
      id: 'overview',
      name: 'Business Overview',
      shortName: 'Overview',
      description: 'Core business description and corporate identity',
      icon: Building2,
      documentType: 'business',
      required: true,
      order: 1,
      hkexReference: 'Chapter 3.7 - Business description',
      suggestedDocuments: ['Company profile', 'Articles of incorporation', 'Corporate structure chart'],
      fields: [
        {
          id: 'business_description',
          label: 'Business Description',
          type: 'textarea',
          required: true,
          placeholder: 'Provide a comprehensive description of your business operations, history, and core activities...',
          description: 'Detailed overview of business operations, including when and where incorporated, and principal activities',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Company profile', 'Annual reports', 'Corporate brochures'],
          hkexReference: 'HKEX Chapter 3.7(a)'
        },
        {
          id: 'principal_activities',
          label: 'Principal Business Activities',
          type: 'textarea',
          required: true,
          placeholder: 'List and describe your main revenue-generating activities...',
          description: 'Primary business activities that generate revenue',
          validation: { minLength: 50, maxLength: 1000 },
          suggestedDocuments: ['Business licenses', 'Service agreements'],
          hkexReference: 'HKEX Chapter 3.7(a)'
        },
        {
          id: 'corporate_history',
          label: 'Corporate History & Milestones',
          type: 'textarea',
          required: false,
          placeholder: 'Key events in your company\'s development...',
          description: 'Significant milestones and corporate development history',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['Corporate timeline', 'Press releases', 'Annual reports']
        }
      ]
    },
    {
      id: 'business_model',
      name: 'Business Model & Revenue Streams',
      shortName: 'Model',
      description: 'How your business creates and captures value',
      icon: Target,
      documentType: 'business',
      required: true,
      order: 2,
      hkexReference: 'Chapter 3.7 - Business model',
      suggestedDocuments: ['Business plan', 'Revenue analysis', 'Customer contracts'],
      fields: [
        {
          id: 'business_model_description',
          label: 'Business Model Description',
          type: 'textarea',
          required: true,
          placeholder: 'Explain how your business operates and generates revenue...',
          description: 'Comprehensive explanation of how the business creates, delivers, and captures value',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Business plan', 'Financial projections'],
          hkexReference: 'HKEX Chapter 3.7'
        },
        {
          id: 'revenue_streams',
          label: 'Revenue Streams & Monetization',
          type: 'textarea',
          required: true,
          placeholder: 'Detail your various revenue sources and how you monetize your offerings...',
          description: 'All sources of revenue and monetization strategies',
          validation: { minLength: 100, maxLength: 1500 },
          suggestedDocuments: ['Revenue analysis', 'Pricing schedules', 'Customer contracts']
        },
        {
          id: 'value_proposition',
          label: 'Value Proposition',
          type: 'textarea',
          required: true,
          placeholder: 'What unique value do you provide to customers...',
          description: 'Unique value delivered to customers and market positioning',
          validation: { minLength: 50, maxLength: 1000 },
          suggestedDocuments: ['Marketing materials', 'Customer testimonials']
        }
      ]
    },
    {
      id: 'competitive_strengths',
      name: 'Competitive Strengths & Advantages',
      shortName: 'Strengths',
      description: 'What differentiates your business from competitors',
      icon: Award,
      documentType: 'business',
      required: true,
      order: 3,
      hkexReference: 'Chapter 3.7(ii) - Competitive advantages',
      suggestedDocuments: ['Competitive analysis', 'Market research', 'Patent certificates'],
      fields: [
        {
          id: 'competitive_advantages',
          label: 'Key Competitive Advantages',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your main competitive advantages and what sets you apart...',
          description: 'Key differentiators that provide competitive edge in the market',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Competitive analysis', 'Market studies', 'Customer surveys'],
          hkexReference: 'HKEX Chapter 3.7(ii)'
        },
        {
          id: 'market_position',
          label: 'Market Position & Leadership',
          type: 'textarea',
          required: true,
          placeholder: 'Explain your position in the market and areas of leadership...',
          description: 'Current market position, market share, and leadership areas',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Market research reports', 'Industry rankings']
        },
        {
          id: 'barriers_to_entry',
          label: 'Barriers to Entry',
          type: 'textarea',
          required: false,
          placeholder: 'What barriers exist that protect your market position...',
          description: 'Factors that make it difficult for competitors to enter your market',
          validation: { maxLength: 1000 },
          suggestedDocuments: ['Industry analysis', 'Regulatory requirements']
        }
      ]
    },
    {
      id: 'business_strategies',
      name: 'Business Strategies & Growth Plans',
      shortName: 'Strategy',
      description: 'Strategic initiatives and growth plans',
      icon: Brain,
      documentType: 'business',
      required: true,
      order: 4,
      hkexReference: 'Chapter 3.7(i) - Business strategies',
      suggestedDocuments: ['Strategic plan', 'Board resolutions', 'Investment proposals'],
      fields: [
        {
          id: 'business_strategies_overview',
          label: 'Business Strategies',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your key business strategies including sales network strengthening, vertical expansion, etc...',
          description: 'Key business strategies such as strengthening sales network, vertical expansion, long-term contracts, and acquisitions',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Strategic plan', 'Board presentations', 'Investment committee papers'],
          hkexReference: 'HKEX Chapter 3.7(i)'
        },
        {
          id: 'expansion_plans',
          label: 'Expansion Plans & Implementation',
          type: 'textarea',
          required: true,
          placeholder: 'Detail your expansion plans including reasons, site selection, expected capacity, breakeven analysis...',
          description: 'Expansion plans with reasons, site selection, expected capacity, breakeven periods, and implementation timeline',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Expansion proposals', 'Feasibility studies', 'Site analysis'],
          hkexReference: 'HKEX Chapter 3.7(iii)'
        },
        {
          id: 'acquisition_targets',
          label: 'Acquisition Targets & Criteria',
          type: 'textarea',
          required: false,
          placeholder: 'Details of identified acquisition targets and selection criteria...',
          description: 'Information about acquisition targets and the criteria used for selection',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['Due diligence reports', 'Acquisition strategy documents'],
          hkexReference: 'HKEX Chapter 3.7(iv)'
        }
      ]
    },
    {
      id: 'products_services',
      name: 'Products & Services Portfolio',
      shortName: 'Products',
      description: 'Comprehensive overview of your offerings',
      icon: Package,
      documentType: 'business',
      required: true,
      order: 5,
      suggestedDocuments: ['Product catalogs', 'Service descriptions', 'R&D reports'],
      fields: [
        {
          id: 'products_services_overview',
          label: 'Products & Services Overview',
          type: 'textarea',
          required: true,
          placeholder: 'Comprehensive description of all products and services offered...',
          description: 'Detailed overview of all products and services, including features and benefits',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Product catalogs', 'Service manuals', 'Technical specifications']
        },
        {
          id: 'product_development',
          label: 'Product Development & Innovation',
          type: 'textarea',
          required: false,
          placeholder: 'Describe your product development process and innovation approach...',
          description: 'Product development lifecycle, innovation processes, and R&D activities',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['R&D reports', 'Innovation pipeline', 'Patent applications']
        },
        {
          id: 'service_delivery',
          label: 'Service Delivery & Support',
          type: 'textarea',
          required: false,
          placeholder: 'Explain how services are delivered and customer support provided...',
          description: 'Service delivery mechanisms, customer support, and after-sales service',
          validation: { maxLength: 1000 },
          suggestedDocuments: ['Service level agreements', 'Customer support procedures']
        }
      ]
    },
    {
      id: 'customers',
      name: 'Customer Base & Market Analysis',
      shortName: 'Customers',
      description: 'Customer segments and market dynamics',
      icon: Users,
      documentType: 'market',
      required: true,
      order: 6,
      suggestedDocuments: ['Customer analysis', 'Market research', 'Sales reports'],
      fields: [
        {
          id: 'customer_base_analysis',
          label: 'Customer Base Analysis',
          type: 'textarea',
          required: true,
          placeholder: 'Analyze your customer segments, demographics, and key characteristics...',
          description: 'Detailed analysis of customer segments, demographics, and key customer relationships',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Customer analysis reports', 'Sales data', 'CRM reports']
        },
        {
          id: 'market_penetration',
          label: 'Market Penetration & Costs',
          type: 'textarea',
          required: true,
          placeholder: 'Describe market penetration strategy and associated costs...',
          description: 'Market penetration strategies, associated costs, and related risks',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Market entry strategy', 'Marketing budgets', 'Risk assessments'],
          hkexReference: 'HKEX Chapter 3.7(ii)'
        },
        {
          id: 'customer_retention',
          label: 'Customer Retention & Loyalty',
          type: 'textarea',
          required: false,
          placeholder: 'Strategies for customer retention and building loyalty...',
          description: 'Customer retention strategies, loyalty programs, and relationship management',
          validation: { maxLength: 1000 },
          suggestedDocuments: ['Customer retention reports', 'Loyalty program data']
        }
      ]
    },
    {
      id: 'suppliers',
      name: 'Suppliers & Supply Chain',
      shortName: 'Supply',
      description: 'Supply chain management and supplier relationships',
      icon: Truck,
      documentType: 'business',
      required: true,
      order: 7,
      suggestedDocuments: ['Supplier agreements', 'Supply chain analysis', 'Procurement policies'],
      fields: [
        {
          id: 'key_suppliers',
          label: 'Key Suppliers & Relationships',
          type: 'textarea',
          required: true,
          placeholder: 'Detail your key suppliers, their importance, and relationship management...',
          description: 'Information about key suppliers, their significance, and supplier relationship management',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Supplier agreements', 'Vendor assessments', 'Procurement reports']
        },
        {
          id: 'supply_chain_management',
          label: 'Supply Chain Management',
          type: 'textarea',
          required: true,
          placeholder: 'Describe supply chain processes, inventory management, and logistics...',
          description: 'Supply chain processes, inventory management, and logistics operations',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Supply chain maps', 'Inventory reports', 'Logistics procedures']
        },
        {
          id: 'supplier_risks',
          label: 'Supplier Risks & Mitigation',
          type: 'textarea',
          required: false,
          placeholder: 'Identify supplier risks and mitigation strategies...',
          description: 'Key supplier risks and strategies to mitigate supply chain disruptions',
          validation: { maxLength: 1000 },
          suggestedDocuments: ['Risk assessments', 'Business continuity plans']
        }
      ]
    },
    {
      id: 'production',
      name: 'Production & Manufacturing',
      shortName: 'Production',
      description: 'Manufacturing processes and operational capabilities',
      icon: Factory,
      documentType: 'business',
      required: true,
      order: 8,
      suggestedDocuments: ['Production reports', 'Facility layouts', 'Equipment specifications'],
      fields: [
        {
          id: 'production_processes',
          label: 'Production Processes & Operations',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your production processes, manufacturing operations, and workflows...',
          description: 'Detailed description of production processes, manufacturing operations, and operational workflows',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Process flowcharts', 'Production manuals', 'Operational procedures']
        },
        {
          id: 'production_capacity',
          label: 'Production Capacity & Utilization',
          type: 'textarea',
          required: true,
          placeholder: 'Detail current capacity, utilization rates, and expansion plans...',
          description: 'Current production capacity, utilization rates, and capacity expansion plans',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Capacity studies', 'Production reports', 'Expansion plans'],
          hkexReference: 'HKEX Chapter 3.7(iii)'
        },
        {
          id: 'facilities_equipment',
          label: 'Facilities & Equipment',
          type: 'textarea',
          required: false,
          placeholder: 'Describe key facilities, equipment, and infrastructure...',
          description: 'Information about key facilities, equipment, and manufacturing infrastructure',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['Facility descriptions', 'Equipment lists', 'Infrastructure reports']
        }
      ]
    },
    {
      id: 'quality_control',
      name: 'Quality Control & Standards',
      shortName: 'Quality',
      description: 'Quality management and control systems',
      icon: ShieldCheck,
      documentType: 'technical',
      required: true,
      order: 9,
      suggestedDocuments: ['Quality certificates', 'Audit reports', 'Process documentation'],
      fields: [
        {
          id: 'quality_control_systems',
          label: 'Quality Control Systems',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your quality control processes, standards, and management systems...',
          description: 'Quality control processes, quality management systems, and standards compliance',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['QMS documentation', 'Quality procedures', 'Audit reports']
        },
        {
          id: 'certifications_standards',
          label: 'Certifications & Industry Standards',
          type: 'textarea',
          required: false,
          placeholder: 'List relevant certifications, standards compliance, and accreditations...',
          description: 'Industry certifications, standards compliance, and quality accreditations',
          validation: { maxLength: 1000 },
          suggestedDocuments: ['Certificates', 'Compliance reports', 'Accreditation documents']
        }
      ]
    },
    {
      id: 'research_development',
      name: 'Research & Development',
      shortName: 'R&D',
      description: 'Innovation, research activities, and development initiatives',
      icon: Brain,
      documentType: 'technical',
      required: false,
      order: 10,
      suggestedDocuments: ['R&D reports', 'Patent filings', 'Innovation pipeline'],
      fields: [
        {
          id: 'rd_activities',
          label: 'R&D Activities & Innovation',
          type: 'textarea',
          required: false,
          placeholder: 'Describe research and development activities, innovation initiatives...',
          description: 'Research and development activities, innovation programs, and technology development',
          validation: { maxLength: 2000 },
          suggestedDocuments: ['R&D reports', 'Innovation strategy', 'Technology roadmaps']
        },
        {
          id: 'rd_investments',
          label: 'R&D Investments & Resources',
          type: 'textarea',
          required: false,
          placeholder: 'Detail R&D investments, resources allocation, and capabilities...',
          description: 'R&D investments, resource allocation, and research capabilities',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['R&D budgets', 'Investment reports', 'Resource allocation plans']
        }
      ]
    },
    {
      id: 'intellectual_properties',
      name: 'Intellectual Properties',
      shortName: 'IP',
      description: 'Patents, trademarks, and intellectual property portfolio',
      icon: FileText,
      documentType: 'legal',
      required: false,
      order: 11,
      suggestedDocuments: ['Patent certificates', 'Trademark registrations', 'IP portfolio'],
      fields: [
        {
          id: 'ip_portfolio',
          label: 'Intellectual Property Portfolio',
          type: 'textarea',
          required: false,
          placeholder: 'Describe your intellectual property assets including patents, trademarks...',
          description: 'Comprehensive overview of intellectual property assets and portfolio',
          validation: { maxLength: 2000 },
          suggestedDocuments: ['Patent certificates', 'Trademark registrations', 'Copyright documents']
        },
        {
          id: 'ip_strategy',
          label: 'IP Strategy & Protection',
          type: 'textarea',
          required: false,
          placeholder: 'Explain your intellectual property strategy and protection measures...',
          description: 'Intellectual property strategy, protection measures, and enforcement policies',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['IP strategy documents', 'Protection policies']
        }
      ]
    },
    {
      id: 'employees',
      name: 'Human Resources & Employment',
      shortName: 'HR',
      description: 'Workforce, employment practices, and human capital',
      icon: UserCheck,
      documentType: 'business',
      required: true,
      order: 12,
      suggestedDocuments: ['Organizational chart', 'HR policies', 'Training programs'],
      fields: [
        {
          id: 'workforce_overview',
          label: 'Workforce Overview',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your workforce including size, structure, and key personnel...',
          description: 'Overview of workforce including employee count, organizational structure, and key management',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Organizational charts', 'Employee statistics', 'Management bios']
        },
        {
          id: 'hr_practices',
          label: 'HR Practices & Policies',
          type: 'textarea',
          required: false,
          placeholder: 'Detail employment practices, training programs, and HR policies...',
          description: 'Human resources practices, training programs, and employment policies',
          validation: { maxLength: 1500 },
          suggestedDocuments: ['HR policies', 'Training manuals', 'Employee handbook']
        }
      ]
    },
    {
      id: 'risk_management',
      name: 'Risk Management & Internal Controls',
      shortName: 'Risk',
      description: 'Risk management framework and internal control systems',
      icon: AlertTriangle,
      documentType: 'business',
      required: true,
      order: 13,
      suggestedDocuments: ['Risk assessments', 'Internal control documentation', 'Audit reports'],
      fields: [
        {
          id: 'risk_management_framework',
          label: 'Risk Management Framework',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your risk management framework and key business risks...',
          description: 'Comprehensive risk management framework and identification of key business risks',
          validation: { minLength: 100, maxLength: 2000 },
          suggestedDocuments: ['Risk register', 'Risk management policies', 'Risk assessments']
        },
        {
          id: 'internal_controls',
          label: 'Internal Control Systems',
          type: 'textarea',
          required: true,
          placeholder: 'Detail internal control systems and governance procedures...',
          description: 'Internal control systems, governance procedures, and compliance mechanisms',
          validation: { minLength: 50, maxLength: 1500 },
          suggestedDocuments: ['Internal control documentation', 'SOX compliance reports', 'Audit findings']
        }
      ]
    }
  ], []);

  const getCompletionPercentage = useCallback((categoryId: string, categoryData: Record<string, any>) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;

    const totalFields = category.fields.length;
    let completedFields = 0;

    category.fields.forEach(field => {
      const value = categoryData[field.id];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        const minLength = field.validation?.minLength || (field.type === 'textarea' ? 50 : 10);
        if (value.trim().length >= minLength) {
          completedFields++;
        }
      }
    });

    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [categories]);

  const getTotalCompletion = useCallback((allCategoryData: Record<string, Record<string, any>>) => {
    const requiredCategories = categories.filter(c => c.required);
    const totalCompletion = requiredCategories.reduce((acc, category) => {
      const categoryCompletion = getCompletionPercentage(category.id, allCategoryData[category.id] || {});
      return acc + (categoryCompletion / requiredCategories.length);
    }, 0);

    return totalCompletion;
  }, [categories, getCompletionPercentage]);

  const getTemplateExample = useCallback((categoryId: string, fieldId: string) => {
    if (!businessTemplates || businessTemplates.length === 0) return null;
    
    const templateKey = Object.keys(TEMPLATE_CATEGORY_MAPPING).find(
      key => TEMPLATE_CATEGORY_MAPPING[key] === categoryId
    );
    
    if (!templateKey) return null;
    
    // Return a random example from the templates
    const randomTemplate = businessTemplates[Math.floor(Math.random() * businessTemplates.length)];
    return randomTemplate[templateKey] || null;
  }, [businessTemplates]);

  const getRegulatoryRequirements = useCallback((categoryId: string) => {
    if (!sectionGuidance) return null;
    
    // Parse the contents requirements for relevant category guidance
    const requirements = sectionGuidance['contents requirements'];
    if (!requirements) return null;
    
    return {
      general: sectionGuidance.Guidance || 'HKEX Chapter 3.7',
      specific: requirements,
      contents: sectionGuidance.contents
    };
  }, [sectionGuidance]);

  return {
    categories: categories.sort((a, b) => a.order - b.order),
    getCompletionPercentage,
    getTotalCompletion,
    getTemplateExample,
    getRegulatoryRequirements,
    isLoading: false
  };
};