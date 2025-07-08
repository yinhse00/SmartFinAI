-- Add missing IPO section templates for all expected section types
INSERT INTO ipo_section_templates (section_type, template_name, industry, template_content, regulatory_requirements, sample_content) VALUES
('overview', 'Business Overview Template', 'general', 
 '{"structure": ["Company introduction", "Business model overview", "Market position", "Key operations"], "requirements": ["Clear business description", "Principal activities", "Operating model"]}', 
 '["HKEX Main Board App1A Part A", "Business description requirements"]',
 'The Company is engaged in... Our business model focuses on... We operate primarily in...'
),
('history', 'History & Development Template', 'general',
 '{"structure": ["Corporate history", "Key milestones", "Development stages", "Growth trajectory"], "requirements": ["Chronological development", "Key events", "Expansion history"]}',
 '["HKEX Main Board App1A Part A", "Corporate history requirements"]',
 'The Company was incorporated in... Key milestones include... Our development has been characterized by...'
),
('products', 'Products & Services Template', 'general',
 '{"structure": ["Product portfolio", "Service offerings", "Market segments", "Revenue streams"], "requirements": ["Detailed product description", "Service capabilities", "Market positioning"]}',
 '["HKEX Main Board App1A Part A", "Products and services disclosure"]',
 'Our principal products include... We provide services such as... Our offerings target...'
),
('strengths', 'Competitive Strengths Template', 'general',
 '{"structure": ["Key competitive advantages", "Market differentiators", "Operational strengths", "Strategic positioning"], "requirements": ["Clear competitive positioning", "Substantiated claims", "Market evidence"]}',
 '["HKEX Main Board App1A Part A", "Competitive strengths disclosure"]',
 'Our competitive strengths include... We differentiate ourselves through... Our market position is strengthened by...'
),
('strategy', 'Business Strategy Template', 'general',
 '{"structure": ["Strategic objectives", "Growth plans", "Market expansion", "Operational strategy"], "requirements": ["Clear strategic direction", "Implementation plans", "Timeline and milestones"]}',
 '["HKEX Main Board App1A Part A", "Business strategy requirements"]',
 'Our strategy focuses on... We plan to achieve growth through... Key strategic initiatives include...'
),
('financial_summary', 'Financial Summary Template', 'general',
 '{"structure": ["Revenue analysis", "Profitability metrics", "Financial position", "Key ratios"], "requirements": ["Historical financial data", "Trend analysis", "Key performance indicators"]}',
 '["HKEX Main Board App1A Part A", "Financial information requirements"]',
 'Our revenue for the track record period... Profitability has been driven by... Key financial metrics include...'
),
('risk_factors', 'Risk Factors Template', 'general',
 '{"structure": ["Business risks", "Industry risks", "Regulatory risks", "Financial risks"], "requirements": ["Material risk disclosure", "Risk mitigation measures", "Impact assessment"]}',
 '["HKEX Main Board App1A Part A", "Risk factors disclosure requirements"]',
 'We face various risks including... Industry-specific risks comprise... Regulatory changes may impact...'
);