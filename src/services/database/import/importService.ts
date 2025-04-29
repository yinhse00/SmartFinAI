
import { supabase } from '@/integrations/supabase/client';
import { regulatoryDatabaseService } from '../regulatoryDatabaseService';
import { DocumentCategory } from '@/types/references';
import { parseRegulatoryText } from './parseUtils';
import { processDefinitions } from './definitionUtils';

export interface ImportResult {
  success: boolean;
  provisionsAdded: number;
  definitionsAdded: number;
  errors: string[];
}

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
    
    // Enhanced category detection for specific chapters
    if (content.includes("Chapter 14A") || content.includes("14A")) {
      categoryCode = 'chapter_14a';
    } else if (content.includes("Chapter 14") || /\b14\.\d+/.test(content)) {
      categoryCode = 'chapter_14';
    } else if (content.includes("Chapter 13") || /\b13\.\d+/.test(content)) {
      categoryCode = 'chapter_13';
    } else {
      switch (category) {
        case 'listing_rules':
          // Determine more specific category based on content
          if (content.includes("Chapter 13")) {
            categoryCode = 'chapter_13';
          } else if (content.includes("Chapter 14A")) {
            categoryCode = 'chapter_14a';
          } else if (content.includes("Chapter 14")) {
            categoryCode = 'chapter_14';
          } else {
            categoryCode = 'listing_rules';
          }
          break;
        default:
          categoryCode = category;
      }
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
    
    console.log(`Parsed ${provisions.length} provisions from content`);
    console.log(`First provision: ${provisions[0].rule_number} - ${provisions[0].title}`);
    
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
        const definitionsAdded = await processDefinitions(provision, categoryId);
        result.definitionsAdded += definitionsAdded;
      }
    }
    
    result.success = result.provisionsAdded > 0;
  } catch (error) {
    result.errors.push(`Unexpected error during import: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return result;
};
