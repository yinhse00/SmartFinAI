import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { executionProjectService, ExecutionProject, ExecutionProjectWithPlan } from '@/services/execution/executionProjectService';
import { ExecutionPlan } from '@/services/execution/executionPlanExtractor';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProjectSelectorProps {
  onProjectSelected?: (project: ExecutionProjectWithPlan) => void;
  currentProjectId?: string;
}

export const ProjectSelector = ({ onProjectSelected, currentProjectId }: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<ExecutionProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProjectId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const userProjects = await executionProjectService.getUserProjects();
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load saved projects.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    if (!projectId) return;

    try {
      const projectWithPlan = await executionProjectService.getProjectWithPlan(projectId);
      if (projectWithPlan) {
        setSelectedProjectId(projectId);
        onProjectSelected?.(projectWithPlan);
        toast({
          title: "Project Loaded",
          description: `Loaded project "${projectWithPlan.name}"`
        });
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load selected project.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(projectId);
    try {
      await executionProjectService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId('');
      }
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete project.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Saved Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Saved Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No saved projects yet. Create an execution plan and save it as a project.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Saved Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a saved project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {project.transaction_type} • {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {projects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Projects</h4>
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{project.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {project.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProjectSelect(project.id)}
                    disabled={selectedProjectId === project.id}
                  >
                    Load
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting === project.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};