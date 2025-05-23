
import { supabase } from "@/integrations/supabase/client";
import { spreadsheetProcessor } from "@/services/documents/processors/spreadsheetProcessor";
import { toast } from "@/components/ui/use-toast";

export interface VettingRequirement {
  headlineCategory: string;
  isVettingRequired: boolean;
  description?: string;
  exemptions?: string;
  ruleReference?: string;
  priority?: number;
}

/**
 * Service for managing announcement vetting requirements
 */
export const announcementVettingService = {
  /**
   * Fetch vetting requirements from the database
   */
  getVettingRequirements: async (): Promise<VettingRequirement[]> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('*')
        .order('headline_category', { ascending: true });
      
      if (error) {
        console.error('Error fetching vetting requirements:', error);
        return [];
      }
      
      return data.map(item => ({
        headlineCategory: item.headline_category,
        isVettingRequired: item.is_vetting_required,
        description: item.description || undefined,
        exemptions: item.exemptions || undefined,
        ruleReference: item.rule_reference || undefined,
        priority: item.priority || undefined
      }));
    } catch (error) {
      console.error('Failed to fetch vetting requirements:', error);
      return [];
    }
  },
  
  /**
   * Check if a specific headline category requires vetting
   */
  checkVettingRequired: async (headlineCategory: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('is_vetting_required')
        .eq('headline_category', headlineCategory)
        .single();
      
      if (error) {
        console.error(`Error checking vetting requirement for ${headlineCategory}:`, error);
        // Default to requiring vetting if we can't determine
        return true;
      }
      
      return data.is_vetting_required;
    } catch (error) {
      console.error(`Failed to check vetting for ${headlineCategory}:`, error);
      // Default to requiring vetting if we can't determine
      return true;
    }
  },
  
  /**
   * Get vetting exemptions for a headline category
   */
  getVettingExemptions: async (headlineCategory: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('exemptions')
        .eq('headline_category', headlineCategory)
        .single();
      
      if (error || !data) {
        console.error(`Error fetching exemptions for ${headlineCategory}:`, error);
        return undefined;
      }
      
      return data.exemptions || undefined;
    } catch (error) {
      console.error(`Failed to get exemptions for ${headlineCategory}:`, error);
      return undefined;
    }
  },
  
  /**
   * Get all headline categories
   */
  getHeadlineCategories: async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('headline_category')
        .order('headline_category', { ascending: true });
      
      if (error) {
        console.error('Error fetching headline categories:', error);
        return [];
      }
      
      return data.map(item => item.headline_category);
    } catch (error) {
      console.error('Failed to fetch headline categories:', error);
      return [];
    }
  },
  
  /**
   * Parse and update vetting requirements from an Excel file
   */
  parseAndUpdateVettingRequirements: async (fileId: string): Promise<boolean> => {
    try {
      // Get the file data
      const { data: fileData, error: fileError } = await supabase
        .from('reference_documents')
        .select('*')
        .eq('id', fileId)
        .single();
      
      if (fileError || !fileData) {
        console.error('Error getting file data:', fileError);
        return false;
      }
      
      // Download the file
      const { data: fileBlob, error: downloadError } = await supabase
        .storage
        .from('references')
        .download(fileData.file_path);
      
      if (downloadError || !fileBlob) {
        console.error('Error downloading file:', downloadError);
        return false;
      }
      
      // Convert blob to file
      const file = new File([fileBlob], fileData.title, { type: fileData.file_type || 'application/vnd.ms-excel' });
      
      // Use the spreadsheet processor to extract content
      const { content } = await spreadsheetProcessor.extractExcelText(file, true);
      
      // Parse the content
      const requirements = announcementVettingService.parseVettingRequirementsFromContent(content);
      
      if (requirements.length === 0) {
        console.error('No vetting requirements extracted from file');
        return false;
      }
      
      // Update the database with extracted requirements
      return await announcementVettingService.saveVettingRequirements(requirements);
    } catch (error) {
      console.error('Error parsing vetting requirements:', error);
      return false;
    }
  },
  
  /**
   * Parse vetting requirements from Excel content
   */
  parseVettingRequirementsFromContent: (content: string): VettingRequirement[] => {
    try {
      const requirements: VettingRequirement[] = [];
      
      // Split content by lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Find the header line index
      let headerIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('headline category') && 
            line.includes('pre-vetting requirement') && 
            (line.includes('yes/no') || line.includes('y/n'))) {
          headerIndex = i;
          break;
        }
      }
      
      if (headerIndex === -1) {
        console.warn('Could not find header row in Excel content');
        return [];
      }
      
      // Process data rows
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split('\t');
        if (columns.length < 2) continue;
        
        const headlineCategory = columns[0].trim();
        if (!headlineCategory) continue;
        
        // Check for vetting requirement (yes/no)
        const vettingRequiredText = columns[1].trim().toLowerCase();
        const isVettingRequired = vettingRequiredText.includes('yes') || vettingRequiredText === 'y';
        
        // Extract additional information if available
        const ruleReference = columns.length > 2 ? columns[2]?.trim() : undefined;
        const exemptions = columns.length > 3 ? columns[3]?.trim() : undefined;
        const description = columns.length > 4 ? columns[4]?.trim() : undefined;
        
        requirements.push({
          headlineCategory,
          isVettingRequired,
          ruleReference: ruleReference || undefined,
          exemptions: exemptions || undefined,
          description: description || undefined
        });
      }
      
      return requirements;
    } catch (error) {
      console.error('Error parsing vetting content:', error);
      return [];
    }
  },
  
  /**
   * Save vetting requirements to the database
   */
  saveVettingRequirements: async (requirements: VettingRequirement[]): Promise<boolean> => {
    try {
      if (requirements.length === 0) {
        console.warn('No requirements to save');
        return false;
      }
      
      // Convert requirements to database format
      const dbRecords = requirements.map(req => ({
        headline_category: req.headlineCategory,
        is_vetting_required: req.isVettingRequired,
        rule_reference: req.ruleReference,
        exemptions: req.exemptions,
        description: req.description,
        priority: req.priority || null
      }));
      
      // Upsert records (update if exists, insert if not)
      const { error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .upsert(dbRecords, {
          onConflict: 'headline_category',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error updating vetting requirements:', error);
        return false;
      }
      
      console.log(`Successfully updated ${requirements.length} vetting requirements`);
      return true;
    } catch (error) {
      console.error('Failed to save vetting requirements:', error);
      return false;
    }
  }
};
