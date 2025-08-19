import { searchService } from '../database/searchService';
import { announcementVettingService } from '../vetting/announcementVettingService';
import { supabase } from '@/integrations/supabase/client';

interface TimetableSearchResult {
  timetableData: any[];
  rulesData: any[];
  vettingInfo: any;
  contextData: any[];
}

interface VettingInfo {
  isRequired: boolean;
  vettingDays: number;
  headlineCategory: string;
  exemptions?: string;
  ruleReference?: string;
}

/**
 * Service for parallel timetable-related searches using search_index as the starting point
 */
export const timetableParallelSearchService = {
  /**
   * Execute parallel searches for timetable generation
   */
  searchTimetableDataParallel: async (transactionType: string): Promise<TimetableSearchResult> => {
    const startTime = Date.now();
    
    try {
      // Execute all searches in parallel
      const searchPromises = [
        // 1. Timeline search - query timetable tables via search_index
        searchTimetableContent(transactionType),
        
        // 2. Rules search - find regulatory implications
        searchRulesImplications(transactionType),
        
        // 3. Vetting requirements check
        checkVettingRequirements(transactionType),
        
        // 4. Context search - guidance materials and FAQs
        searchContextualMaterials(transactionType)
      ];
      
      const [timetableData, rulesData, vettingInfo, contextData] = await Promise.all(searchPromises);
      
      const processingTime = Date.now() - startTime;
      console.log(`Timetable parallel search completed in ${processingTime}ms`);
      
      return {
        timetableData: Array.isArray(timetableData) ? timetableData : [],
        rulesData: Array.isArray(rulesData) ? rulesData : [],
        vettingInfo: vettingInfo || { isRequired: false, vettingDays: 0, headlineCategory: transactionType },
        contextData: Array.isArray(contextData) ? contextData : []
      };
      
    } catch (error) {
      console.error('Error in timetable parallel search:', error);
      return {
        timetableData: [],
        rulesData: [],
        vettingInfo: { isRequired: false, vettingDays: 0, headlineCategory: transactionType },
        contextData: []
      };
    }
  }
};

/**
 * Search for timetable content using search_index routing
 */
async function searchTimetableContent(transactionType: string): Promise<any[]> {
  try {
    // First query search_index for timetable-related content
    const { data: searchResults, error } = await supabase
      .from('search_index')
      .select('*')
      .or(`particulars.ilike.%${transactionType}%,particulars.ilike.%timetable%`)
      .ilike('category', '%timetable%')
      .limit(20);
      
    if (error) {
      console.warn('Search index query failed:', error);
      return [];
    }
    
    if (!searchResults || searchResults.length === 0) {
      // Fallback: direct query to timetable table
      const { data: directData, error: directError } = await supabase
        .from('listingrules_listed_timetable')
        .select('*')
        .ilike('particulars', `%${transactionType}%`)
        .limit(10);
        
      return directData || [];
    }
    
    // Use tableindex to route to appropriate tables
    const tableRoutes = [...new Set(searchResults.map(r => r.tableindex).filter(Boolean))];
    const detailedResults = await Promise.all(
      tableRoutes.map(tableName => 
        searchService.fetchDetailedDataFromTable(tableName, searchResults.filter(r => r.tableindex === tableName))
      )
    );
    
    return detailedResults.flat();
    
  } catch (error) {
    console.warn('Timetable content search failed:', error);
    return [];
  }
}

/**
 * Search for rules implications related to the transaction type
 */
async function searchRulesImplications(transactionType: string): Promise<any[]> {
  try {
    // Search for regulatory rules and implications
    const searchResults = await searchService.search(`${transactionType} rules requirements approval`, 'rules');
    
    // Also search for percentage thresholds and shareholder approval rules
    const thresholdResults = await searchService.search(`${transactionType} 25% 50% 75% threshold approval`, 'rules');
    
    return [...searchResults, ...thresholdResults];
    
  } catch (error) {
    console.warn('Rules implications search failed:', error);
    return [];
  }
}

/**
 * Check vetting requirements for the transaction type
 */
async function checkVettingRequirements(transactionType: string): Promise<VettingInfo> {
  try {
    // Use existing vetting service to check requirements
    const vettingInfo = await announcementVettingService.getVettingInfo(transactionType);
    
    // Extract vetting days from the database (default to 5-10 business days if vetting required)
    const vettingDays = vettingInfo.isRequired ? 7 : 0; // Conservative estimate
    
    return {
      isRequired: vettingInfo.isRequired,
      vettingDays,
      headlineCategory: vettingInfo.headlineCategory || transactionType,
      exemptions: vettingInfo.exemptions,
      ruleReference: vettingInfo.ruleReference
    };
    
  } catch (error) {
    console.warn('Vetting requirements check failed:', error);
    return {
      isRequired: false,
      vettingDays: 0,
      headlineCategory: transactionType
    };
  }
}

/**
 * Search for contextual materials (FAQs, guidance documents)
 */
async function searchContextualMaterials(transactionType: string): Promise<any[]> {
  try {
    // Search FAQs and guidance materials
    const faqResults = await searchService.search(`${transactionType} FAQ guidance`, 'faq');
    const guidanceResults = await searchService.search(`${transactionType} listing rules guidance`, 'guidance');
    
    return [...faqResults, ...guidanceResults];
    
  } catch (error) {
    console.warn('Contextual materials search failed:', error);
    return [];
  }
}