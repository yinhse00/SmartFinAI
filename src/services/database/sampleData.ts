
/**
 * Sample data for the regulatory database
 * 
 * Note: This is now only used for manual testing when explicitly called
 * No automatic initialization to prevent hardcoded data contamination
 */

import { RegulatoryEntry } from "./types";
import { databaseService } from "./databaseService";

/**
 * Add initial sample data for development/testing
 * This is ONLY used when manually called - no automatic initialization
 * to prevent hardcoded content from contaminating the authoritative database
 */
export const initializeSampleData = async () => {
  console.log('Manual sample data initialization requested...');
  
  try {
    // First try to get data from Supabase
    const entries = await databaseService.getAllEntries();
    
    // If we have entries from Supabase, respect the existing data
    if (entries.length > 0) {
      console.log(`Found ${entries.length} entries in Supabase - preserving existing authoritative data`);
      console.log('Manual sample data initialization cancelled to maintain database integrity');
      return;
    }
    
    console.log('No data found in Supabase, proceeding with manual sample data initialization...');
    
    // IMPORTANT: Only proceed if explicitly called and Supabase is empty
    // This prevents contamination of authoritative regulatory database content
    
    await databaseService.addSampleEntry({
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
    
    await databaseService.addSampleEntry({
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
    
    console.log('Manual sample regulatory data added to Supabase');
  } catch (error) {
    console.error('Error in manual sample data initialization:', error);
  }
};

