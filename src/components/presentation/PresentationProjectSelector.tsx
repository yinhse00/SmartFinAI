import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreatePresentationDialog } from './CreatePresentationDialog';
import { usePresentationProjects } from '@/hooks/usePresentationProjects';
import { PresentationType } from '@/types/presentation';
import { Plus, Presentation, FileText, Users, Building, Calendar } from 'lucide-react';

interface PresentationProjectSelectorProps {
  onProjectSelect: (projectId: string, type: PresentationType) => void;
}

export const PresentationProjectSelector: React.FC<PresentationProjectSelectorProps> = ({
  onProjectSelect
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { projects, isLoading, createProject } = usePresentationProjects();

  const handleCreateProject = async (projectData: {
    title: string;
    type: PresentationType;
    description?: string;
    clientName?: string;
  }) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      onProjectSelect(newProject.id, newProject.type);
    }
  };

  const getPresentationTypeIcon = (type: PresentationType) => {
    switch (type) {
      case 'ipo_roadshow':
        return <Building className="h-4 w-4" />;
      case 'investment_banking_pitch':
        return <FileText className="h-4 w-4" />;
      case 'deal_structuring':
        return <Users className="h-4 w-4" />;
      default:
        return <Presentation className="h-4 w-4" />;
    }
  };

  const getPresentationTypeLabel = (type: PresentationType) => {
    switch (type) {
      case 'ipo_roadshow':
        return 'IPO Roadshow';
      case 'investment_banking_pitch':
        return 'IB Pitch';
      case 'deal_structuring':
        return 'Deal Structuring';
      case 'custom':
        return 'Custom';
      default:
        return 'Presentation';
    }
  };

  const getPresentationTypeColor = (type: PresentationType) => {
    switch (type) {
      case 'ipo_roadshow':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'investment_banking_pitch':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'deal_structuring':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Presentation Card */}
        <Card 
          className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer group"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Create New Presentation</h3>
            <p className="text-sm text-muted-foreground">
              Start a new presentation or pitch book
            </p>
          </CardContent>
        </Card>

        {/* Existing Projects */}
        {projects?.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProjectSelect(project.id, project.type)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getPresentationTypeIcon(project.type)}
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </div>
                <Badge className={getPresentationTypeColor(project.type)}>
                  {getPresentationTypeLabel(project.type)}
                </Badge>
              </div>
              {project.clientName && (
                <CardDescription>Client: {project.clientName}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Presentation className="h-3 w-3" />
                    {project.slideCount || 0} slides
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreatePresentationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </>
  );
};
