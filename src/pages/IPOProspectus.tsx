import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { IPOProspectusWorkspace } from '@/components/ipo/IPOProspectusWorkspace';
import { ProjectSelector } from '@/components/ipo/ProjectSelector';
import { CreateProjectDialog } from '@/components/ipo/CreateProjectDialog';
import { useIPOProjects } from '@/hooks/useIPOProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IPOProspectus = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { projects, isLoading, createProject } = useIPOProjects();

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const handleCreateProject = async (projectData: {
    company_name: string;
    project_name: string;
    industry?: string;
  }) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      setSelectedProjectId(newProject.id);
      setIsCreateDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading IPO projects...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!selectedProject) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">IPO Prospectus Drafting</h1>
            <p className="text-muted-foreground">
              Create and manage high-quality IPO prospectus documents with AI assistance
            </p>
          </div>

          {projects && projects.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Project</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
              <ProjectSelector
                projects={projects}
                onSelectProject={setSelectedProjectId}
              />
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  Welcome to IPO Prospectus Drafting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Start by creating your first IPO prospectus project
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          )}

          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onCreateProject={handleCreateProject}
          />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <IPOProspectusWorkspace
        project={selectedProject}
        onSwitchProject={() => setSelectedProjectId(null)}
      />
    </SidebarLayout>
  );
};

export default IPOProspectus;