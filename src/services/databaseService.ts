
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
      title: "Connected Transactions",
      content: "Chapter 14A of the Hong Kong Listing Rules covers connected transactions. " +
        "A connected transaction is any transaction between a listed issuer or any of its subsidiaries and a connected person. " +
        "Connected transactions are subject to reporting, announcement and independent shareholders' approval requirements.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 14A",
      section: "Chapter 14A",
      lastUpdated: new Date("2023-05-15"),
      status: "active"
    });
    
    databaseService.addSampleEntry({
      title: "Mandatory General Offers",
      content: "Rule 26 of the Takeovers Code requires a mandatory general offer to be made when: " +
        "(a) a person acquires, whether by a series of transactions over a period of time or not, 30% or more of the voting rights of a company; or " +
        "(b) a person holding between 30% and 50% of the voting rights of a company acquires additional voting rights that increase their holding by more than 2% in any 12-month period.",
      category: "takeovers",
      source: "SFC Takeovers Code Rule 26",
      section: "Rule 26",
      lastUpdated: new Date("2023-03-10"),
      status: "active"
    });
    
    // Add detailed information about Rights Issues Timetable
    databaseService.addSampleEntry({
      title: "Rights Issues Timetable",
      content: "According to the HKEX Listing Rules, a typical rights issue timetable includes: " +
        "1. Board meeting to approve rights issue: Day 0 " +
        "2. Publication of announcement: Day 1 " +
        "3. Last day of dealings in shares on cum-rights basis: Day 4 " +
        "4. Ex-date (first day of dealings in shares on ex-rights basis): Day 5 " +
        "5. Latest time for lodging transfers of shares to qualify for rights: Day 6 at 4:30 pm " +
        "6. Register of members closes: Days 7-11 " +
        "7. Record date: Day 11 " +
        "8. Register of members reopens: Day 12 " +
        "9. Despatch of rights issue documents: Day 12 " +
        "10. First day of dealings in nil-paid rights: Day 15 " +
        "11. Last day of dealings in nil-paid rights: Day 21 " +
        "12. Latest time for acceptance of and payment for rights shares: Day 26 at 4:00 pm " +
        "13. Announcement of results of rights issue: Day 28 " +
        "14. Despatch of certificates for fully-paid rights shares: Day 33 " +
        "15. Dealings in fully-paid rights shares commence: Day 35",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 7",
      section: "Chapter 7",
      lastUpdated: new Date("2022-09-20"),
      status: "active"
    });
    
    databaseService.addSampleEntry({
      title: "Rights Issue Requirements",
      content: "Rights issues by Hong Kong listed companies are primarily governed by Chapter 7 of the HKEX Listing Rules. " +
        "Key requirements include: " +
        "1. The rights issue must be made pro rata to existing shareholders. " +
        "2. The subscription period must be at least 10 business days from the dispatch of the rights issue documents. " +
        "3. Rights issues require approval by shareholders unless the new shares being issued are not more than 50% of the existing issued shares. " +
        "4. The issuer must make arrangements to dispose of rights shares not subscribed and the net proceeds exceeding HK$100 must be paid to the original allottees. " +
        "5. The company must issue a prospectus in accordance with the Companies (Winding Up and Miscellaneous Provisions) Ordinance. " +
        "6. For companies with a primary listing on HKEX, the rights shares must be offered for subscription at a price that is at a discount of at least 30% to the benchmarked price.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 7",
      section: "Chapter 7",
      lastUpdated: new Date("2022-09-20"),
      status: "active"
    });
    
    console.log("Added sample regulatory data");
  }
};

// Initialize sample data
initializeSampleData();
