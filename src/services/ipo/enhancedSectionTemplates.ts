/**
 * Enhanced Section Templates for IPO Prospectus Drafting
 * Incorporates all 23 detailed sections with HKEX compliance requirements
 */

export interface IPOSectionTemplate {
  sectionType: string;
  title: string;
  description: string;
  requirements: string[];
  tabularElements?: string[];
  complianceAreas: string[];
  promptTemplate: string;
}

export const ENHANCED_IPO_SECTIONS: Record<string, IPOSectionTemplate> = {
  overview: {
    sectionType: 'overview',
    title: 'Business Overview',
    description: 'Corporate profile, industry context, business model, and key highlights',
    requirements: [
      'Nature of the business',
      'Year of establishment and corporate history',
      'Headquarters and principal operations',
      'Key industry trends with third-party consultant data',
      'Market size, growth rates, and forecasts',
      'Competitive position and market share',
      'Description of principal services and products',
      'Client types and sectors served',
      'Major customers and length of relationship',
      'Examples of successful projects',
      'Number of projects completed during track record period',
      'Differentiating factors and technological capabilities',
      'Experienced management team',
      'Summary table of revenue contribution by business line',
      'Future plans for growth'
    ],
    tabularElements: ['Revenue contribution by business line across track record period'],
    complianceAreas: ['App1A Part A disclosure requirements', 'HKEX Listing Rules Chapter 9'],
    promptTemplate: `Generate a comprehensive Business Overview section including:
1. Corporate Profile & Background (nature of business, establishment year, headquarters)
2. Industry & Market Context (trends, market size, competitive position)
3. Business Model & Segments (services/products, client types)
4. Key Customers & Track Record (major customers, successful projects)
5. Competitive Strengths (differentiating factors, technology, management)
6. Financial Highlights with revenue breakdown table by business line
7. Business Strategies for future growth
Ensure HKEX Main Board compliance and include third-party market data where relevant.`
  },

  competitive_strengths: {
    sectionType: 'competitive_strengths',
    title: 'Competitive Strengths',
    description: 'Business strategies, competitive advantages, expansion plans, and acquisition targets',
    requirements: [
      'Business strategies (strengthening sales network, vertical expansion, long-term contracts, acquisitions)',
      'Competitive advantages of products/services and targeted markets',
      'Potential cost of market penetration and related risks',
      'Expansion plans with reasons, site selection, expected capacity',
      'Breakeven and investment payback periods with assumptions',
      'Implementation timeframe and capital expenditure requirements',
      'Payment timing and source of funding',
      'Details of acquisition targets and selection criteria'
    ],
    complianceAreas: ['Risk factor cross-references', 'Capital expenditure disclosure'],
    promptTemplate: `Generate a detailed Competitive Strengths section covering:
1. Business strategies for strengthening market position
2. Competitive advantages with market penetration analysis
3. Detailed expansion plans including site selection and capacity
4. Investment payback analysis with clear assumptions
5. Capital expenditure requirements and funding sources
6. Acquisition strategy and target selection criteria
Include specific timeframes, costs, and risk cross-references to Risk Factors section.`
  },

  business_model: {
    sectionType: 'business_model',
    title: 'Business Model',
    description: 'Nature and functions of business segments, revenue model, and operational flows',
    requirements: [
      'Nature and major functions of each business segment',
      'Scale and contribution of each segment',
      'Revenue model and product/service monetisation',
      'Flowcharts for complex business models showing parties/intermediaries',
      'Flow of products/services and funds',
      'Changes in business focus and reasons',
      'Related changes in cost structure, profit margins, risk profile'
    ],
    complianceAreas: ['Segment reporting requirements', 'Revenue recognition disclosure'],
    promptTemplate: `Generate a comprehensive Business Model section including:
1. Detailed description of each business segment and functions
2. Revenue model and monetisation strategy
3. Operational flow diagrams for complex models
4. Intermediary relationships and fund flows
5. Any changes in business focus during track record period
6. Impact on cost structure and profit margins
Include flowcharts where business model involves multiple parties or complex value chains.`
  },

  products_services: {
    sectionType: 'products_services',
    title: 'Products and Services',
    description: 'Product types, lifecycle, pricing, returns policy, and customer complaints',
    requirements: [
      'Product and service types with lifecycle analysis',
      'Seasonality factors',
      'Changes to product mix during track record period',
      'Pictures of products sold',
      'Price ranges by brands and product types',
      'Reasons for material price fluctuations',
      'Future price trends',
      'Product returns and warranty policy',
      'Warranty terms, time period, and provisioning policy',
      'Product recalls/returns/liability claims during track record',
      'Warranty expenses and provisions',
      'Allocation of liability between applicant and suppliers',
      'Customer complaints policies and procedures',
      'Material customer complaints with nature, status, compensation'
    ],
    complianceAreas: ['Product liability disclosure', 'Warranty provisioning'],
    promptTemplate: `Generate a detailed Products and Services section covering:
1. Product/service types with lifecycle and seasonality analysis
2. Product mix changes during track record period
3. Pricing policy by brand/type with fluctuation analysis
4. Comprehensive returns and warranty policies
5. Track record of recalls, returns, and liability claims
6. Customer complaints handling with material incidents
Include specific warranty terms, liability allocation, and compensation details.`
  },

  projects: {
    sectionType: 'projects',
    title: 'Projects (Project-Based Transactions)',
    description: 'Customer details, contract terms, project pipeline, and tender performance',
    requirements: [
      'Customer identities and background',
      'Material contractual terms (scope, duration, value)',
      'Movement of projects on hand (contract value and number)',
      'Project backlog analysis',
      'Revenue recognised and to be recognised',
      'Details of loss-making projects',
      'Number of tenders submitted and success rate',
      'Customer stickiness analysis',
      'Commentary on material fluctuations during track record period'
    ],
    complianceAreas: ['Revenue recognition timing', 'Contract accounting'],
    promptTemplate: `Generate a comprehensive Projects section including:
1. Customer profiles and contractual relationships
2. Project pipeline and backlog analysis
3. Revenue recognition schedule for current projects
4. Tender performance metrics and success rates
5. Analysis of loss-making projects and remedial actions
6. Customer retention and relationship durability
Include movement tables showing project values and quantities over track record period.`
  },

  production: {
    sectionType: 'production',
    title: 'Production',
    description: 'Operation flows, production processes, capacity utilisation, and major assets',
    requirements: [
      'Operation flows and production processes with flowcharts',
      'Time requirements for each critical process',
      'Particulars, capacity and utilisation rate by product category',
      'Basis of calculating utilisation rate',
      'Explanation of material fluctuations or unusual utilisation',
      'Major assets and equipment details',
      'Leased vs owned assets',
      'Repair and maintenance history',
      'Asset age and depreciation method',
      'Timeline for replacement or upgrade'
    ],
    complianceAreas: ['Asset accounting policies', 'Capacity disclosure'],
    promptTemplate: `Generate a detailed Production section covering:
1. Production flow diagrams with process timelines
2. Capacity analysis by product category with utilisation rates
3. Explanation of utilisation fluctuations during track record
4. Major assets inventory with ownership structure
5. Maintenance history and replacement schedules
6. Depreciation policies and upgrade planning
Include flowcharts showing critical production processes and timing.`
  },

  major_customers: {
    sectionType: 'major_customers',
    title: 'Major Customers',
    description: 'Top five customers analysis, commercial terms, and concentration risks',
    requirements: [
      'Identities and background of five largest customers per period',
      'Business activities, size, location, years of relationship',
      'Products/services purchased, credit terms, payment methods',
      'Connected person status',
      'Revenue from top five customers (dollar and percentage)',
      'Key commercial terms with deviation explanations',
      'Long-term agreement details (duration, commitments, penalties)',
      'Price adjustment, renewal, and termination clauses',
      'Enforceability and breach details',
      'Supplier-customer dual relationships',
      'Major countries for product sales',
      'Concentration and counterparty risks',
      'Third party payment arrangements with legality basis'
    ],
    tabularElements: [
      'Top Five Customers table with: Rank, Customer Background, Relationship Start Year, Services Provided, Credit Terms, Revenue, Percentage of Total Revenue'
    ],
    complianceAreas: ['Related party transactions', 'Revenue concentration risk'],
    promptTemplate: `Generate a comprehensive Major Customers section including:
1. Detailed customer profiles for top 5 customers each track record year
2. Tabular presentation with all required customer information
3. Commercial terms analysis with material deviations
4. Long-term contracts with enforcement and breach history
5. Geographic revenue distribution
6. Concentration risk assessment and mitigation
7. Third party payment arrangements (if any) with legality confirmation
Include comprehensive table format showing customer rankings, backgrounds, relationship duration, services, terms, and revenue percentages.`
  },

  sales_marketing: {
    sectionType: 'sales_marketing',
    title: 'Sales and Marketing',
    description: 'Distribution channels, sales points, pricing policy, and promotional activities',
    requirements: [
      'Direct sales vs distribution channels analysis',
      'Trading companies, franchisers, and distributors',
      'Movement of sales points opened and closed with reasons',
      'Pricing policy (fixed price vs cost plus)',
      'Rebate structures',
      'Governmental regulatory pricing guidelines',
      'Compliance with pricing regulations',
      'Advertising and sales incentive programs',
      'Promotion strategies and discount policies'
    ],
    tabularElements: ['Sales points movement table by period'],
    complianceAreas: ['Pricing regulation compliance', 'Distribution agreements'],
    promptTemplate: `Generate a detailed Sales and Marketing section covering:
1. Distribution channel strategy and partner relationships
2. Sales point network with opening/closure analysis
3. Pricing policies including regulatory compliance
4. Rebate and discount structures
5. Marketing and promotional strategies
6. Advertising spend and sales incentives
Include tables showing sales point movements and reasons for network changes.`
  },

  major_suppliers: {
    sectionType: 'major_suppliers',
    title: 'Major Suppliers',
    description: 'Top five suppliers analysis, commercial terms, and supply chain risks',
    requirements: [
      'Identities and background of five largest suppliers per period',
      'Business activities, size, location, years of relationship',
      'Products/services supplied, credit terms, payment methods',
      'Connected person status',
      'Costs/purchases from top five suppliers (dollar and percentage)',
      'Key commercial terms with deviation explanations',
      'Long-term agreement details with minimum purchase commitments',
      'Penalty clauses, price adjustments, renewal terms',
      'Enforceability and breach history',
      'Major source countries for raw materials',
      'Concentration and counterparty risks',
      'Sensitivity and breakeven analysis of cost changes',
      'Supply shortage management and alternative suppliers',
      'Price fluctuation management and cost pass-through',
      'Inventory control measures and provisioning policy',
      'Legality of supply sources'
    ],
    tabularElements: [
      'Top Five Suppliers table with: Supplier Background, Relationship Start Year, Services Provided, Credit Terms, Transaction Amount, Percentage of Total Purchases'
    ],
    complianceAreas: ['Supply chain risk disclosure', 'Cost accounting'],
    promptTemplate: `Generate a comprehensive Major Suppliers section including:
1. Detailed supplier profiles for top 5 suppliers each track record year
2. Tabular presentation with supplier information and purchase analysis
3. Commercial agreements with commitment and penalty terms
4. Geographic sourcing distribution and concentration risks
5. Cost sensitivity analysis and breakeven scenarios
6. Supply chain risk management and alternative sourcing
7. Inventory management and price fluctuation strategies
Include detailed supplier ranking table and supply chain risk mitigation measures.`
  },

  seasonality: {
    sectionType: 'seasonality',
    title: 'Seasonality',
    description: 'Seasonal business patterns, revenue fluctuations, and industry norms',
    requirements: [
      'Seasonal fluctuation patterns in business operations',
      'Revenue patterns by half-year or quarter',
      'Peak season identification and duration',
      'Key drivers of seasonality (festivals, holidays, campaigns)',
      'Industry-specific seasonal factors',
      'Product characteristics affecting seasonality',
      'Customer industry seasonal patterns',
      'Industry consultant validation of seasonal norms',
      'Impact assessment on operational stability'
    ],
    complianceAreas: ['Revenue pattern disclosure', 'Business risk factors'],
    promptTemplate: `Generate a comprehensive Seasonality section covering:
1. Detailed revenue pattern analysis by period
2. Peak season identification and business drivers
3. Festival and holiday impact on demand
4. Product-specific seasonal characteristics
5. Customer industry seasonal influences
6. Industry benchmarking with consultant data
7. Overall impact on business stability
Include specific examples of seasonal drivers and quantitative impact analysis.`
  },

  pricing_policy: {
    sectionType: 'pricing_policy',
    title: 'Pricing Policy',
    description: 'Pricing strategies, methodologies, and regulatory compliance',
    requirements: [
      'Pricing methodology and strategy',
      'Cost-plus vs market-based pricing',
      'Price differentiation by customer segment',
      'Contract pricing vs spot pricing',
      'Price escalation mechanisms',
      'Competitive pricing analysis',
      'Regulatory pricing constraints',
      'Price approval processes'
    ],
    complianceAreas: ['Pricing transparency', 'Revenue recognition'],
    promptTemplate: `Generate a detailed Pricing Policy section covering:
1. Pricing methodology and strategic approach
2. Customer segment pricing differentiation
3. Contract vs spot pricing mechanisms
4. Price escalation and adjustment policies
5. Competitive positioning in pricing
6. Regulatory compliance and constraints
7. Internal pricing approval processes
Include specific examples of pricing structures and competitive analysis.`
  },

  research_development: {
    sectionType: 'research_development',
    title: 'Research and Development',
    description: 'R&D capabilities, team composition, technology, and cooperation agreements',
    requirements: [
      'Material technology and technical know-how requirements',
      'R&D team composition and qualifications',
      'Personnel experience and expertise',
      'R&D expenses accounting policy',
      'Capitalisation vs expensing decisions',
      'Nature and amount of R&D expenses',
      'Third-party cooperation agreements',
      'Cost/profit/loss sharing arrangements',
      'Intellectual property ownership',
      'Fees paid to third parties',
      'Agreement enforceability'
    ],
    complianceAreas: ['R&D accounting', 'IP ownership disclosure'],
    promptTemplate: `Generate a comprehensive Research and Development section covering:
1. Core technology requirements and capabilities
2. R&D team structure with qualifications and experience
3. R&D expense accounting policies and capitalisation criteria
4. Third-party R&D partnerships and collaboration terms
5. IP ownership and revenue sharing arrangements
6. R&D investment levels and strategic priorities
Include specific details on technology development and partnership agreements.`
  },

  cybersecurity_data_privacy: {
    sectionType: 'cybersecurity_data_privacy',
    title: 'Cybersecurity and Data Privacy',
    description: 'Data protection policies, cybersecurity measures, and regulatory compliance',
    requirements: [
      'Internet information services licensing requirements',
      'Foreign ownership restrictions on information services',
      'Personal data collection and usage policies',
      'Data protection measures (collection, storage, processing)',
      'Data usage, transfer, disclosure policies',
      'Data retention and destruction procedures',
      'Compliance status with privacy protection laws',
      'Material data leakage incidents',
      'Cybersecurity infrastructure and measures'
    ],
    complianceAreas: ['Data privacy regulations', 'Cybersecurity compliance'],
    promptTemplate: `Generate a detailed Cybersecurity and Data Privacy section covering:
1. Internet services licensing and regulatory framework
2. Personal data collection and protection policies
3. Data lifecycle management (collection to destruction)
4. Cross-border data transfer compliance
5. Privacy law compliance across jurisdictions
6. Cybersecurity measures and infrastructure
7. Data breach history and incident response
Include specific compliance status and protection measures implemented.`
  },

  licences_permits: {
    sectionType: 'licences_permits',
    title: 'Licences and Permits',
    description: 'Material licences, permits, compliance status, and renewal procedures',
    requirements: [
      'General business licence requirements',
      'Special licensing requirements for core business',
      'Material licences and permits obtained',
      'Licence holder details',
      'Issuing authority information',
      'Grant and expiry dates',
      'Validity periods',
      'Compliance confirmation with all requirements',
      'Periodic renewal procedures',
      'Legal impediments to renewal assessment'
    ],
    tabularElements: [
      'Material Licences & Permits table with: Holder, Licence Name, Issuing Authority, Grant Date, Expiry Date'
    ],
    complianceAreas: ['Regulatory compliance', 'Operating licence validity'],
    promptTemplate: `Generate a comprehensive Licences and Permits section including:
1. General statement on licensing requirements
2. Core business licensing framework
3. Detailed schedule of material licences and permits
4. Compliance confirmation and renewal status
5. Assessment of renewal impediments
6. Regulatory compliance across jurisdictions
Include comprehensive table format showing all material licences with holder, authority, and validity details.`
  },

  recognitions_awards: {
    sectionType: 'recognitions_awards',
    title: 'Recognitions and Awards',
    description: 'Industry awards, recognitions, and credibility demonstrations',
    requirements: [
      'Industry awards received',
      'Recognition from authoritative bodies',
      'Award categories and significance',
      'Awarding organisation credibility',
      'Year of recognition',
      'Awards demonstrating market reputation',
      'Innovation and service quality awards',
      'Industry leadership recognition'
    ],
    tabularElements: [
      'Major Awards table with: Award Name, Awarding Authority, Year Received'
    ],
    complianceAreas: ['Market reputation evidence', 'Third-party validation'],
    promptTemplate: `Generate a comprehensive Recognitions and Awards section including:
1. General statement on industry recognition
2. Structured presentation of major awards
3. Awarding authority credibility and significance
4. Awards demonstrating market leadership
5. Innovation and quality recognitions
6. Timeline of recognition history
Include tabular presentation showing award names, authorities, and years received.`
  },

  insurance: {
    sectionType: 'insurance',
    title: 'Insurance',
    description: 'Insurance policies, coverage adequacy, and risk management',
    requirements: [
      'Insurance policies undertaken',
      'Coverage types and limits',
      'Uncovered risks identification',
      'Share of liability with counterparties',
      'Sufficiency of coverage assessment',
      'Comparability with industry peers',
      'Premium costs and policy terms',
      'Claims history and experience'
    ],
    complianceAreas: ['Risk management disclosure', 'Insurance adequacy'],
    promptTemplate: `Generate a detailed Insurance section covering:
1. Comprehensive insurance policy portfolio
2. Coverage types, limits, and terms
3. Risk areas not covered by insurance
4. Liability sharing arrangements
5. Coverage adequacy assessment vs industry standards
6. Premium costs and claims experience
Include comparison with industry peers and uncovered risk explanation.`
  },

  esg: {
    sectionType: 'esg',
    title: 'Environmental, Social and Governance',
    description: 'ESG policies, sustainability initiatives, and governance practices',
    requirements: [
      'Environmental protection policies',
      'Sustainability initiatives and targets',
      'Social responsibility programs',
      'Employee welfare and community engagement',
      'Governance structure and policies',
      'Board diversity and independence',
      'Risk management framework',
      'Stakeholder engagement processes',
      'ESG reporting and disclosure practices'
    ],
    complianceAreas: ['ESG disclosure requirements', 'Sustainability reporting'],
    promptTemplate: `Generate a comprehensive ESG section covering:
1. Environmental protection policies and initiatives
2. Social responsibility programs and community engagement
3. Governance structure and board composition
4. Stakeholder engagement and materiality assessment
5. ESG risk management and reporting
6. Sustainability targets and performance metrics
Include specific policies, initiatives, and measurable outcomes demonstrating ESG commitment.`
  },

  employees: {
    sectionType: 'employees',
    title: 'Employees',
    description: 'Employee composition, training, recruitment, and labour relations',
    requirements: [
      'Number of employees by function',
      'Geographic distribution of workforce',
      'Training and development policies',
      'Recruitment strategies and policies',
      'Labour union relationships',
      'Labour disputes and resolution',
      'Employment agent arrangements',
      'Salient terms of outsourcing arrangements',
      'Legality of employment agent engagement',
      'Social insurance and housing fund responsibilities'
    ],
    tabularElements: ['Employee breakdown by function and location'],
    complianceAreas: ['Labour law compliance', 'Employee benefit obligations'],
    promptTemplate: `Generate a comprehensive Employees section covering:
1. Employee composition by function and geography
2. Training and development programs
3. Recruitment policies and strategies
4. Labour relations and union engagement
5. Employment outsourcing arrangements
6. Social insurance and benefit obligations
Include employee statistics table and labour compliance confirmation.`
  },

  intellectual_property: {
    sectionType: 'intellectual_property',
    title: 'Intellectual Property',
    description: 'Trademarks, patents, IP disputes, and protection strategies',
    requirements: [
      'Material trademarks registered and pending',
      'Patent portfolio (registered and pending)',
      'Trade secrets and know-how protection',
      'IP registration jurisdictions',
      'IP disputes and infringement issues',
      'Legal actions related to IP',
      'IP licensing agreements',
      'IP protection strategies'
    ],
    tabularElements: ['IP portfolio table with registration status'],
    complianceAreas: ['IP ownership verification', 'Infringement risk disclosure'],
    promptTemplate: `Generate a detailed Intellectual Property section covering:
1. Trademark and patent portfolio with registration status
2. Trade secrets and proprietary technology protection
3. IP disputes, infringements, and legal actions
4. IP licensing arrangements and revenue
5. Geographic IP protection strategy
6. IP risk management and enforcement
Include comprehensive IP portfolio table and dispute resolution history.`
  },

  properties: {
    sectionType: 'properties',
    title: 'Properties',
    description: 'Property portfolio, ownership structure, and land use rights',
    requirements: [
      'Property portfolio composition',
      'Owned vs leased property breakdown',
      'Land use rights and terms',
      'Property valuation and basis',
      'Location and strategic importance',
      'Lease terms and renewal options',
      'Property-related compliance issues',
      'Future property requirements'
    ],
    tabularElements: ['Property portfolio table with ownership and valuation'],
    complianceAreas: ['Property title verification', 'Valuation methodology'],
    promptTemplate: `Generate a comprehensive Properties section covering:
1. Property portfolio composition and strategic importance
2. Ownership structure and land use rights
3. Property valuations with methodology
4. Lease arrangements and renewal terms
5. Property-related compliance and title verification
6. Future property expansion requirements
Include detailed property table with locations, ownership status, and valuations.`
  },

  non_compliance: {
    sectionType: 'non_compliance',
    title: 'Non-Compliance',
    description: 'Material non-compliance incidents, remedial actions, and impact assessment',
    requirements: [
      'Material non-compliance incidents',
      'Nature and severity of violations',
      'Regulatory actions and penalties',
      'Remedial measures implemented',
      'Impact on business operations',
      'Impact on suitability for listing',
      'Prevention measures implemented',
      'Ongoing compliance monitoring'
    ],
    complianceAreas: ['Regulatory violation disclosure', 'Remediation effectiveness'],
    promptTemplate: `Generate a detailed Non-Compliance section covering:
1. Material non-compliance incidents during track record period
2. Nature, severity, and regulatory response
3. Financial penalties and operational impact
4. Comprehensive remedial actions taken
5. Enhanced compliance measures implemented
6. Impact assessment on listing suitability
Include specific incident details, remediation timeline, and prevention measures.`
  },

  legal_proceedings: {
    sectionType: 'legal_proceedings',
    title: 'Legal Proceedings',
    description: 'Material claims, litigations, and impact on operations',
    requirements: [
      'Actual material claims and litigations',
      'Threatened legal proceedings',
      'Impact on business operations',
      'Financial performance implications',
      'Reputational impact assessment',
      'Directors\' involvement in proceedings',
      'Settlement negotiations and outcomes',
      'Legal cost provisions and insurance coverage'
    ],
    complianceAreas: ['Material litigation disclosure', 'Contingent liability assessment'],
    promptTemplate: `Generate a comprehensive Legal Proceedings section covering:
1. Current and threatened material legal proceedings
2. Nature of claims and potential financial exposure
3. Impact on operations, financial performance, and reputation
4. Director and management involvement
5. Settlement status and negotiation progress
6. Legal cost provisions and insurance coverage
Include specific case details while maintaining appropriate confidentiality.`
  },

  internal_control: {
    sectionType: 'internal_control',
    title: 'Internal Control Measures and Risk Management',
    description: 'Risk management policies, internal controls, and monitoring effectiveness',
    requirements: [
      'Risk management policies and procedures',
      'Internal control systems',
      'Significant risk identification and evaluation',
      'Market, credit, and operational risk management',
      'Risk factor cross-references',
      'Hedging strategy and derivative usage',
      'Speculative activity policies',
      'Hedging method selection criteria',
      'Key hedging contract terms',
      'Net hedging position disclosure',
      'Effectiveness monitoring measures',
      'External professional assessments'
    ],
    complianceAreas: ['Risk management framework', 'Internal control effectiveness'],
    promptTemplate: `Generate a comprehensive Internal Control and Risk Management section covering:
1. Risk management framework and governance
2. Internal control systems and procedures
3. Risk identification, assessment, and mitigation strategies
4. Hedging policies and derivative instrument usage
5. Control effectiveness monitoring and testing
6. External professional assessments and recommendations
Include specific risk categories, control measures, and monitoring mechanisms.`
  }
};

