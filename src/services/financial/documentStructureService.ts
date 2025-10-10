/**
 * Database service layer for document structure
 * Handles saving and retrieving AI-discovered document structure
 */

import { supabase } from '@/integrations/supabase/client';
import { DocumentStructure, ContentBlock, CrossReference } from './types/documentStructure';

export const documentStructureService = {
  /**
   * Save discovered content blocks to database
   */
  saveContentBlocks: async (
    financialStatementId: string,
    contentBlocks: ContentBlock[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const blocksToInsert = contentBlocks.map(block => ({
        financial_statement_id: financialStatementId,
        block_type: block.type,
        semantic_classification: block.metadata.semanticTags,
        content: block.content,
        confidence_score: block.metadata.confidence,
        relevance_score: block.metadata.semanticTags.includes('material') ? 0.9 : 0.5,
        section_path: block.metadata.sectionPath,
        page_numbers: block.metadata.pageNumber ? [block.metadata.pageNumber] : []
      }));

      const { error } = await supabase
        .from('financial_content_blocks')
        .insert(blocksToInsert);

      if (error) {
        console.error('Error saving content blocks:', error);
        return { success: false, error: error.message };
      }

      console.log(`✓ Saved ${contentBlocks.length} content blocks to database`);
      return { success: true };

    } catch (error) {
      console.error('Error in saveContentBlocks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Save cross-references to database
   */
  saveCrossReferences: async (
    financialStatementId: string,
    crossReferences: CrossReference[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // First, get the actual database IDs for the content blocks
      const { data: savedBlocks, error: fetchError } = await supabase
        .from('financial_content_blocks')
        .select('id, content')
        .eq('financial_statement_id', financialStatementId);

      if (fetchError || !savedBlocks) {
        return { success: false, error: 'Could not fetch saved content blocks' };
      }

      // Create a mapping from temporary IDs to database IDs
      const idMap = new Map<string, string>();
      savedBlocks.forEach((block, index) => {
        idMap.set(`block-${index + 1}`, block.id);
      });

      const referencesToInsert = crossReferences
        .map(ref => {
          const sourceId = idMap.get(ref.sourceBlockId);
          const targetId = idMap.get(ref.targetBlockId);

          if (!sourceId || !targetId) return null;

          return {
            source_block_id: sourceId,
            target_block_id: targetId,
            relationship_type: ref.referenceType,
            relationship_metadata: ref.metadata,
            confidence: ref.confidence
          };
        })
        .filter((ref): ref is NonNullable<typeof ref> => ref !== null);

      if (referencesToInsert.length === 0) {
        console.log('No cross-references to save');
        return { success: true };
      }

      const { error } = await supabase
        .from('financial_cross_references')
        .insert(referencesToInsert);

      if (error) {
        console.error('Error saving cross-references:', error);
        return { success: false, error: error.message };
      }

      console.log(`✓ Saved ${referencesToInsert.length} cross-references to database`);
      return { success: true };

    } catch (error) {
      console.error('Error in saveCrossReferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Retrieve document structure from database
   */
  getDocumentStructure: async (
    financialStatementId: string
  ): Promise<{ structure: DocumentStructure | null; error?: string }> => {
    try {
      // Fetch content blocks
      const { data: blocks, error: blocksError } = await supabase
        .from('financial_content_blocks')
        .select('*')
        .eq('financial_statement_id', financialStatementId);

      if (blocksError) {
        return { structure: null, error: blocksError.message };
      }

      // Fetch cross-references
      const { data: references, error: refsError } = await supabase
        .from('financial_cross_references')
        .select('*')
        .in('source_block_id', blocks?.map(b => b.id) || []);

      if (refsError) {
        return { structure: null, error: refsError.message };
      }

      // Transform back to ContentBlock format
      const contentBlocks: ContentBlock[] = (blocks || []).map(block => ({
        id: block.id,
        type: block.block_type as ContentBlock['type'],
        content: block.content,
        metadata: {
          confidence: block.confidence_score || 0,
          pageNumber: block.page_numbers?.[0],
          sectionPath: block.section_path || [],
          semanticTags: Array.isArray(block.semantic_classification) 
            ? (block.semantic_classification as string[])
            : []
        },
        relationships: {
          supports: [],
          contradicts: [],
          explains: []
        }
      }));

      // Transform cross-references
      const crossReferences: CrossReference[] = (references || []).map(ref => ({
        id: ref.id,
        sourceBlockId: ref.source_block_id,
        targetBlockId: ref.target_block_id,
        referenceType: ref.relationship_type as CrossReference['referenceType'],
        confidence: ref.confidence || 0,
        metadata: (ref.relationship_metadata as { referenceText?: string; pageNumber?: number }) || {}
      }));

      // Note: dataPatterns and documentMetadata would need to be stored separately
      // For now, returning minimal structure
      const structure: DocumentStructure = {
        contentBlocks,
        crossReferences,
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
      };

      return { structure };

    } catch (error) {
      console.error('Error in getDocumentStructure:', error);
      return {
        structure: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
