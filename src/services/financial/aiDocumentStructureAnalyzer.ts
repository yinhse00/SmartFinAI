/**
 * AI-Powered Document Structure Analyzer
 * Dynamically discovers document structure without hardcoded patterns
 */

import { grokService } from '../grokService';
import {
  DocumentStructure,
  ContentBlock,
  CrossReference,
  DataPattern,
  DocumentMetadata,
  DocumentAnalysisResult,
  DocumentQuality
} from './types/documentStructure';

export const aiDocumentStructureAnalyzer = {
  /**
   * Main entry point - analyze document structure using AI
   */
  analyzeDocumentStructure: async (
    documentContent: string,
    fileName: string
  ): Promise<DocumentAnalysisResult> => {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      console.log('🔍 Starting AI document structure discovery...');

      // Step 1: Discover content blocks
      const contentBlocks = await aiDocumentStructureAnalyzer.discoverContentBlocks(documentContent);
      console.log(`✓ Discovered ${contentBlocks.length} content blocks`);

      // Step 2: Detect data patterns
      const dataPatterns = await aiDocumentStructureAnalyzer.detectDataPatterns(documentContent);
      console.log('✓ Detected data patterns:', dataPatterns);

      // Step 3: Map cross-references
      const crossReferences = await aiDocumentStructureAnalyzer.mapCrossReferences(
        documentContent,
        contentBlocks
      );
      console.log(`✓ Mapped ${crossReferences.length} cross-references`);

      // Step 4: Extract document metadata
      const documentMetadata = await aiDocumentStructureAnalyzer.extractDocumentMetadata(
        documentContent,
        fileName
      );
      console.log('✓ Extracted metadata:', documentMetadata);

      const structure: DocumentStructure = {
        contentBlocks,
        crossReferences,
        dataPatterns,
        documentMetadata
      };

      // Step 5: Assess quality
      const quality = aiDocumentStructureAnalyzer.assessDocumentQuality(structure);
      console.log('✓ Quality assessment:', quality);

      return {
        structure,
        quality,
        processingTime: Date.now() - startTime,
        errors
      };

    } catch (error) {
      console.error('❌ Document structure analysis failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Return minimal structure on error
      return {
        structure: {
          contentBlocks: [],
          crossReferences: [],
          dataPatterns: {
            periods: [],
            currency: 'Unknown',
            units: 'Unknown',
            numberFormat: 'Unknown',
            detectionConfidence: 0
          },
          documentMetadata: {
            reportingFramework: 'Unknown',
            auditStatus: 'unknown',
            documentType: 'Unknown',
            confidence: 0
          }
        },
        quality: {
          overall: 'low',
          contentBlocksConfidence: 0,
          crossReferencesConfidence: 0,
          dataPatternsConfidence: 0,
          metadataConfidence: 0,
          issues: errors
        },
        processingTime: Date.now() - startTime,
        errors
      };
    }
  },

  /**
   * Step 1: Discover content blocks using AI
   */
  discoverContentBlocks: async (documentContent: string): Promise<ContentBlock[]> => {
    const prompt = `
Analyze this accountant report and discover its content structure WITHOUT using predefined patterns.

Document Content (first 15000 chars):
${documentContent.substring(0, 15000)}

Tasks:
1. **Identify Content Blocks**:
   - Find all distinct sections (don't assume standard names)
   - Identify tables, paragraphs, footnotes, headers
   - Discover section hierarchy and relationships
   
2. **Semantic Classification**:
   - What type of information does each block contain?
   - Which blocks appear material or important?
   - What semantic tags apply? (e.g., 'material', 'audited', 'positive-trend')

3. **Relationships**:
   - Which blocks support or explain others?
   - Are there any contradictions?
   - What's the confidence level for each discovery?

Output Format:
Return a JSON array of content blocks with this structure:
[{
  "id": "block-1",
  "type": "table|paragraph|footnote|header|section|list",
  "content": "extracted content or description",
  "metadata": {
    "confidence": 0.95,
    "pageNumber": 1,
    "sectionPath": ["Financial Statements", "Consolidated Statement of Profit or Loss"],
    "semanticTags": ["material", "audited"]
  },
  "relationships": {
    "supports": [],
    "contradicts": [],
    "explains": []
  }
}]

Return ONLY valid JSON, no additional text.
`;

    try {
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          type: 'document_structure_discovery',
          stage: 'content_blocks'
        }
      });

      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in AI response');
      }

      const blocks = JSON.parse(jsonMatch[0]) as ContentBlock[];
      return blocks;

    } catch (error) {
      console.error('Error discovering content blocks:', error);
      return [];
    }
  },

  /**
   * Step 2: Detect data patterns (periods, currency, units)
   */
  detectDataPatterns: async (documentContent: string): Promise<DataPattern> => {
    const prompt = `
Analyze this accountant report and detect data patterns WITHOUT predefined assumptions.

Document Content (first 10000 chars):
${documentContent.substring(0, 10000)}

Tasks:
1. **Period Detection**:
   - What period formats are used? (e.g., 'FY2024', '6 months ended 30 June 2025', 'Q3-2024')
   - What are the start/end dates if mentioned?
   - Is this annual, interim, quarterly, or other?

2. **Currency & Units**:
   - What currency is used? (e.g., 'HKD', 'USD', 'RMB')
   - What units? (e.g., 'thousands', 'millions', actual amounts)
   - What's the number formatting convention? (e.g., '1,234.56' vs '1.234,56')

Output Format:
Return JSON with this structure:
{
  "periods": [{
    "label": "FY2024",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "periodType": "annual",
    "confidence": 0.95
  }],
  "currency": "HKD",
  "units": "thousands",
  "numberFormat": "1,234.56",
  "detectionConfidence": 0.90
}

Return ONLY valid JSON, no additional text.
`;

    try {
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          type: 'document_structure_discovery',
          stage: 'data_patterns'
        }
      });

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const patterns = JSON.parse(jsonMatch[0]) as DataPattern;
      return patterns;

    } catch (error) {
      console.error('Error detecting data patterns:', error);
      return {
        periods: [],
        currency: 'Unknown',
        units: 'Unknown',
        numberFormat: 'Unknown',
        detectionConfidence: 0
      };
    }
  },

  /**
   * Step 3: Map cross-references between content blocks
   */
  mapCrossReferences: async (
    documentContent: string,
    contentBlocks: ContentBlock[]
  ): Promise<CrossReference[]> => {
    if (contentBlocks.length === 0) return [];

    const prompt = `
Analyze this accountant report and discover cross-references between sections.

Document Content (first 12000 chars):
${documentContent.substring(0, 12000)}

Known Content Blocks:
${JSON.stringify(contentBlocks.map(b => ({ id: b.id, type: b.type, sectionPath: b.metadata.sectionPath })), null, 2)}

Tasks:
1. **Identify References**:
   - Which sections reference other sections?
   - What footnotes explain which items?
   - Are there reconciliations or breakdowns?
   
2. **Classify Relationships**:
   - footnote, section_reference, explanation, reconciliation, breakdown
   - Provide confidence scores

Output Format:
Return JSON array:
[{
  "id": "ref-1",
  "sourceBlockId": "block-2",
  "targetBlockId": "block-5",
  "referenceType": "footnote",
  "confidence": 0.90,
  "metadata": {
    "referenceText": "Note 5",
    "pageNumber": 3
  }
}]

Return ONLY valid JSON array, no additional text.
`;

    try {
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          type: 'document_structure_discovery',
          stage: 'cross_references'
        }
      });

      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const references = JSON.parse(jsonMatch[0]) as CrossReference[];
      return references;

    } catch (error) {
      console.error('Error mapping cross-references:', error);
      return [];
    }
  },

  /**
   * Step 4: Extract document metadata
   */
  extractDocumentMetadata: async (
    documentContent: string,
    fileName: string
  ): Promise<DocumentMetadata> => {
    const prompt = `
Analyze this accountant report and extract key metadata WITHOUT predefined assumptions.

File Name: ${fileName}
Document Content (first 8000 chars):
${documentContent.substring(0, 8000)}

Tasks:
1. **Reporting Framework**: What accounting framework? (HKFRS, IFRS, US GAAP, other)
2. **Audit Status**: Is this audited, reviewed, or unaudited?
3. **Document Type**: What type of financial report is this?
4. **Company Name**: What company is this report for?
5. **Report Date**: What period/date is this report for?

Output Format:
Return JSON:
{
  "reportingFramework": "HKFRS",
  "auditStatus": "audited",
  "documentType": "Annual Financial Statements",
  "companyName": "Company Name Ltd",
  "reportDate": "2024-12-31",
  "confidence": 0.92
}

Return ONLY valid JSON, no additional text.
`;

    try {
      const response = await grokService.generateResponse({
        prompt,
        metadata: {
          type: 'document_structure_discovery',
          stage: 'metadata'
        }
      });

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const metadata = JSON.parse(jsonMatch[0]) as DocumentMetadata;
      return metadata;

    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        reportingFramework: 'Unknown',
        auditStatus: 'unknown',
        documentType: 'Unknown',
        confidence: 0
      };
    }
  },

  /**
   * Step 5: Assess overall document quality
   */
  assessDocumentQuality: (structure: DocumentStructure): DocumentQuality => {
    const issues: string[] = [];

    // Check content blocks
    const avgBlockConfidence = structure.contentBlocks.length > 0
      ? structure.contentBlocks.reduce((sum, b) => sum + b.metadata.confidence, 0) / structure.contentBlocks.length
      : 0;

    if (structure.contentBlocks.length === 0) {
      issues.push('No content blocks discovered');
    }

    // Check cross-references
    const avgRefConfidence = structure.crossReferences.length > 0
      ? structure.crossReferences.reduce((sum, r) => sum + r.confidence, 0) / structure.crossReferences.length
      : 0;

    // Check data patterns
    const dataPatternsConfidence = structure.dataPatterns.detectionConfidence;
    if (structure.dataPatterns.periods.length === 0) {
      issues.push('No periods detected');
    }

    // Check metadata
    const metadataConfidence = structure.documentMetadata.confidence;
    if (structure.documentMetadata.reportingFramework === 'Unknown') {
      issues.push('Reporting framework unknown');
    }

    // Overall quality
    const avgConfidence = (avgBlockConfidence + avgRefConfidence + dataPatternsConfidence + metadataConfidence) / 4;
    const overall: 'high' | 'medium' | 'low' = 
      avgConfidence >= 0.8 ? 'high' :
      avgConfidence >= 0.6 ? 'medium' : 'low';

    return {
      overall,
      contentBlocksConfidence: avgBlockConfidence,
      crossReferencesConfidence: avgRefConfidence,
      dataPatternsConfidence,
      metadataConfidence,
      issues
    };
  }
};
