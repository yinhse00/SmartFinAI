import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { executionProjectService } from '@/services/execution/executionProjectService';
import { ExecutionPlan } from '@/services/execution/executionPlanExtractor';

interface SaveProjectDialogProps {
  executionPlan: ExecutionPlan;
  transactionType: string;
  onProjectSaved?: (projectId: string) => void;
}

export const SaveProjectDialog = ({ executionPlan, transactionType, onProjectSaved }: SaveProjectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const project = await executionProjectService.createProject(
        name.trim(),
        description.trim(),
        transactionType,
        executionPlan
      );

      toast({
        title: "Project Saved",
        description: `Project "${name}" has been saved successfully.`
      });

      setIsOpen(false);
      setName('');
      setDescription('');
      onProjectSaved?.(project.id);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Save Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Execution Project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              maxLength={100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="grid gap-2">
            <Label>Transaction Type</Label>
            <Input value={transactionType} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Plan Summary</Label>
            <div className="text-sm text-muted-foreground">
              {executionPlan.tasks.length} tasks, {executionPlan.totalEstimatedDays} estimated days
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};