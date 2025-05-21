
import { supabase } from '@/integrations/supabase/client';
import { spreadsheetProcessor } from '../documents/processors/spreadsheetProcessor';
import { toast } from '@/components/ui/use-toast';

/**
 * Service for processing mapping Excel files and storing them in Supabase
 */
export const mappingExcelProcessor = {
  /**
   * Process a mapping Excel file and store it in the database
   * @param file The Excel file to process
   * @returns Information about the processed document
   */
  async processExcelFile(file: File): Promise<{
    success: boolean;
    documentId?: string;
    error?: string;
  }> {
    try {
      console.log(`Processing mapping file: ${file.name}`);
      
      // 1. Extract text from Excel file using spreadsheetProcessor
      const { content, metadata } = await spreadsheetProcessor.extractExcelText(file, true);
      
      if (!content || content.trim() === '') {
        return {
          success: false,
          error: 'Failed to extract content from Excel file'
        };
      }

      console.log(`Successfully extracted content from ${file.name}, content length: ${content.length} chars`);
      console.log('Metadata:', metadata);
      
      // 2. Determine if this is a listing applicant guide or listed issuer guide
      const isListingGuide = file.name.toLowerCase().includes('guide for new listing applicants');
      const fileCategory = isListingGuide ? 'guidance' : 'other';
      
      // 3. Check if a document with this name already exists
      const { data: existingDocs, error: queryError } = await supabase
        .from('reference_documents')
        .select('id, title')
        .ilike('title', `%${file.name.substring(0, 40)}%`)
        .limit(1);
      
      if (queryError) {
        console.error('Error checking for existing document:', queryError);
        return {
          success: false,
          error: `Database error: ${queryError.message}`
        };
      }
      
      let documentId: string;
      
      if (existingDocs && existingDocs.length > 0) {
        // Update existing document
        documentId = existingDocs[0].id;
        
        const { error: updateError } = await supabase
          .from('reference_documents')
          .update({
            content,
            metadata,
            file_url: URL.createObjectURL(file), // Create temporary URL for the file
            file_size: file.size,
            file_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
          .eq('id', documentId);
        
        if (updateError) {
          console.error('Error updating document:', updateError);
          return {
            success: false,
            error: `Failed to update document: ${updateError.message}`
          };
        }
        
        console.log(`Updated existing document with ID: ${documentId}`);
      } else {
        // Create new document entry
        const { data: newDoc, error: insertError } = await supabase
          .from('reference_documents')
          .insert({
            title: file.name,
            description: isListingGuide 
              ? 'Mapping Schedule for New Listing Applicants' 
              : 'Mapping Schedule for Listed Issuers',
            category: fileCategory,
            file_path: file.name,
            file_url: URL.createObjectURL(file), // Create temporary URL for the file
            file_size: file.size,
            file_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            content,
            metadata
          })
          .select('id')
          .single();
        
        if (insertError || !newDoc) {
          console.error('Error inserting document:', insertError);
          return {
            success: false,
            error: `Failed to store document: ${insertError?.message || 'Unknown error'}`
          };
        }
        
        documentId = newDoc.id;
        console.log(`Created new document with ID: ${documentId}`);
      }
      
      // 4. Extract structured data from the content if needed
      if (isListingGuide) {
        await this.extractStructuredGuidance(content, documentId);
      }
      
      return {
        success: true,
        documentId
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing Excel file'
      };
    }
  },
  
  /**
   * Extract structured guidance from the raw content
   * @param content The raw content from the Excel file
   * @param sourceDocumentId The ID of the source document
   */
  async extractStructuredGuidance(content: string, sourceDocumentId: string): Promise<void> {
    try {
      // Split content by sections if possible
      const sections = content.split(/## SECTION:|## SHEET:/g).filter(s => s.trim() !== '');
      
      // If we couldn't identify clear sections, don't try to parse further
      if (sections.length <= 1) {
        console.log('No clear sections found in the content, skipping structured extraction');
        return;
      }
      
      console.log(`Found ${sections.length} sections in the mapping document`);
      
      // Process each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        
        // Skip if section is too short
        if (section.length < 50) continue;
        
        // Try to extract section title
        const titleMatch = section.match(/^([^\n]+)/);
        const title = titleMatch ? titleMatch[1].trim() : `Section ${i+1}`;
        
        // Extract rule references
        const ruleMatches = section.match(/Rule\s+(\d+\.\d+(\.\d+)*)/gi) || [];
        const rules = ruleMatches.map(match => match.replace(/Rule\s+/i, '').trim());
        
        // Create an entry in regulatory_provisions
        if (title && section) {
          const { error } = await supabase
            .from('regulatory_provisions')
            .insert({
              title: title.substring(0, 255), // Limit title length
              content: section,
              rule_number: rules.length > 0 ? rules[0] : 'N/A',
              chapter: 'Mapping Schedule',
              section: 'New Listing Applicant Guidance',
              source_document_id: sourceDocumentId,
              search_priority: 3 // Medium-high priority
            });
          
          if (error) {
            console.error(`Error creating regulatory provision for section ${title}:`, error);
          } else {
            console.log(`Created regulatory provision for section: ${title}`);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting structured guidance:', error);
    }
  }
};
