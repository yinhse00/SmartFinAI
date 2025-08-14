import { useMemo } from 'react';
import { 
  Building2, 
  Target, 
  Package, 
  Settings, 
  Truck, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  LucideIcon
} from 'lucide-react';

export interface BusinessField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  required: boolean;
  placeholder: string;
  description?: string;
  example?: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  fields: BusinessField[];
  documentType: string;
  suggestedDocuments?: string[];
}

export const useBusinessCategories = () => {
  const categories: BusinessCategory[] = useMemo(() => [
    {
      id: 'overview',
      name: 'Company Overview',
      shortName: 'Overview',
      description: 'Basic information about your company and business',
      icon: Building2,
      documentType: 'business',
      suggestedDocuments: ['Company profile', 'Mission & vision statements', 'Corporate structure charts'],
      fields: [
        {
          id: 'company_description',
          label: 'Company Description',
          type: 'textarea',
          required: true,
          placeholder: 'Describe what your company does, when it was founded, and its main purpose...',
          description: 'A comprehensive overview of your business operations and corporate identity',
          example: 'ABC Corp is a leading manufacturer of sustainable packaging solutions, founded in 2010...'
        },
        {
          id: 'business_nature',
          label: 'Nature of Business',
          type: 'text',
          required: true,
          placeholder: 'e.g., Manufacturing, Technology, Services...',
          description: 'The primary industry and type of business activities'
        },
        {
          id: 'incorporation_details',
          label: 'Incorporation Details',
          type: 'textarea',
          required: true,
          placeholder: 'Date of incorporation, jurisdiction, legal structure...',
          description: 'Legal formation details including dates, jurisdictions, and corporate structure'
        },
        {
          id: 'principal_activities',
          label: 'Principal Activities',
          type: 'textarea',
          required: true,
          placeholder: 'List and describe the main business activities...',
          description: 'Detailed breakdown of your core business operations and revenue-generating activities'
        }
      ]
    },
    {
      id: 'strategy',
      name: 'Business Model & Strategy',
      shortName: 'Strategy',
      description: 'Your business model, competitive advantages, and strategic direction',
      icon: Target,
      documentType: 'business',
      suggestedDocuments: ['Business plan', 'Strategic plans', 'Competitive analysis', 'Market research'],
      fields: [
        {
          id: 'business_model',
          label: 'Business Model',
          type: 'textarea',
          required: true,
          placeholder: 'Explain how your company creates, delivers, and captures value...',
          description: 'How your business operates and generates revenue',
          example: 'We operate on a B2B subscription model with tiered pricing based on usage...'
        },
        {
          id: 'competitive_advantages',
          label: 'Competitive Advantages',
          type: 'textarea',
          required: true,
          placeholder: 'What makes your company unique and competitive...',
          description: 'Key differentiators that give you an edge over competitors'
        },
        {
          id: 'growth_strategy',
          label: 'Growth Strategy',
          type: 'textarea',
          required: true,
          placeholder: 'How you plan to expand and grow the business...',
          description: 'Strategic initiatives for business expansion and market growth'
        },
        {
          id: 'target_markets',
          label: 'Target Markets',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your target customer segments and markets...',
          description: 'Primary and secondary markets you serve or plan to enter'
        }
      ]
    },
    {
      id: 'products',
      name: 'Products & Services',
      shortName: 'Products',
      description: 'Detailed information about your offerings',
      icon: Package,
      documentType: 'business',
      suggestedDocuments: ['Product catalogs', 'Service descriptions', 'Pricing sheets', 'Product roadmaps'],
      fields: [
        {
          id: 'product_overview',
          label: 'Product/Service Overview',
          type: 'textarea',
          required: true,
          placeholder: 'Comprehensive description of your products or services...',
          description: 'Detailed overview of what you offer to customers'
        },
        {
          id: 'product_lifecycle',
          label: 'Product Development & Lifecycle',
          type: 'textarea',
          required: false,
          placeholder: 'Describe your product development process and lifecycle...',
          description: 'How products are developed, launched, and managed throughout their lifecycle'
        },
        {
          id: 'pricing_strategy',
          label: 'Pricing Strategy',
          type: 'textarea',
          required: false,
          placeholder: 'Explain your pricing model and strategy...',
          description: 'How you price your products/services and the rationale behind it'
        },
        {
          id: 'warranties_support',
          label: 'Warranties & Customer Support',
          type: 'textarea',
          required: false,
          placeholder: 'Describe warranties, guarantees, and customer support...',
          description: 'Customer service commitments and post-sale support'
        }
      ]
    },
    {
      id: 'operations',
      name: 'Operations & Production',
      shortName: 'Operations',
      description: 'Your operational processes, facilities, and production capabilities',
      icon: Settings,
      documentType: 'business',
      suggestedDocuments: ['Facility layouts', 'Process flowcharts', 'Capacity studies', 'Equipment lists'],
      fields: [
        {
          id: 'production_process',
          label: 'Production Process',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your production or service delivery process...',
          description: 'Step-by-step overview of how you create and deliver your offerings'
        },
        {
          id: 'facilities',
          label: 'Facilities & Infrastructure',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your facilities, locations, and key infrastructure...',
          description: 'Physical locations, manufacturing facilities, offices, and key infrastructure'
        },
        {
          id: 'capacity',
          label: 'Production Capacity',
          type: 'textarea',
          required: false,
          placeholder: 'Current and planned production capacity...',
          description: 'Manufacturing or service capacity, utilization rates, and expansion plans'
        },
        {
          id: 'technology_systems',
          label: 'Technology & Systems',
          type: 'textarea',
          required: false,
          placeholder: 'Key technology platforms and operational systems...',
          description: 'Critical technology infrastructure and operational systems'
        }
      ]
    },
    {
      id: 'supply',
      name: 'Supply Chain',
      shortName: 'Supply',
      description: 'Suppliers, raw materials, and supply chain management',
      icon: Truck,
      documentType: 'business',
      suggestedDocuments: ['Supplier agreements', 'Supply chain maps', 'Inventory reports', 'Procurement policies'],
      fields: [
        {
          id: 'suppliers',
          label: 'Key Suppliers',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your main suppliers and supplier relationships...',
          description: 'Major suppliers, supplier diversity, and relationship management'
        },
        {
          id: 'raw_materials',
          label: 'Raw Materials & Inventory',
          type: 'textarea',
          required: false,
          placeholder: 'Key raw materials, sourcing, and inventory management...',
          description: 'Critical inputs, sourcing strategies, and inventory management practices'
        },
        {
          id: 'supply_chain_risks',
          label: 'Supply Chain Risks',
          type: 'textarea',
          required: false,
          placeholder: 'Key supply chain risks and mitigation strategies...',
          description: 'Potential supply chain disruptions and how you manage them'
        }
      ]
    },
    {
      id: 'customers',
      name: 'Market & Customers',
      shortName: 'Market',
      description: 'Customer base, market analysis, and sales channels',
      icon: Users,
      documentType: 'market',
      suggestedDocuments: ['Customer analysis', 'Market research', 'Sales data', 'Distribution agreements'],
      fields: [
        {
          id: 'customer_base',
          label: 'Customer Base',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your customer segments and key characteristics...',
          description: 'Target customers, customer segments, and key customer relationships'
        },
        {
          id: 'market_position',
          label: 'Market Position',
          type: 'textarea',
          required: true,
          placeholder: 'Your position in the market and competitive landscape...',
          description: 'Market share, competitive positioning, and market dynamics'
        },
        {
          id: 'sales_channels',
          label: 'Sales & Distribution Channels',
          type: 'textarea',
          required: true,
          placeholder: 'How you reach and sell to customers...',
          description: 'Sales channels, distribution networks, and go-to-market strategies'
        },
        {
          id: 'customer_retention',
          label: 'Customer Retention & Relationships',
          type: 'textarea',
          required: false,
          placeholder: 'Customer retention strategies and relationship management...',
          description: 'How you maintain and grow customer relationships'
        }
      ]
    },
    {
      id: 'quality',
      name: 'Quality & Compliance',
      shortName: 'Quality',
      description: 'Quality control, certifications, and regulatory compliance',
      icon: ShieldCheck,
      documentType: 'legal',
      suggestedDocuments: ['Quality certificates', 'Compliance reports', 'Audit reports', 'Regulatory filings'],
      fields: [
        {
          id: 'quality_control',
          label: 'Quality Control Systems',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your quality control processes and standards...',
          description: 'Quality management systems, standards, and quality assurance processes'
        },
        {
          id: 'certifications',
          label: 'Certifications & Standards',
          type: 'textarea',
          required: false,
          placeholder: 'List relevant certifications and industry standards...',
          description: 'Industry certifications, quality standards, and compliance frameworks'
        },
        {
          id: 'regulatory_compliance',
          label: 'Regulatory Compliance',
          type: 'textarea',
          required: true,
          placeholder: 'Key regulatory requirements and compliance status...',
          description: 'Applicable regulations, compliance status, and regulatory relationships'
        }
      ]
    },
    {
      id: 'risks',
      name: 'Risk Management',
      shortName: 'Risks',
      description: 'Business risks, mitigation strategies, and contingency plans',
      icon: AlertTriangle,
      documentType: 'business',
      suggestedDocuments: ['Risk assessments', 'Contingency plans', 'Insurance policies', 'Crisis management plans'],
      fields: [
        {
          id: 'business_risks',
          label: 'Key Business Risks',
          type: 'textarea',
          required: true,
          placeholder: 'Identify and describe major business risks...',
          description: 'Primary risks that could impact business operations or performance'
        },
        {
          id: 'risk_mitigation',
          label: 'Risk Mitigation Strategies',
          type: 'textarea',
          required: true,
          placeholder: 'Describe how you manage and mitigate risks...',
          description: 'Strategies and measures in place to address identified risks'
        },
        {
          id: 'contingency_plans',
          label: 'Contingency Planning',
          type: 'textarea',
          required: false,
          placeholder: 'Business continuity and contingency plans...',
          description: 'Plans for maintaining operations during disruptions or crises'
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
    category.fields.forEach(field => {
      const value = categoryData[field.id];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        completedFields++;
      }
    });

    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  };

  const getTotalCompletion = (allCategoryData: Record<string, Record<string, any>>) => {
    const totalCompletion = categories.reduce((acc, category) => {
      const categoryCompletion = getCompletionPercentage(category.id, allCategoryData[category.id] || {});
      return acc + (categoryCompletion / categories.length);
    }, 0);

    return totalCompletion;
  };

  return {
    categories,
    getCompletionPercentage,
    getTotalCompletion
  };
};