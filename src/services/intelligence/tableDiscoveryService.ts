
import { supabase } from '@/integrations/supabase/client';

export interface ValidatedTableInfo {
  previews: Record<string, string>;
  validatedTableNames: string[];
}

/**
 * Service for discovering and validating database tables for search operations.
 */
export const tableDiscoveryService = {
  /**
   * Fetches tables listed in the search_index, validates them against the actual database schema,
   * and returns content previews for the valid tables.
   */
  getValidatedTablesAndPreviews: async (): Promise<ValidatedTableInfo> => {
    console.log('Starting dynamic table discovery and validation...');

    // Step 1: Fetch actual table names from the database schema using the new RPC function.
    const { data: dbTables, error: dbError } = await supabase.rpc('get_public_tables');

    if (dbError) {
      console.error('Error fetching public tables from database schema:', dbError);
      return { previews: {}, validatedTableNames: [] };
    }

    if (!dbTables || dbTables.length === 0) {
      console.warn('No public tables found in the database.');
      return { previews: {}, validatedTableNames: [] };
    }

    const knownValidTables = dbTables.map((t: { table_name: string }) => t.table_name);
    console.log('Dynamically discovered database tables:', knownValidTables);

    // Step 2: Fetch tables listed in the search_index for cross-referencing.
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

    // Step 3: Validate and correct table names from search_index against the dynamic list.
    const indexedTables = [...new Set(data.map(i => i.tableindex).filter(Boolean) as string[])];
    const validatedTableNames = new Set<string>();
    const mismatches: { indexed: string; corrected: string | null }[] = [];

    indexedTables.forEach(indexedTable => {
      if (knownValidTables.includes(indexedTable)) {
        validatedTableNames.add(indexedTable);
      } else {
        // Attempt to correct common mismatches (e.g., singular vs. plural)
        const corrected = knownValidTables.find(
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
        const correctedTable = validatedTableNames.has(row.tableindex) 
          ? row.tableindex 
          : (mismatches.find(m => m.indexed === row.tableindex)?.corrected || row.tableindex);
        
        if (finalTableList.includes(correctedTable)) {
            if (!acc[correctedTable]) {
              acc[correctedTable] = '';
            }
            if (acc[correctedTable].length < 1500) { // Increased limit for better context
              acc[correctedTable] += row.particulars + ' | ';
            }
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
