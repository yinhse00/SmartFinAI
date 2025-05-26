
import { supabase } from '@/integrations/supabase/client';

export interface VettingRequirement {
  id: string;
  headlineCategory: string;
  isVettingRequired: boolean;
  description?: string;
  exemptions?: string;
  ruleReference?: string;
}

export interface VettingCheck {
  isRequired: boolean;
  headlineCategory?: string;
  description?: string;
  exemptions?: string;
  ruleReference?: string;
  confidence: number;
}

/**
 * Service for checking announcement pre-vetting requirements
 */
export const announcementVettingService = {
  /**
   * Check if vetting is required for a specific headline category
   */
  checkVettingRequired: async (headlineCategory: string): Promise<boolean> => {
    try {
      console.log(`Checking vetting requirement for headline category: ${headlineCategory}`);
      
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('is_vetting_required')
        .ilike('headline_category', `%${headlineCategory}%`)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking vetting requirement:', error);
        return false;
      }
      
      return data?.is_vetting_required || false;
    } catch (error) {
      console.error('Error in checkVettingRequired:', error);
      return false;
    }
  },

  /**
   * Get detailed vetting information for an announcement query
   */
  getVettingInfo: async (query: string): Promise<VettingCheck> => {
    try {
      console.log('Analyzing query for vetting requirements');
      
      // Extract potential headline categories from the query
      const potentialCategories = extractHeadlineCategories(query);
      
      if (potentialCategories.length === 0) {
        return {
          isRequired: false,
          confidence: 0
        };
      }
      
      // Check each potential category
      for (const category of potentialCategories) {
        const { data, error } = await supabase
          .from('announcement_pre_vetting_requirements')
          .select('*')
          .ilike('headline_category', `%${category}%`)
          .limit(1);
        
        if (error) {
          console.error('Error fetching vetting info:', error);
          continue;
        }
        
        if (data && data.length > 0) {
          const requirement = data[0];
          return {
            isRequired: requirement.is_vetting_required,
            headlineCategory: requirement.headline_category,
            description: requirement.description,
            exemptions: requirement.exemptions,
            ruleReference: requirement.rule_reference,
            confidence: calculateConfidence(category, requirement.headline_category)
          };
        }
      }
      
      return {
        isRequired: false,
        confidence: 0
      };
    } catch (error) {
      console.error('Error in getVettingInfo:', error);
      return {
        isRequired: false,
        confidence: 0
      };
    }
  },

  /**
   * Get all vetting requirements
   */
  getVettingRequirements: async (): Promise<VettingRequirement[]> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('*')
        .order('headline_category');
      
      if (error) {
        console.error('Error fetching vetting requirements:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        headlineCategory: item.headline_category,
        isVettingRequired: item.is_vetting_required,
        description: item.description,
        exemptions: item.exemptions,
        ruleReference: item.rule_reference
      }));
    } catch (error) {
      console.error('Error in getVettingRequirements:', error);
      return [];
    }
  },

  /**
   * Get vetting exemptions for a specific category
   */
  getVettingExemptions: async (headlineCategory: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('exemptions')
        .ilike('headline_category', `%${headlineCategory}%`)
        .limit(1)
        .single();
      
      if (error || !data?.exemptions) {
        return [];
      }
      
      // Parse exemptions - assuming they're stored as comma-separated or newline-separated
      return data.exemptions
        .split(/[,\n]/)
        .map(exemption => exemption.trim())
        .filter(exemption => exemption.length > 0);
    } catch (error) {
      console.error('Error fetching vetting exemptions:', error);
      return [];
    }
  }
};

/**
 * Extract potential headline categories from query text
 */
function extractHeadlineCategories(query: string): string[] {
  const categories: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Common announcement categories
  const categoryKeywords = [
    'acquisition', 'disposal', 'merger', 'takeover', 'transaction',
    'rights issue', 'placing', 'subscription', 'share issue',
    'dividend', 'distribution', 'spin-off', 'demerger',
    'change in shareholding', 'discloseable transaction', 'connected transaction',
    'very substantial acquisition', 'very substantial disposal',
    'major transaction', 'notifiable transaction',
    'director appointment', 'director resignation', 'management change',
    'profit warning', 'profit update', 'trading update',
    'suspension', 'resumption', 'delisting',
    'restructuring', 'reorganization', 'scheme of arrangement'
  ];
  
  for (const keyword of categoryKeywords) {
    if (lowerQuery.includes(keyword)) {
      categories.push(keyword);
    }
  }
  
  return categories;
}

/**
 * Calculate confidence score for category matching
 */
function calculateConfidence(queryCategory: string, dbCategory: string): number {
  const query = queryCategory.toLowerCase();
  const db = dbCategory.toLowerCase();
  
  if (query === db) return 1.0;
  if (db.includes(query) || query.includes(db)) return 0.8;
  
  // Simple word overlap calculation
  const queryWords = query.split(' ');
  const dbWords = db.split(' ');
  const commonWords = queryWords.filter(word => dbWords.includes(word));
  
  return commonWords.length / Math.max(queryWords.length, dbWords.length);
}
