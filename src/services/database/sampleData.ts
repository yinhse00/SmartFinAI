
/**
 * Sample regulatory data for testing and development
 * This file provides fallback data when the database is not populated
 */

import { RegulatoryEntry } from './types';

export const sampleRegulatoryData: RegulatoryEntry[] = [
  {
    id: 'rule-8.05',
    title: 'Rule 8.05 - Qualifications for Listing',
    content: `Rule 8.05 of the HKEX Listing Rules sets out the basic financial eligibility requirements for new listing applicants. New applicants must meet one of the following three tests:

1. Profit Test: The applicant must have a trading record of at least three financial years with:
   (a) Profits attributable to shareholders of at least HK$35 million in the most recent year; and
   (b) Aggregate profits attributable to shareholders of at least HK$45 million in the two preceding years; and
   (c) Management continuity for at least the three preceding financial years; and
   (d) Ownership continuity and control for at least the most recent audited financial year.

2. Market Capitalization/Revenue/Cash Flow Test: The applicant must have:
   (a) Market capitalization of at least HK$2 billion at the time of listing; and
   (b) Revenue of at least HK$500 million for the most recent audited financial year; and
   (c) Positive cash flow from operating activities of at least HK$100 million in aggregate for the three preceding financial years; and
   (d) Management continuity for at least the three preceding financial years; and
   (e) Ownership continuity and control for at least the most recent audited financial year.

3. Market Capitalization/Revenue Test: The applicant must have:
   (a) Market capitalization of at least HK$4 billion at the time of listing; and
   (b) Revenue of at least HK$500 million for the most recent audited financial year; and
   (c) Management continuity for at least the three preceding financial years; and
   (d) Ownership continuity and control for at least the most recent audited financial year.

Note: These financial tests are subject to exceptions and modifications for specific industries or circumstances. The Exchange may accept a shorter trading record period and/or vary or waive the financial standards requirement in certain cases as specified in Rule 8.05A, 8.05B and 8.05C.`,
    category: 'listing_rules',
    source: 'Chapter 8 Rule 8.05',
    section: 'Rule 8.05',
    lastUpdated: new Date(),
    status: 'active'
  },
  {
    id: 'rule-14a.31',
    title: 'Connected Transactions',
    content: `Chapter 14A of the Hong Kong Listing Rules covers connected transactions. A connected transaction is any transaction between a listed issuer or any of its subsidiaries and a connected person. Connected transactions are subject to reporting, announcement and independent shareholders' approval requirements.`,
    category: 'listing_rules',
    source: 'Chapter 14A Rule 14A.31',
    section: 'Rule 14A.31',
    lastUpdated: new Date(),
    status: 'active'
  },
  {
    id: 'takeovers-rule-26',
    title: 'Mandatory General Offers',
    content: `Rule 26 of the Takeovers Code requires a mandatory general offer to be made when: (a) a person acquires, whether by a series of transactions over a period of time or not, 30% or more of the voting rights of a company; or (b) a person holding between 30% and 50% of the voting rights of a company acquires additional voting rights that increase their holding by more than 2% in any 12-month period.`,
    category: 'takeovers',
    source: 'Takeovers Code Rule 26',
    section: 'Rule 26',
    lastUpdated: new Date(),
    status: 'active'
  },
  {
    id: 'chapter-10-rights-issues',
    title: 'Rights Issues Requirements',
    content: `Rights issues by Hong Kong listed companies are primarily governed by Chapter 10 of the HKEX Listing Rules. Key requirements include: 1. The rights issue must be made pro rata to existing shareholders. 2. The subscription period must be at least 10 business days from the dispatch of the rights issue documents. 3. Rights issues require approval by shareholders unless the new shares being issued are not more than 50% of the existing issued shares. 4. The issuer must make arrangements to dispose of rights shares not subscribed and the net proceeds exceeding HK$100 must be paid to the original allottees. 5. The company must issue a prospectus in accordance with the Companies (Winding Up and Miscellaneous Provisions) Ordinance. 6. For companies with a primary listing on HKEX, the rights shares must be offered for subscription at a price that is at a discount of at least 30% to the benchmarked price.`,
    category: 'listing_rules',
    source: 'Chapter 10',
    section: 'Chapter 10',
    lastUpdated: new Date(),
    status: 'active'
  }
];

/**
 * Initialize sample data in the database if it's empty
 */
export const initializeSampleData = async () => {
  try {
    // Import the database service
    const { databaseService } = await import('./databaseService');
    
    // Check if database already has data
    const existingEntries = await databaseService.getAllEntries();
    
    if (existingEntries.length === 0) {
      console.log('Database is empty, initializing with sample data...');
      
      // Add sample entries
      for (const entry of sampleRegulatoryData) {
        try {
          await databaseService.addSampleEntry(entry);
          console.log(`Added sample entry: ${entry.title}`);
        } catch (error) {
          console.warn(`Failed to add sample entry ${entry.title}:`, error);
        }
      }
      
      console.log('Sample data initialization completed');
    } else {
      console.log(`Database already contains ${existingEntries.length} entries, skipping sample data initialization`);
    }
  } catch (error) {
    console.error('Error during sample data initialization:', error);
  }
};
