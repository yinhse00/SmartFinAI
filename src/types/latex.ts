/**
 * TypeScript interfaces for LaTeX integration
 */

import { IPOContentGenerationRequest, IPOContentGenerationResponse } from './ipo';

export interface LaTeXGenerationRequest extends IPOContentGenerationRequest {
  outputFormat: 'latex';
  baseTemplate?: string;
  targetInstructions?: string;
}

export interface LaTeXGenerationResponse extends IPOContentGenerationResponse {
  latexContent: string;
  compilationReady: boolean;
  artifactId: string;
}

export interface LaTeXSection {
  type: 'section' | 'subsection' | 'subsubsection' | 'table' | 'list' | 'paragraph';
  title?: string;
  content: string;
  startIndex: number;
  endIndex: number;
  level?: number;
}

export interface LaTeXDocument {
  content: string;
  sections: LaTeXSection[];
  tables: LaTeXSection[];
  metadata: {
    artifactId?: string;
    title?: string;
    contentType: 'text/latex';
    lastModified: Date;
  };
}

export interface LaTeXEditRequest {
  targetType: 'section' | 'table' | 'content' | 'calculation';
  targetIdentifier: string;
  operation: 'replace' | 'insert' | 'delete' | 'calculate';
  newContent?: string;
  preserveFormatting?: boolean;
}

export interface LaTeXEditResult {
  success: boolean;
  updatedContent: string;
  changes: {
    type: string;
    location: string;
    oldContent: string;
    newContent: string;
  }[];
  validationResults: {
    syntaxValid: boolean;
    compilationReady: boolean;
    issues: string[];
  };
}