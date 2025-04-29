
import { supabase } from '@/integrations/supabase/client';
import { regulatoryDatabaseService } from '../regulatoryDatabaseService';
import { DocumentCategory } from '@/types/references';
import { parseRegulatoryText, detectChapter } from './parseUtils';
import { processDefinitions } from './definitionUtils';
import { toast } from '@/components/ui/use-toast';

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
    if (!content || content.trim().length === 0) {
      result.errors.push('Empty content provided');
      return result;
    }

    console.log(`Importing regulatory content for category: ${category}, content length: ${content.length} chars`);
    
    // Get category ID
    let categoryCode: string;
    
    // Enhanced chapter detection
    const detectedChapter = detectChapter(content);
    console.log(`Detected chapter from content: ${detectedChapter || 'None'}`);
    
    // Determine category based on detected chapter or provided category
    if (detectedChapter === '14A') {
      categoryCode = 'chapter_14a';
      console.log('Using category code: chapter_14a');
    } else if (detectedChapter === '14') {
      categoryCode = 'chapter_14';
      console.log('Using category code: chapter_14');
    } else if (detectedChapter === '13') {
      categoryCode = 'chapter_13';
      console.log('Using category code: chapter_13');
    } else {
      switch (category) {
        case 'listing_rules':
          // Try to determine more specific category
          if (content.includes("Chapter 13") || content.toLowerCase().includes("equity securities")) {
            categoryCode = 'chapter_13';
          } else if (content.includes("Chapter 14A") || content.toLowerCase().includes("connected transactions")) {
            categoryCode = 'chapter_14a';
          } else if (content.includes("Chapter 14") || content.toLowerCase().includes("notifiable transactions")) {
            categoryCode = 'chapter_14';
          } else {
            categoryCode = 'listing_rules';
          }
          break;
        default:
          categoryCode = category;
      }
      console.log(`Using category code: ${categoryCode}`);
    }
    
    // Changed from const to let so it can be reassigned later
    let categoryId = await regulatoryDatabaseService.getCategoryIdByCode(categoryCode);
    
    if (!categoryId) {
      result.errors.push(`Could not find category ID for code: ${categoryCode}`);
      console.error(`Category not found: ${categoryCode}`);
      
      // Create the category if it doesn't exist (for development purposes)
      try {
        const { data, error } = await supabase
          .from('regulatory_categories')
          .insert({
            code: categoryCode,
            name: categoryCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Auto-created category for ${categoryCode}`
          })
          .select('id')
          .single();
          
        if (data && !error) {
          console.log(`Created missing category: ${categoryCode} with ID: ${data.id}`);
          categoryId = data.id;
        } else if (error) {
          console.error('Error creating category:', error);
        }
      } catch (err) {
        console.error('Error creating missing category:', err);
      }
    }
    
    // Parse the content into provisions
    const { provisions, errors } = parseRegulatoryText(content, category, sourceDocumentId);
    result.errors.push(...errors);
    
    if (provisions.length === 0) {
      result.errors.push('No provisions were successfully parsed');
      return result;
    }
    
    console.log(`Parsed ${provisions.length} provisions from content`);
    if (provisions.length > 0) {
      console.log(`First provision: ${provisions[0].rule_number} - ${provisions[0].title}`);
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
    
    // Process definitions - process all provisions
    if (provisions.length > 0 && categoryId) {
      // Get the provisions IDs after insertion
      const insertedProvisions = await regulatoryDatabaseService.getProvisionsBySourceDocument(sourceDocumentId || '');
      
      if (insertedProvisions.length > 0) {
        console.log(`Found ${insertedProvisions.length} inserted provisions to process for definitions`);
        
        for (const provision of insertedProvisions) {
          const definitionsAdded = await processDefinitions(provision, categoryId);
          result.definitionsAdded += definitionsAdded;
        }
      } else {
        console.warn('No inserted provisions found after insertion');
      }
    }
    
    result.success = result.provisionsAdded > 0;
    
    // Show user feedback based on results
    if (result.success) {
      toast({
        title: "Import successful",
        description: `Added ${result.provisionsAdded} provisions and ${result.definitionsAdded} definitions.`,
      });
    }
  } catch (error) {
    const errorMessage = `Unexpected error during import: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(errorMessage);
    console.error(errorMessage);
    
    toast({
      title: "Import error",
      description: errorMessage,
      variant: "destructive"
    });
  }
  
  return result;
};
