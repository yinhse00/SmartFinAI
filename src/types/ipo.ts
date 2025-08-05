export interface IPOProject {
  id: string;
  user_id: string;
  company_name: string;
  project_name: string;
  industry?: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface IPOSection {
  id: string;
  project_id: string;
  section_type: string;
  section_number?: string;
  title: string;
  content?: string;
  sources: SourceAttribution[];
  confidence_score: number;
  status: 'draft' | 'review' | 'completed' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface IPODDDocument {
  id: string;
  project_id: string;
  document_name: string;
  document_type: 'financial' | 'legal' | 'business' | 'technical' | 'market';
  file_path?: string;
  file_url?: string;
  extracted_content?: string;
  key_insights: any[];
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface IPOSectionTemplate {
  id: string;
  section_type: string;
  industry?: string;
  template_name: string;
  template_content: {
    sections: TemplateSection[];
  };
  regulatory_requirements: string[];
  sample_content?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  fields: string[];
  regulatory_ref: string;
  description?: string;
}

export interface SourceAttribution {
  id: string;
  section_id: string;
  content_snippet: string;
  source_document_id?: string;
  source_type: 'dd_document' | 'template' | 'ai_generated' | 'manual';
  source_reference?: string;
  confidence_score: number;
  created_at: string;
}

export interface IPOContentGenerationRequest {
  project_id: string;
  section_type: string;
  template_id?: string;
  dd_documents?: string[];
  key_elements?: Record<string, any>;
  regulatory_requirements?: string[];
  industry_context?: string;
}

export interface IPOContentGenerationResponse {
  content: string;
  sources: SourceAttribution[];
  confidence_score: number;
  regulatory_compliance: {
    requirements_met: string[];
    missing_requirements: string[];
    recommendations: string[];
  };
  quality_metrics: {
    completeness: number;
    accuracy: number;
    regulatory_alignment: number;
    professional_language: number;
  };
  processing_metadata?: {
    totalTime: number;
    aiTime: number;
    dataFetchTime: number;
    usedParallelProcessing: boolean;
    sourcesUsed: number;
  };
}