/**
 * Get enhanced section template by section type
 */
export function getEnhancedSectionTemplate(sectionType: string): IPOSectionTemplate | null {
  return ENHANCED_IPO_SECTIONS[sectionType] || null;
}

/**
 * Get all available section types
 */
export function getAllSectionTypes(): string[] {
  return Object.keys(ENHANCED_IPO_SECTIONS);
}

/**
 * Get section title by type
 */
export function getSectionTitle(sectionType: string): string {
  const template = ENHANCED_IPO_SECTIONS[sectionType];
  return template?.title || 'Business Section';
}

/**
 * Build enhanced prompt for specific section type
 */
export function buildSectionSpecificPrompt(
  sectionType: string,
  userMessage: string,
  currentContent: string,
  projectContext?: any
): string {
  const template = getEnhancedSectionTemplate(sectionType);
  
  if (!template) {
    return `Generate content for the ${sectionType} section based on: ${userMessage}`;
  }

  return `${template.promptTemplate}

**USER REQUEST:** ${userMessage}

**CURRENT CONTENT:** 
${currentContent || 'No existing content - starting fresh'}

**PROJECT CONTEXT:**
${projectContext ? JSON.stringify(projectContext, null, 2) : 'Standard IPO project'}

**SPECIFIC REQUIREMENTS FOR THIS SECTION:**
${template.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

${template.tabularElements && template.tabularElements.length > 0 ? `
**REQUIRED TABULAR ELEMENTS:**
${template.tabularElements.map((element, index) => `${index + 1}. ${element}`).join('\n')}
` : ''}

**COMPLIANCE AREAS:**
${template.complianceAreas.join(', ')}

Generate professional, HKEX-compliant content that addresses all requirements and incorporates the user's specific request.`;
}