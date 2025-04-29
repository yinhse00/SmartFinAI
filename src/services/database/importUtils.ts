
import { supabase } from '@/integrations/supabase/client';
import { regulatoryDatabaseService, RegulationProvision } from './regulatoryDatabaseService';
import { extractKeyTerms } from './utils/textProcessing';
import { DocumentCategory } from '@/types/references';

interface ImportResult {
  success: boolean;
  provisionsAdded: number;
  definitionsAdded: number;
  errors: string[];
}

/**
 * Helper to extract chapter from rule number
 */
const extractChapter = (ruleNumber: string): string | undefined => {
  // Patterns like "13.45", "14A.32", etc.
  const match = ruleNumber.match(/^(\d+[A-Z]?)/);
  return match ? match[1] : undefined;
};

/**
 * Helper to extract definitions from content
 */
const extractDefinitions = (content: string, categoryId: string | undefined): { term: string; definition: string }[] => {
  const definitions: { term: string; definition: string }[] = [];
  
  // Look for pattern where terms are defined
  // Example: "Associate" means in relation to any person...
  const definitionPatterns = [
    /[""]([^""]+)[""] means\s+([^.]+\.)/g,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+means\s+([^.]+\.)/g
  ];
  
  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim()
      });
    }
  }
  
  return definitions;
};

/**
 * Parse a regulatory document text into provisions
 */
export const parseRegulatoryText = (
  content: string,
  category: DocumentCategory,
  sourceDocumentId?: string
): { provisions: Omit<RegulationProvision, 'id'>[], errors: string[] } => {
  // Changed return type to use Omit to indicate id will be missing
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  const errors: string[] = [];
  
  try {
    // Simple parsing - split by rule numbers
    // This is a basic implementation - would need refinement based on actual document structure
    const rulePattern = /(\d+[A-Z]?\.\d+(?:\.\d+)*)\s+([^.]+)\.([^]*?)(?=\d+[A-Z]?\.\d+|$)/g;
    
    let match;
    while ((match = rulePattern.exec(content)) !== null) {
      const ruleNumber = match[1].trim();
      const title = match[2].trim();
      let ruleContent = match[3].trim();
      
      // Check for minimum valid content
      if (ruleContent.length < 10) {
        errors.push(`Rule ${ruleNumber} has suspiciously short content, might be parsing error`);
        continue;
      }
      
      const chapter = extractChapter(ruleNumber);
      
      provisions.push({
        rule_number: ruleNumber,
        title: title, 
        content: ruleContent,
        chapter: chapter,
        source_document_id: sourceDocumentId
      });
    }
    
    if (provisions.length === 0) {
      errors.push('No provisions were successfully parsed from the content');
    }
  } catch (error) {
    errors.push(`Error parsing regulatory text: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return { provisions, errors };
};

/**
 * Import regulatory content from text into the database
 */
export const importRegulatoryContent = async (
  content: string,
  category: DocumentCategory,
  sourceDocumentId?: string
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    provisionsAdded: 0,
    definitionsAdded: 0,
    errors: []
  };
  
  try {
    // Get category ID
    let categoryCode: string;
    
    switch (category) {
      case 'listing_rules':
        // Determine more specific category based on content
        if (content.includes('Chapter 13')) {
          categoryCode = 'chapter_13';
        } else if (content.includes('Chapter 14A')) {
          categoryCode = 'chapter_14a';
        } else if (content.includes('Chapter 14')) {
          categoryCode = 'chapter_14';
        } else {
          categoryCode = 'listing_rules';
        }
        break;
      default:
        categoryCode = category;
    }
    
    const categoryId = await regulatoryDatabaseService.getCategoryIdByCode(categoryCode);
    
    if (!categoryId) {
      result.errors.push(`Could not find category ID for code: ${categoryCode}`);
    }
    
    // Parse the content into provisions
    const { provisions, errors } = parseRegulatoryText(content, category, sourceDocumentId);
    result.errors.push(...errors);
    
    if (provisions.length === 0) {
      result.errors.push('No provisions were successfully parsed');
      return result;
    }
    
    // Set category ID for all provisions
    if (categoryId) {
      provisions.forEach(provision => {
        provision.category_id = categoryId;
      });
    }
    
    // Add provisions to the database
    // The addProvisions method will handle assigning IDs since we're now explicitly passing partial objects
    const addedCount = await regulatoryDatabaseService.addProvisions(provisions);
    result.provisionsAdded = addedCount;
    
    // Process definitions - for demonstration using only the first provision
    if (provisions.length > 0 && categoryId) {
      // Get the provisions IDs after insertion
      const insertedProvisions = await regulatoryDatabaseService.getProvisionsBySourceDocument(sourceDocumentId || '');
      
      for (const provision of insertedProvisions) {
        const definitions = extractDefinitions(provision.content, categoryId);
        
        for (const def of definitions) {
          const added = await regulatoryDatabaseService.addDefinition({
            term: def.term,
            definition: def.definition,
            category_id: categoryId,
            source_provision_id: provision.id
          });
          
          if (added) {
            result.definitionsAdded++;
          }
        }
      }
    }
    
    result.success = result.provisionsAdded > 0;
  } catch (error) {
    result.errors.push(`Unexpected error during import: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return result;
};
