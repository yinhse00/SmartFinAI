
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { importRegulatoryContent } from '@/services/database/importUtils';
import { DocumentCategory } from '@/types/references';
import { determineCategory } from '@/services/database/categoryUtils';
import { toast } from '@/components/ui/use-toast';

/**
 * Enhanced file processing service that uses structured database
 */
export const enhancedFileProcessingService = {
  /**
   * Process files and import regulatory content
   */
  processRegulatoryFiles: async (files: File[], overrideCategory?: DocumentCategory): Promise<{
    success: boolean;
    filesProcessed: number;
    provisionsAdded: number;
    definitionsAdded: number;
    errors: string[];
  }> => {
    const result = {
      success: false,
      filesProcessed: 0,
      provisionsAdded: 0,
      definitionsAdded: 0,
      errors: [] as string[]
    };
    
    if (files.length === 0) {
      result.errors.push('No files provided for processing');
      return result;
    }
    
    try {
      // Process files one by one
      for (const file of files) {
        console.log(`Processing regulatory file: ${file.name}`);
        
        // Determine category from filename or override
        const category = overrideCategory || determineCategory(file.name);
        
        try {
          // Use existing file processing service to extract text
          const processingResult = await fileProcessingService.processFile(file);
          
          if (!processingResult.content) {
            result.errors.push(`Failed to extract content from ${file.name}`);
            continue;
          }

          console.log(`Successfully extracted content from ${file.name}. Processing for import...`);
          
          // Check for chapter indicators in filename
          let detectedCategory = category;
          if (file.name.toLowerCase().includes('chapter 13') || file.name.toLowerCase().includes('ch13') || file.name.includes('13.')) {
            detectedCategory = 'chapter_13';
          } else if (file.name.toLowerCase().includes('chapter 14a') || file.name.toLowerCase().includes('ch14a')) {
            detectedCategory = 'chapter_14a';
          } else if (file.name.toLowerCase().includes('chapter 14') || file.name.toLowerCase().includes('ch14')) {
            detectedCategory = 'chapter_14';
          }
          
          // Import the extracted content into the structured database
          const importResult = await importRegulatoryContent(
            processingResult.content,
            detectedCategory,
            undefined // For now, not linking to source document
          );
          
          if (importResult.success) {
            result.filesProcessed++;
            result.provisionsAdded += importResult.provisionsAdded;
            result.definitionsAdded += importResult.definitionsAdded;
            
            toast({
              title: "File Processed Successfully",
              description: `Added ${importResult.provisionsAdded} provisions from ${file.name}`,
              duration: 3000,
            });
            
            if (importResult.errors.length > 0) {
              result.errors.push(
                `File ${file.name} processed with warnings: ${importResult.errors.join(', ')}`
              );
            }
          } else {
            result.errors.push(
              `Failed to import content from ${file.name}: ${importResult.errors.join(', ')}`
            );

            toast({
              title: "Import Warning",
              description: `Failed to import all content from ${file.name}`,
              variant: "destructive",
              duration: 5000,
            });
          }
        } catch (error) {
          result.errors.push(
            `Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      
      // Mark as successful if at least one file was processed
      result.success = result.filesProcessed > 0;
      
    } catch (error) {
      result.errors.push(
        `Unexpected error during file processing: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    return result;
  }
};
