import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IPOProject } from '@/types/ipo';
import { Building, Calendar, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectSelectorProps {
  projects: IPOProject[];
  onSelectProject: (projectId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  onSelectProject
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'review': return 'secondary';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectProject(project.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{project.company_name}</CardTitle>
              </div>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Folder className="h-4 w-4" />
                {project.project_name}
              </div>
              
              {project.industry && (
                <div className="text-sm">
                  <span className="font-medium">Industry:</span> {project.industry}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Updated {formatDistanceToNow(new Date(project.updated_at))} ago
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Open Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};