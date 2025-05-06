
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
    
    // This is a placeholder for the actual import logic
    // In a real implementation, you would:
    // 1. Parse each file (PDF, Word, etc.)
    // 2. Extract structured data
    // 3. Insert into database
    
    // Create entries for each file
    const newEntries: RegulatoryEntry[] = files.map((file, index) => ({
      id: `imported-${Date.now()}-${index}`,
      title: file.name.replace(/\.\w+$/, ''),
      content: `Content extracted from ${file.name}`,
      category: determineCategory(file.name),
      source: file.name,
      lastUpdated: new Date(),
      status: 'active'
    }));
    
    // Insert entries into Supabase
    for (const entry of newEntries) {
      const { error } = await supabase
        .from('regulatory_provisions')
        .insert({
          id: entry.id,
          rule_number: entry.id,
          title: entry.title,
          content: entry.content,
          category_id: null, // Would need to map category to a proper ID
          last_updated: entry.lastUpdated.toISOString(),
          is_current: entry.status === 'active'
        });
      
      if (error) {
        console.error('Error inserting entry into Supabase:', error);
      }
    }
    
    return newEntries.length;
  },
  
  /**
   * Get all entries in the database
   */
  getAllEntries: async (): Promise<RegulatoryEntry[]> => {
    console.log('Fetching all regulatory entries from Supabase');
    
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select(`
        id,
        rule_number,
        title,
        content,
        chapter,
        section,
        last_updated,
        is_current,
        regulatory_categories(code)
      `)
      .order('rule_number');
      
    if (error) {
      console.error('Error fetching regulatory provisions:', error);
      return [];
    }
    
    // Map the Supabase data structure to our RegulatoryEntry type
    return data.map(item => {
      const categoryCode = item.regulatory_categories?.code || 'other';
      const categoryMapping: Record<string, RegulatoryEntry['category']> = {
        'CH13': 'listing_rules',
        'CH14': 'listing_rules',
        'CH14A': 'listing_rules',
        'TO': 'takeovers'
      };
      
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        category: categoryMapping[categoryCode] || 'other',
        source: item.chapter ? `${item.chapter} ${item.section || ''}` : 'Unknown',
        section: item.section || undefined,
        lastUpdated: new Date(item.last_updated),
        status: item.is_current ? 'active' : 'archived'
      };
    });
  },
  
  /**
   * Get all entries in a specific category
   */
  getEntriesByCategory: async (category: string): Promise<RegulatoryEntry[]> => {
    console.log(`Fetching regulatory entries for category: ${category}`);
    
    // Map our category strings to the database category codes
    const categoryMapping: Record<string, string[]> = {
      'listing_rules': ['CH13', 'CH14', 'CH14A'],
      'takeovers': ['TO'],
      'guidance': ['GN'],
      'decisions': ['LD'],
      'checklists': ['CL'],
      'other': ['OTHER']
    };
    
    const categoryCodes = categoryMapping[category] || ['OTHER'];
    
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select(`
        id,
        rule_number,
        title,
        content,
        chapter,
        section,
        last_updated,
        is_current,
        regulatory_categories(code)
      `)
      .in('regulatory_categories.code', categoryCodes)
      .order('rule_number');
      
    if (error) {
      console.error(`Error fetching regulatory provisions for category ${category}:`, error);
      return [];
    }
    
    // Map the Supabase data structure to our RegulatoryEntry type
    return data.map(item => {
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        category: category as RegulatoryEntry['category'],
        source: item.chapter ? `${item.chapter} ${item.section || ''}` : 'Unknown',
        section: item.section || undefined,
        lastUpdated: new Date(item.last_updated),
        status: item.is_current ? 'active' : 'archived'
      };
    });
  },
  
  /**
   * Get a specific entry by ID
   */
  getEntryById: async (id: string): Promise<RegulatoryEntry | null> => {
    console.log(`Fetching regulatory entry with ID: ${id}`);
    
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .select(`
        id,
        rule_number,
        title,
        content,
        chapter,
        section,
        last_updated,
        is_current,
        regulatory_categories(code)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching regulatory provision with ID ${id}:`, error);
      return null;
    }
    
    const categoryCode = data.regulatory_categories?.code || 'other';
    const categoryMapping: Record<string, RegulatoryEntry['category']> = {
      'CH13': 'listing_rules',
      'CH14': 'listing_rules',
      'CH14A': 'listing_rules',
      'TO': 'takeovers'
    };
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: categoryMapping[categoryCode] || 'other',
      source: data.chapter ? `${data.chapter} ${data.section || ''}` : 'Unknown',
      section: data.section || undefined,
      lastUpdated: new Date(data.last_updated),
      status: data.is_current ? 'active' : 'archived'
    };
  },
  
  /**
   * Add a sample entry (for testing)
   */
  addSampleEntry: async (entry: Omit<RegulatoryEntry, 'id'>): Promise<RegulatoryEntry> => {
    console.log(`Adding sample entry: ${entry.title}`);
    
    // Map our category to the database category codes
    const categoryMapping: Record<RegulatoryEntry['category'], string> = {
      'listing_rules': 'CH14',
      'takeovers': 'TO',
      'guidance': 'GN',
      'decisions': 'LD',
      'checklists': 'CL',
      'other': 'OTHER'
    };
    
    const categoryCode = categoryMapping[entry.category] || 'OTHER';
    
    // Get the category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('regulatory_categories')
      .select('id')
      .eq('code', categoryCode)
      .single();
      
    if (categoryError) {
      console.error(`Error fetching category ID for code ${categoryCode}:`, categoryError);
    }
    
    const categoryId = categoryData?.id;
    
    // Generate a unique ID
    const newId = `entry-${Date.now()}`;
    
    // Insert the entry
    const { data, error } = await supabase
      .from('regulatory_provisions')
      .insert({
        id: newId,
        rule_number: entry.source || newId,
        title: entry.title,
        content: entry.content,
        chapter: entry.source?.split(' ')[0] || null,
        section: entry.section || null,
        category_id: categoryId,
        last_updated: entry.lastUpdated.toISOString(),
        is_current: entry.status === 'active'
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
      title: data.title,
      content: data.content,
      category: entry.category,
      source: data.chapter ? `${data.chapter} ${data.section || ''}` : 'Unknown',
      section: data.section || undefined,
      lastUpdated: new Date(data.last_updated),
      status: data.is_current ? 'active' : 'archived'
    };
  }
};
