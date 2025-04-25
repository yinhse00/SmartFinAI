
import { RegulatoryEntry } from '../types';
import { SummaryIndexEntry } from '../types/summaryIndex';
import { generateSummaryEntry } from '../utils/summaryEntryGenerator';
import { databaseService } from '../databaseService';

// In-memory database of summary entries for faster lookup
let summaryIndexDatabase: SummaryIndexEntry[] = [];

export const summaryIndexCore = {
  /**
   * Initialize the summary index
   */
  initializeSummaryIndex: async (): Promise<void> => {
    console.log('Initializing Summary and Keyword Index');
    
    // Get all entries from the regulatory database
    const allEntries = databaseService.getAllEntries();
    
    // Generate summary index entries
    summaryIndexDatabase = allEntries.map(entry => generateSummaryEntry(entry));
    
    console.log(`Summary Index initialized with ${summaryIndexDatabase.length} entries`);
  },

  /**
   * Add a new entry to the summary index
   */
  addToSummaryIndex: (entry: RegulatoryEntry): void => {
    const summaryEntry = generateSummaryEntry(entry);
    summaryIndexDatabase.push(summaryEntry);
    console.log(`Added entry "${entry.title}" to Summary Index`);
  },

  /**
   * Get all summary entries
   */
  getAllSummaryEntries: (): SummaryIndexEntry[] => {
    return [...summaryIndexDatabase];
  }
};

