
/**
 * This service handles the regulatory database operations
 * Connects to Supabase for persistence
 */

import { RegulatoryEntry } from "./types";
import { determineCategory } from "./categoryUtils";
import { supabase } from "@/integrations/supabase/client";

/**
 * Core database service for regulatory information
 */
export const databaseService = {
  /**
   * Import regulatory data from files
   */
  importFromFiles: async (files: File[]): Promise<number> => {
    console.log(`Importing ${files.length} files to regulatory database`);
    
    let successCount = 0;
    const errors: Array<{ file: string, error: string }> = [];
    
    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Extract chapter and section information from filename
        let chapter = '';
        
        // Try to determine chapter from filename
        const chapterMatch = file.name.match(/Chapter\s*(\d+[A-Za-z]?)/i);
        if (chapterMatch) {
          chapter = `Chapter ${chapterMatch[1]}`;
        }
        
        // Extract content from file (this is a placeholder - in production you would parse the actual file)
        const content = await extractFileContent(file);
        
        // Create entries based on content structure
        // This is simplified - in reality, you would parse sections and rules from the content
        const entries = parseContentToEntries(content, chapter, file.name);
        
        // Insert entries into Supabase
        for (const entry of entries) {
          const { error } = await supabase
            .from('listingrule_new_gl')
            .insert({
              reference_no: entry.id,
              title: entry.title,
              particulars: entry.content,
              chapter: chapter,
              mblistingrules_Topics: entry.section,
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('Error inserting entry into Supabase:', error);
            errors.push({ file: file.name, error: error.message });
          } else {
            successCount++;
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing file ${file.name}:`, errorMessage);
        errors.push({ file: file.name, error: errorMessage });
      }
    }
    
    console.log(`Import completed. Successfully imported ${successCount} provisions. Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Import errors:', errors);
    }
    
    return successCount;
  },
  
  /**
   * Get all entries in the database
   */
  getAllEntries: async (): Promise<RegulatoryEntry[]> => {
    console.log('Fetching all regulatory entries from Supabase');
    
    // Use the existing listingrule_new_gl table
    const { data, error } = await supabase
      .from('listingrule_new_gl')
      .select('*')
      .order('reference_no');
      
    if (error) {
      console.error('Error fetching regulatory provisions:', error);
      return [];
    }
    
    // Map the Supabase data structure to our RegulatoryEntry type
    return (data || []).map(item => {
      // Determine category from the chapter or reference number
      let category: RegulatoryEntry['category'] = 'other';
      if (item.chapter?.includes('14')) category = 'listing_rules';
      else if (item.chapter?.includes('13')) category = 'listing_rules';
      else if (item.reference_no?.includes('TO')) category = 'takeovers';
      
      return {
        id: item.id,
        title: item.title || '',
        content: item.particulars || '',
        category: category,
        source: item.chapter ? `${item.chapter}` : 'Unknown',
        section: item.reference_no || undefined,
        lastUpdated: new Date(item.created_at),
        status: 'active'
      };
    });
  },
  
  /**
   * Get all entries in a specific category
   */
  getEntriesByCategory: async (category: string): Promise<RegulatoryEntry[]> => {
    console.log(`Fetching regulatory entries for category: ${category}`);
    
    // Get all entries and filter by category
    const allEntries = await databaseService.getAllEntries();
    return allEntries.filter(entry => entry.category === category);
  },
  
  /**
   * Get a specific entry by ID
   */
  getEntryById: async (id: string): Promise<RegulatoryEntry | null> => {
    console.log(`Fetching regulatory entry with ID: ${id}`);
    
    const { data, error } = await supabase
      .from('listingrule_new_gl')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching regulatory provision with ID ${id}:`, error);
      return null;
    }
    
    // Determine category from the chapter or reference number
    let category: RegulatoryEntry['category'] = 'other';
    if (data.chapter?.includes('14')) category = 'listing_rules';
    else if (data.chapter?.includes('13')) category = 'listing_rules';
    else if (data.reference_no?.includes('TO')) category = 'takeovers';
    
    return {
      id: data.id,
      title: data.title || '',
      content: data.particulars || '',
      category: category,
      source: data.chapter ? `${data.chapter}` : 'Unknown',
      section: data.reference_no || undefined,
      lastUpdated: new Date(data.created_at),
      status: 'active'
    };
  },
  
  /**
   * Add a sample entry (for testing)
   */
  addSampleEntry: async (entry: Omit<RegulatoryEntry, 'id'>): Promise<RegulatoryEntry> => {
    console.log(`Adding sample entry: ${entry.title}`);
    
    // Generate a unique ID
    const newId = `entry-${Date.now()}`;
    
    // Insert the entry
    const { data, error } = await supabase
      .from('listingrule_new_gl')
      .insert({
        reference_no: entry.source || newId,
        title: entry.title,
        particulars: entry.content,
        chapter: entry.source?.split(' ')[0] || null,
        mblistingrules_Topics: entry.section || null,
        created_at: entry.lastUpdated.toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding sample entry to Supabase:', error);
      // Return a mock entry if insertion fails
      return {
        ...entry,
        id: newId
      };
    }
    
    return {
      id: data.id,
      title: data.title || '',
      content: data.particulars || '',
      category: entry.category,
      source: data.chapter ? `${data.chapter}` : 'Unknown',
      section: entry.section || undefined,
      lastUpdated: new Date(data.created_at),
      status: 'active'
    };
  },
  
  /**
   * Add a new regulatory provision directly
   */
  addProvision: async (provision: {
    ruleNumber: string;
    title: string;
    content: string;
    chapter?: string;
    section?: string;
  }): Promise<string | null> => {
    console.log(`Adding new provision: ${provision.ruleNumber}`);
    
    try {
      const { data, error } = await supabase
        .from('listingrule_new_gl')
        .insert({
          reference_no: provision.ruleNumber,
          title: provision.title,
          particulars: provision.content,
          chapter: provision.chapter,
          mblistingrules_Topics: provision.section,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error adding provision:', error);
        return null;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error in addProvision:', err);
      return null;
    }
  },
  
  /**
   * Update an existing regulatory provision
   */
  updateProvision: async (
    id: string,
    updates: Partial<{
      ruleNumber: string;
      title: string;
      content: string;
      chapter: string;
      section: string;
      isCurrent: boolean;
    }>
  ): Promise<boolean> => {
    console.log(`Updating provision with ID: ${id}`);
    
    try {
      const updateData: any = {};
      
      if (updates.ruleNumber) updateData.rule_number = updates.ruleNumber;
      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.chapter) updateData.chapter = updates.chapter;
      if (updates.section) updateData.section = updates.section;
      if (updates.isCurrent !== undefined) updateData.is_current = updates.isCurrent;
      
      updateData.last_updated = new Date().toISOString();
      
      const { error } = await supabase
        .from('listingrule_new_gl')
        .update({
          reference_no: updates.ruleNumber,
          title: updates.title,
          particulars: updates.content,
          chapter: updates.chapter,
          mblistingrules_Topics: updates.section
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating provision:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in updateProvision:', err);
      return false;
    }
  },
  
  /**
   * Delete a regulatory provision
   */
  deleteProvision: async (id: string): Promise<boolean> => {
    console.log(`Deleting provision with ID: ${id}`);
    
    const { error } = await supabase
      .from('listingrule_new_gl')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting provision:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Bulk import regulatory provisions
   */
  bulkImportProvisions: async (provisions: Array<{
    ruleNumber: string;
    title: string;
    content: string;
    chapter?: string;
    section?: string;
  }>): Promise<{ success: number, failed: number }> => {
    console.log(`Bulk importing ${provisions.length} provisions`);
    
    let success = 0;
    let failed = 0;
    
    // Process in batches to avoid timeouts and rate limits
    const batchSize = 20;
    const batches = Math.ceil(provisions.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = provisions.slice(i * batchSize, (i + 1) * batchSize);
      console.log(`Processing batch ${i + 1} of ${batches}`);
      
      const supabaseRows = batch.map(provision => ({
        reference_no: provision.ruleNumber,
        title: provision.title,
        particulars: provision.content,
        chapter: provision.chapter,
        mblistingrules_Topics: provision.section,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('listingrule_new_gl')
        .insert(supabaseRows);
        
      if (error) {
        console.error('Error in bulk insert:', error);
        failed += batch.length;
      } else {
        success += batch.length;
      }
    }
    
    console.log(`Bulk import complete: ${success} successful, ${failed} failed`);
    return { success, failed };
  }
};

/**
 * Helper function to extract content from a file
 * In a production system, this would parse different file types (PDF, Word, etc.)
 */
async function extractFileContent(file: File): Promise<string> {
  // Placeholder implementation - in production, use proper file parsing libraries
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        resolve(content);
      } catch (err) {
        reject(new Error(`Failed to parse file ${file.name}: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Parse file content into structured regulatory entries
 */
function parseContentToEntries(
  content: string,
  chapter: string,
  source: string
): Array<{
  id: string;
  title: string;
  content: string;
  section?: string;
}> {
  // This is a simplified parser - in production you would implement a more sophisticated parser
  const entries: Array<{ id: string; title: string; content: string; section?: string }> = [];
  
  // Split content by rule patterns (this is a simplified example)
  // In a real implementation, you would have a more sophisticated parser
  const ruleSections = content.split(/(\d+\.\d+)\s+/);
  
  for (let i = 1; i < ruleSections.length; i += 2) {
    if (i + 1 < ruleSections.length) {
      const ruleNumber = ruleSections[i].trim();
      const ruleContent = ruleSections[i + 1].trim();
      
      // Extract first line as title (simplified)
      const lines = ruleContent.split('\n');
      const title = lines[0].trim();
      const contentText = lines.slice(1).join('\n').trim();
      
      entries.push({
        id: `${chapter} ${ruleNumber}`,
        title: title || `Rule ${ruleNumber}`,
        content: contentText || ruleContent,
        section: ruleNumber
      });
    }
  }
  
  // If parsing fails or no rules found, create a single entry for the whole file
  if (entries.length === 0) {
    entries.push({
      id: chapter ? `${chapter}-${Date.now()}` : `doc-${Date.now()}`,
      title: source.replace(/\.\w+$/, ''),
      content: content
    });
  }
  
  return entries;
}
