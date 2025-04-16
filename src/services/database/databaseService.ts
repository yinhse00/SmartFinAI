/**
 * This service handles the regulatory database operations
 * In a production environment, this would connect to a proper database
 */

import { RegulatoryEntry } from "./types";
import { determineCategory } from "./categoryUtils";

// Sample in-memory database - in a real app, this would be stored in a proper database
let regulatoryDatabase: RegulatoryEntry[] = [];

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
    
    // Mock implementation - simulate adding entries
    const newEntries: RegulatoryEntry[] = files.map((file, index) => ({
      id: `imported-${Date.now()}-${index}`,
      title: file.name.replace(/\.\w+$/, ''),
      content: `Content extracted from ${file.name}`,
      category: determineCategory(file.name),
      source: file.name,
      lastUpdated: new Date(),
      status: 'active'
    }));
    
    // Add to our in-memory database
    regulatoryDatabase = [...regulatoryDatabase, ...newEntries];
    
    console.log(`Successfully imported ${newEntries.length} entries`);
    return newEntries.length;
  },
  
  /**
   * Get all entries in the database
   */
  getAllEntries: (): RegulatoryEntry[] => {
    return [...regulatoryDatabase];
  },
  
  /**
   * Get all entries in a specific category
   */
  getEntriesByCategory: async (category: string): Promise<RegulatoryEntry[]> => {
    return regulatoryDatabase.filter(entry => entry.category === category);
  },
  
  /**
   * Get a specific entry by ID
   */
  getEntryById: async (id: string): Promise<RegulatoryEntry | null> => {
    const entry = regulatoryDatabase.find(entry => entry.id === id);
    return entry || null;
  },
  
  /**
   * Add a sample entry (for testing)
   */
  addSampleEntry: (entry: Omit<RegulatoryEntry, 'id'>): RegulatoryEntry => {
    const newEntry = {
      ...entry,
      id: `entry-${Date.now()}`
    };
    
    regulatoryDatabase.push(newEntry);
    return newEntry;
  }
};
