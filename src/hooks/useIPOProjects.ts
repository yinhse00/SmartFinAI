import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IPOProject } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

export const useIPOProjects = () => {
  const [projects, setProjects] = useState<IPOProject[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('ipo_prospectus_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching IPO projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch IPO projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: {
    company_name: string;
    project_name: string;
    industry?: string;
  }): Promise<IPOProject | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ipo_prospectus_projects')
        .insert({
          ...projectData,
          user_id: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev ? [data, ...prev] : [data]);
      
      toast({
        title: "Success",
        description: "IPO project created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating IPO project:', error);
      toast({
        title: "Error",
        description: "Failed to create IPO project",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateProject = async (
    projectId: string, 
    updates: Partial<IPOProject>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ipo_prospectus_projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => 
        prev?.map(project => 
          project.id === projectId 
            ? { ...project, ...updates }
            : project
        ) || null
      );

      return true;
    } catch (error) {
      console.error('Error updating IPO project:', error);
      toast({
        title: "Error",
        description: "Failed to update IPO project",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    fetchProjects
  };
};