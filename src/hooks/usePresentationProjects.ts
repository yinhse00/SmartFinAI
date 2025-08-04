import { useState, useEffect } from 'react';
import { PresentationType } from '@/types/presentation';
import { useToast } from '@/hooks/use-toast';

export interface PresentationProject {
  id: string;
  title: string;
  type: PresentationType;
  description?: string;
  clientName?: string;
  slideCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const usePresentationProjects = () => {
  const [projects, setProjects] = useState<PresentationProject[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // For now, use localStorage. In production, this would be a Supabase query
      const stored = localStorage.getItem('presentation_projects');
      const projectData = stored ? JSON.parse(stored) : [];
      setProjects(projectData);
    } catch (error) {
      console.error('Error fetching presentation projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch presentation projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: {
    title: string;
    type: PresentationType;
    description?: string;
    clientName?: string;
  }): Promise<PresentationProject | null> => {
    try {
      const newProject: PresentationProject = {
        id: crypto.randomUUID(),
        ...projectData,
        slideCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentProjects = projects || [];
      const updatedProjects = [newProject, ...currentProjects];
      
      localStorage.setItem('presentation_projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      
      toast({
        title: "Success",
        description: "Presentation project created successfully"
      });

      return newProject;
    } catch (error) {
      console.error('Error creating presentation project:', error);
      toast({
        title: "Error",
        description: "Failed to create presentation project",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateProject = async (
    projectId: string, 
    updates: Partial<PresentationProject>
  ): Promise<boolean> => {
    try {
      const updatedProjects = projects?.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      ) || [];

      localStorage.setItem('presentation_projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);

      return true;
    } catch (error) {
      console.error('Error updating presentation project:', error);
      toast({
        title: "Error",
        description: "Failed to update presentation project",
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