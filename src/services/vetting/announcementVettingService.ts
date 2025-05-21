
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface AnnouncementVettingRequirement {
  id: string;
  headline_category: string;
  description: string | null;
  is_vetting_required: boolean;
  priority: number | null;
  rule_reference: string | null;
  exemptions: string | null;
}

/**
 * Service for checking and managing announcement vetting requirements
 */
export const announcementVettingService = {
  /**
   * Check if a headline category requires vetting
   */
  async checkVettingRequired(headlineCategory: string): Promise<{
    required: boolean;
    requirement?: AnnouncementVettingRequirement;
    error?: string;
  }> {
    try {
      console.log(`Checking vetting requirements for: ${headlineCategory}`);
      
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('*')
        .eq('headline_category', headlineCategory)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          console.log(`No specific vetting requirement found for: ${headlineCategory}`);
          return { 
            required: true, // Default to requiring vetting if no specific rule found
            error: `No specific vetting rule found for "${headlineCategory}". Defaulting to require vetting.` 
          };
        }
        
        console.error('Error checking vetting requirements:', error);
        return { 
          required: true, // Default to requiring vetting in case of errors
          error: `Error checking vetting requirements: ${error.message}` 
        };
      }
      
      return {
        required: data.is_vetting_required,
        requirement: data as AnnouncementVettingRequirement
      };
    } catch (err) {
      console.error('Unexpected error in checkVettingRequired:', err);
      return {
        required: true, // Default to requiring vetting
        error: `Unexpected error checking vetting requirements`
      };
    }
  },
  
  /**
   * Get all headline categories with their vetting requirements
   */
  async getAllVettingRequirements(): Promise<{
    data: AnnouncementVettingRequirement[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('*')
        .order('priority', { ascending: true });
      
      if (error) {
        console.error('Error fetching vetting requirements:', error);
        return { 
          data: [],
          error: `Error fetching vetting requirements: ${error.message}` 
        };
      }
      
      return {
        data: data as AnnouncementVettingRequirement[]
      };
    } catch (err) {
      console.error('Unexpected error in getAllVettingRequirements:', err);
      return {
        data: [],
        error: `Unexpected error fetching vetting requirements`
      };
    }
  },
  
  /**
   * Submit an announcement for vetting
   */
  async submitForVetting(announcement: {
    title: string;
    headlineCategory: string;
  }): Promise<{
    success: boolean;
    message: string;
    status?: string;
  }> {
    try {
      // First check if vetting is required
      const { required, error: checkError } = await this.checkVettingRequired(announcement.headlineCategory);
      
      if (checkError) {
        console.warn('Warning during vetting check:', checkError);
      }
      
      // Create a vetting record
      const { data, error } = await supabase
        .from('announcement_vetting_status')
        .insert({
          announcement_title: announcement.title,
          headline_category: announcement.headlineCategory,
          is_vetting_required: required,
          status: 'pending'
        })
        .select('id, status')
        .single();
      
      if (error) {
        console.error('Error submitting for vetting:', error);
        return {
          success: false,
          message: `Failed to submit for vetting: ${error.message}`
        };
      }
      
      return {
        success: true,
        message: required 
          ? `Announcement "${announcement.title}" has been submitted for vetting` 
          : `Announcement "${announcement.title}" does not require vetting but has been recorded`,
        status: data.status
      };
    } catch (err) {
      console.error('Unexpected error in submitForVetting:', err);
      return {
        success: false,
        message: 'An unexpected error occurred while submitting for vetting'
      };
    }
  },
  
  /**
   * Check the vetting status of an announcement
   */
  async checkVettingStatus(announcementTitle: string): Promise<{
    status?: string;
    is_vetting_required?: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('announcement_vetting_status')
        .select('status, is_vetting_required')
        .eq('announcement_title', announcementTitle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking vetting status:', error);
        return { 
          error: `Error checking vetting status: ${error.message}` 
        };
      }
      
      if (!data) {
        return {
          error: 'No vetting record found for this announcement'
        };
      }
      
      return {
        status: data.status,
        is_vetting_required: data.is_vetting_required
      };
    } catch (err) {
      console.error('Unexpected error in checkVettingStatus:', err);
      return {
        error: 'An unexpected error occurred while checking vetting status'
      };
    }
  }
};

// Hook to easily access the vetting requirements
export function useVettingRequirements() {
  const [requirements, setRequirements] = useState<AnnouncementVettingRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true);
      const { data, error } = await announcementVettingService.getAllVettingRequirements();
      
      if (error) {
        setError(error);
        toast({
          title: "Error loading vetting requirements",
          description: error,
          variant: "destructive"
        });
      } else {
        setRequirements(data);
        setError(null);
      }
      
      setLoading(false);
    };
    
    fetchRequirements();
  }, []);
  
  return { requirements, loading, error };
}

import { useState, useEffect } from "react";

// Hook to check if an announcement needs vetting
export function useVettingCheck(headlineCategory?: string) {
  const [vettingRequired, setVettingRequired] = useState<boolean | null>(null);
  const [requirement, setRequirement] = useState<AnnouncementVettingRequirement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!headlineCategory) {
      setVettingRequired(null);
      setRequirement(null);
      return;
    }
    
    const checkVetting = async () => {
      setLoading(true);
      const result = await announcementVettingService.checkVettingRequired(headlineCategory);
      
      setVettingRequired(result.required);
      setRequirement(result.requirement || null);
      setError(result.error || null);
      setLoading(false);
    };
    
    checkVetting();
  }, [headlineCategory]);
  
  return { vettingRequired, requirement, loading, error };
}
