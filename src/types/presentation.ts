export interface PresentationSlide {
  id: string;
  type: SlideType;
  title: string;
  content: SlideContent;
  order: number;
  metadata: SlideMetadata;
}

export interface SlideContent {
  title?: string;
  bulletPoints?: string[];
  visualElements?: VisualElement[];
  charts?: ChartData[];
  notes?: string;
}

export interface VisualElement {
  type: 'text' | 'image' | 'chart' | 'table' | 'shape';
  position: { x: number; y: number; width: number; height: number };
  content: any;
  styling?: any;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: any[];
  title: string;
  labels?: string[];
}

export interface SlideMetadata {
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isGenerated?: boolean;
  aiPrompt?: string;
}

export type SlideType = 
  | 'title'
  | 'agenda'
  | 'executive_summary'
  | 'business_overview'
  | 'financial_highlights'
  | 'market_opportunity'
  | 'competitive_advantages'
  | 'use_of_proceeds'
  | 'management_team'
  | 'risk_factors'
  | 'credentials'
  | 'contact'
  | 'appendix'
  | 'custom';

export interface Presentation {
  id: string;
  title: string;
  type: PresentationType;
  slides: PresentationSlide[];
  metadata: PresentationMetadata;
  settings: PresentationSettings;
}

export type PresentationType = 
  | 'ipo_roadshow'
  | 'investment_banking_pitch'
  | 'deal_structuring'
  | 'custom';

export interface PresentationMetadata {
  companyName?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  version: number;
}

export interface PresentationSettings {
  theme: PresentationTheme;
  template: string;
  branding?: BrandingSettings;
  exportSettings?: ExportSettings;
}

export interface PresentationTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface BrandingSettings {
  logo?: string;
  companyName: string;
  tagline?: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface ExportSettings {
  format: 'pptx' | 'pdf' | 'html';
  quality: 'standard' | 'high';
  includeNotes: boolean;
}

export interface SlideTemplate {
  type: SlideType;
  name: string;
  description: string;
  layout: SlideLayout;
  defaultContent: SlideContent;
  isCustom: boolean;
}

export interface SlideLayout {
  type: 'title' | 'content' | 'two-column' | 'visual-heavy' | 'chart' | 'blank';
  regions: LayoutRegion[];
}

export interface LayoutRegion {
  id: string;
  type: 'title' | 'content' | 'visual' | 'chart';
  position: { x: number; y: number; width: number; height: number };
  constraints?: LayoutConstraints;
}

export interface LayoutConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

// AI Chat specific types for presentations
export interface PresentationAIRequest {
  type: 'generate_slide' | 'enhance_content' | 'suggest_improvements' | 'check_compliance' | 'reorganize';
  slideId?: string;
  prompt: string;
  context?: {
    presentationType: PresentationType;
    currentSlides: PresentationSlide[];
    projectData?: any;
  };
}

export interface PresentationAIResponse {
  type: 'slide_generated' | 'content_enhanced' | 'suggestions' | 'compliance_check' | 'reorganization';
  slideData?: PresentationSlide | PresentationSlide[];
  suggestions?: AISuggestion[];
  complianceResults?: ComplianceResult[];
  message: string;
}

export interface AISuggestion {
  id: string;
  type: 'content' | 'visual' | 'structure' | 'compliance';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action?: 'add_slide' | 'modify_content' | 'reorder' | 'apply_template';
  actionData?: any;
}

export interface ComplianceResult {
  id: string;
  level: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  slideId?: string;
  suggestion?: string;
}