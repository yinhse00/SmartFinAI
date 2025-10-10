/**
 * Type definitions for AI-powered document structure discovery
 * Zero hardcoded patterns - all structure is AI-discovered
 */

export interface DocumentStructure {
  contentBlocks: ContentBlock[];
  crossReferences: CrossReference[];
  dataPatterns: DataPattern;
  documentMetadata: DocumentMetadata;
}

export interface ContentBlock {
  id: string;
  type: 'table' | 'paragraph' | 'footnote' | 'header' | 'section' | 'list';
  content: any; // AI structures this dynamically
  metadata: {
    confidence: number; // 0-1
    pageNumber?: number;
    sectionPath: string[]; // AI-discovered hierarchy
    semanticTags: string[]; // ['material', 'audited', 'positive-trend']
  };
  relationships: {
    supports: string[]; // IDs of blocks this supports
    contradicts: string[]; // IDs of conflicting blocks
    explains: string[]; // IDs of blocks this explains
  };
}

export interface CrossReference {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  referenceType: 'footnote' | 'section_reference' | 'explanation' | 'reconciliation' | 'breakdown';
  confidence: number;
  metadata: {
    referenceText?: string;
    pageNumber?: number;
  };
}

export interface DataPattern {
  periods: PeriodInfo[];
  currency: string;
  units: string; // e.g., 'thousands', 'millions'
  numberFormat: string; // e.g., '1,234.56' vs '1.234,56'
  detectionConfidence: number;
}

export interface PeriodInfo {
  label: string; // AI-discovered: 'FY2024', '6M2025', 'Q3-2024'
  startDate?: string;
  endDate?: string;
  periodType: 'annual' | 'interim' | 'quarterly' | 'other';
  confidence: number;
}

export interface DocumentMetadata {
  reportingFramework: string; // AI detects: 'HKFRS', 'IFRS', 'US GAAP'
  auditStatus: 'audited' | 'reviewed' | 'unaudited' | 'unknown';
  documentType: string; // AI discovers, not limited to predefined types
  companyName?: string;
  reportDate?: string;
  confidence: number;
}

export interface DocumentAnalysisResult {
  structure: DocumentStructure;
  quality: DocumentQuality;
  processingTime: number;
  errors: string[];
}

export interface DocumentQuality {
  overall: 'high' | 'medium' | 'low';
  contentBlocksConfidence: number;
  crossReferencesConfidence: number;
  dataPatternsConfidence: number;
  metadataConfidence: number;
  issues: string[];
}
