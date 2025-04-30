
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { importRegulatoryContent } from '@/services/database/import/importService';
import { DocumentCategory } from '@/types/references';
import { determineCategory } from '@/services/database/categoryUtils';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

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
        console.log(`Using category: ${category} for file: ${file.name}`);
        
        try {
          // Use existing file processing service to extract text
          const processingResult = await fileProcessingService.processFile(file);
          
          if (!processingResult.content || processingResult.content.trim().length === 0) {
            const errorMsg = `Failed to extract content from ${file.name}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
            
            toast({
              title: "File processing failed",
              description: errorMsg,
              variant: "destructive"
            });
            continue;
          }

          console.log(`Successfully extracted content from ${file.name} (${processingResult.content.length} chars). Processing for import...`);
          
          // Generate a unique sourceDocumentId for this file
          // We can now safely pass this as null since we updated the database
          // to make the foreign key constraint optional
          const sourceDocumentId = null;
          
          // Import the extracted content into the structured database
          const importResult = await importRegulatoryContent(
            processingResult.content,
            category,
            sourceDocumentId
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
            const errorMsg = `Failed to import content from ${file.name}: ${importResult.errors.join(', ')}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);

            toast({
              title: "Import Warning",
              description: `Failed to import all content from ${file.name}. ${importResult.errors[0] || ''}`,
              variant: "destructive",
              duration: 5000,
            });
          }
        } catch (error) {
          const errorMsg = `Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
          
          toast({
            title: "Processing Error",
            description: `Error processing ${file.name}`,
            variant: "destructive",
          });
        }
      }
      
      // Mark as successful if at least one file was processed
      result.success = result.filesProcessed > 0;
      
      if (result.success) {
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${result.filesProcessed} file(s), added ${result.provisionsAdded} provisions.`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: "No files were successfully processed.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      const errorMsg = `Unexpected error during file processing: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
      
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred during processing.",
        variant: "destructive",
      });
    }
    
    return result;
  }
};
