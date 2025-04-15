
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
    
    // Add comprehensive information about Rights Issues Timetable
    databaseService.addSampleEntry({
      title: "Rights Issues Timetable",
      content: "According to the HKEX Listing Rules, a comprehensive rights issue timetable includes the following key dates and events:\n\n" +
        "T-30 to T-60 (1–2 months before announcement): Prepare draft prospectus or listing document and related materials. Submit to HKEx for review if required (Rule 14.04). Engage underwriters, if any (Rule 10.24A).\n\n" +
        "T-1 (Day before announcement): Board meeting to approve the rights issue. Underwriting agreement (if applicable) signed and held in escrow. Finalize listing document details.\n\n" +
        "T (Announcement Day): Announce the rights issue via a Regulatory Information Service (RIS) (Rule 10.22). Publish listing document/prospectus (Rule 14.08). If underwritten, disclose underwriter details and compliance with Rule 10.24A. For non-fully underwritten issues, disclose risks on the front cover (Rule 10.23).\n\n" +
        "T+1: Submit application for listing of nil-paid rights and new shares to HKEx (Rule 10.26). HKEx reviews and approves listing.\n\n" +
        "T+2: Record date to determine eligible shareholders. Dispatch Provisional Allotment Letters (PALs) to shareholders (for renounceable issues) (Rule 10.31).\n\n" +
        "T+3: Nil-paid rights trading begins on HKEx (for renounceable issues). Typically lasts 10 business days (market practice).\n\n" +
        "T+12 (10 business days after T+2): Nil-paid rights trading ends. Deadline for shareholders to accept rights and pay for shares (Rule 10.29). Excess application period closes (if applicable, per Rule 10.31(3)).\n\n" +
        "T+13 to T+14: Calculate acceptances and excess applications. Notify underwriters of any shortfall (if underwritten). Underwriters arrange for sale of unsubscribed shares ('rump placement') (Rule 10.31(1)(b)).\n\n" +
        "T+15: Announce results of the rights issue via RIS, including subscription levels and rump placement details (if any) (Rule 10.32).\n\n" +
        "T+16: New shares issued and admitted to trading on HKEx. Dealings in fully-paid shares commence. Refund cheques (if any) dispatched to shareholders for excess applications.\n\n" +
        "T+17 onwards: Finalize accounts with clearing systems (e.g., CCASS). Update share register.\n\n" +
        "Important Notes:\n" +
        "- Underwriting: If underwritten, the underwriter must be licensed under the Securities and Futures Ordinance and independent of the issuer, unless compensatory arrangements are in place for controlling shareholders acting as underwriters (Rule 10.24A, 10.31(2)).\n" +
        "- Compensatory Arrangements: For unsubscribed shares, issuers must adopt excess application or compensatory arrangements (e.g., sale of rump shares), fully disclosed in announcements and listing documents (Rule 10.31(1)).\n" +
        "- Connected Persons: Rights issues to connected persons (e.g., directors, substantial shareholders) are exempt from connected transaction rules if pro-rata to existing shareholdings (Rule 14A.31(3)(a)).\n" +
        "- Timing Adjustments: If a general meeting is required (e.g., no general mandate or pre-emption rights disapplied), add 14–21 days for notice and meeting (Rule 13.36(1)).\n" +
        "- Disclosure: The listing document must include the intended use of proceeds, risks of non-full subscription, and substantial shareholder commitments (Rule 10.23, 10.24).\n\n" +
        "This timetable assumes a renounceable rights issue with no significant regulatory delays. For non-renounceable issues, nil-paid trading steps are omitted, but the acceptance period remains similar.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 10",
      section: "Chapter 10",
      lastUpdated: new Date("2023-09-20"),
      status: "active"
    });
    
    databaseService.addSampleEntry({
      title: "Rights Issue Requirements",
      content: "Rights issues by Hong Kong listed companies are primarily governed by Chapter 10 of the HKEX Listing Rules. " +
        "Key requirements include: " +
        "1. The rights issue must be made pro rata to existing shareholders. " +
        "2. The subscription period must be at least 10 business days from the dispatch of the rights issue documents. " +
        "3. Rights issues require approval by shareholders unless the new shares being issued are not more than 50% of the existing issued shares. " +
        "4. The issuer must make arrangements to dispose of rights shares not subscribed and the net proceeds exceeding HK$100 must be paid to the original allottees. " +
        "5. The company must issue a prospectus in accordance with the Companies (Winding Up and Miscellaneous Provisions) Ordinance. " +
        "6. For companies with a primary listing on HKEX, the rights shares must be offered for subscription at a price that is at a discount of at least 30% to the benchmarked price.",
      category: "listing_rules",
      source: "HKEX Listing Rules Chapter 10",
      section: "Chapter 10",
      lastUpdated: new Date("2022-09-20"),
      status: "active"
    });
    
    console.log("Added sample regulatory data");
  }
};

// Initialize sample data
initializeSampleData();
