
import { supabase } from '@/integrations/supabase/client';

// A list of known, valid tables in the database. This acts as an allowlist.
const KNOWN_VALID_TABLES = [
  'listingrule_new_faq',
  'listingrule_listed_faq',
  'listingrule_new_gl',
  'listingrule_new_ld',
  'announcement_pre_vetting_requirements',
  'mb_listingrule_documents',
  'regulatory_categories',
  'regulatory_provisions',
  'rule_keywords',
  'search_index',
];

export interface ValidatedTableInfo {
  previews: Record<string, string>;
  validatedTableNames: string[];
}

/**
 * Service for discovering and validating database tables for search operations.
 */
export const tableDiscoveryService = {
  /**
   * Fetches tables listed in the search_index, validates them against a known list,
   * and returns content previews for the valid tables.
   */
  getValidatedTablesAndPreviews: async (): Promise<ValidatedTableInfo> => {
    console.log('Starting table discovery and validation...');

    const { data, error } = await supabase
      .from('search_index')
      .select('tableindex, particulars')
      .limit(1000);

    if (error) {
      console.error('Error fetching from search_index:', error);
      return { previews: {}, validatedTableNames: [] };
    }

    if (!data) {
      return { previews: {}, validatedTableNames: [] };
    }

    const indexedTables = [...new Set(data.map(i => i.tableindex).filter(Boolean) as string[])];
    const validatedTableNames = new Set<string>();
    const mismatches: { indexed: string; corrected: string | null }[] = [];

    // Validate and correct table names
    indexedTables.forEach(indexedTable => {
      if (KNOWN_VALID_TABLES.includes(indexedTable)) {
        validatedTableNames.add(indexedTable);
      } else {
        // Attempt to correct common mismatches (e.g., singular vs. plural)
        const corrected = KNOWN_VALID_TABLES.find(
          validTable => validTable.startsWith(indexedTable) || indexedTable.startsWith(validTable)
        );
        if (corrected) {
          validatedTableNames.add(corrected);
          mismatches.push({ indexed: indexedTable, corrected });
        } else {
          mismatches.push({ indexed: indexedTable, corrected: null });
        }
      }
    });

    if (mismatches.length > 0) {
      console.warn('Found mismatches between search_index and known tables:', mismatches);
    }
    
    const finalTableList = Array.from(validatedTableNames);
    console.log('Validated tables for search:', finalTableList);

    // Aggregate particulars for valid tables only
    const previews = data.reduce((acc, row) => {
      if (row.tableindex && row.particulars && finalTableList.includes(row.tableindex)) {
        if (!acc[row.tableindex]) {
          acc[row.tableindex] = '';
        }
        if (acc[row.tableindex].length < 1500) { // Increased limit for better context
          acc[row.tableindex] += row.particulars + ' | ';
        }
      }
      return acc;
    }, {} as Record<string, string>);

    console.log(`Generated previews for ${Object.keys(previews).length} valid tables.`);

    return {
      previews,
      validatedTableNames: finalTableList,
    };
  },
};
