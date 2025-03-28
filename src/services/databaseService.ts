
// This service handles the regulatory database operations
// In a production environment, this would connect to a proper database
// For now, we'll create a structured in-memory database that can be populated from files

export interface RegulatoryEntry {
  id: string;
  title: string;
  content: string;
  category: 'listing_rules' | 'takeovers' | 'guidance' | 'precedents' | 'other';
  source: string;
  section?: string;
  lastUpdated: Date;
  status: 'active' | 'under_review' | 'archived';
}

// Sample in-memory database - in a real app, this would be stored in a proper database
let regulatoryDatabase: RegulatoryEntry[] = [];

export const databaseService = {
  /**
   * Import regulatory data from files
   * This would normally involve file parsing and DB insertion
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
   * Search the regulatory database
   */
  search: async (query: string, category?: string): Promise<RegulatoryEntry[]> => {
    console.log(`Searching for "${query}" in category: ${category || 'all'}`);
    
    // Filter by search term and optional category
    const results = regulatoryDatabase.filter(entry => {
      const matchesQuery = entry.title.toLowerCase().includes(query.toLowerCase()) || 
                          entry.content.toLowerCase().includes(query.toLowerCase());
      
      if (!matchesQuery) return false;
      
      // If category is specified, filter by it
      if (category && entry.category !== category) {
        return false;
      }
      
      return true;
    });
    
    return results;
  },
  
  /**
   * Get all entries in the database
   */
  getAllEntries: async (): Promise<RegulatoryEntry[]> => {
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

// Helper function to determine category from filename
function determineCategory(filename: string): RegulatoryEntry['category'] {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('listing') || lowerFilename.includes('listing rules')) {
    return 'listing_rules';
  }
  
  if (lowerFilename.includes('takeover') || lowerFilename.includes('takeovers')) {
    return 'takeovers';
  }
  
  if (lowerFilename.includes('guidance') || lowerFilename.includes('note')) {
    return 'guidance';
  }
  
  if (lowerFilename.includes('precedent') || lowerFilename.includes('case')) {
    return 'precedents';
  }
  
  return 'other';
}

// Add some sample data for development/testing
// In a real application, this would be loaded from actual files
export const initializeSampleData = () => {
  // Only add sample data if the database is empty
  if (regulatoryDatabase.length === 0) {
    databaseService.addSampleEntry({
      title: 'Connected Transactions',
      content: 'Chapter 14A of the Hong Kong Listing Rules covers connected transactions. ' +
        'A connected transaction is any transaction between a listed issuer or any of its subsidiaries and a connected person. ' +
        'Connected transactions are subject to reporting, announcement and independent shareholders' approval requirements.',
      category: 'listing_rules',
      source: 'HKEX Listing Rules Chapter 14A',
      section: 'Chapter 14A',
      lastUpdated: new Date('2023-05-15'),
      status: 'active'
    });
    
    databaseService.addSampleEntry({
      title: 'Mandatory General Offers',
      content: 'Rule 26 of the Takeovers Code requires a mandatory general offer to be made when: ' +
        '(a) a person acquires, whether by a series of transactions over a period of time or not, 30% or more of the voting rights of a company; or ' +
        '(b) a person holding between 30% and 50% of the voting rights of a company acquires additional voting rights that increase their holding by more than 2% in any 12-month period.',
      category: 'takeovers',
      source: 'SFC Takeovers Code Rule 26',
      section: 'Rule 26',
      lastUpdated: new Date('2023-03-10'),
      status: 'active'
    });
    
    console.log('Added sample regulatory data');
  }
};

// Initialize sample data
initializeSampleData();
