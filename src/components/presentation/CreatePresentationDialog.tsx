import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PresentationType } from '@/types/presentation';
import { Building, FileText, Users, Presentation } from 'lucide-react';

interface CreatePresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: {
    title: string;
    type: PresentationType;
    description?: string;
    clientName?: string;
  }) => void;
}

export const CreatePresentationDialog: React.FC<CreatePresentationDialogProps> = ({
  open,
  onOpenChange,
  onCreateProject
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PresentationType>('investment_banking_pitch');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      clientName: clientName.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setType('investment_banking_pitch');
    setDescription('');
    setClientName('');
    onOpenChange(false);
  };

  const presentationTypes = [
    {
      value: 'investment_banking_pitch' as PresentationType,
      label: 'Investment Banking Pitch',
      description: 'General investment banking pitch books and client presentations',
      icon: <FileText className="h-4 w-4" />
    },
    {
      value: 'ipo_roadshow' as PresentationType,
      label: 'IPO Roadshow',
      description: 'IPO roadshow presentations and investor materials',
      icon: <Building className="h-4 w-4" />
    },
    {
      value: 'deal_structuring' as PresentationType,
      label: 'Deal Structuring',
      description: 'Transaction-specific pitch materials and deal presentations',
      icon: <Users className="h-4 w-4" />
    },
    {
      value: 'custom' as PresentationType,
      label: 'Custom Presentation',
      description: 'Custom presentation with flexible structure',
      icon: <Presentation className="h-4 w-4" />
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Presentation</DialogTitle>
          <DialogDescription>
            Create a new presentation or pitch book for your clients
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Presentation Title</Label>
            <Input
              id="title"
              placeholder="e.g., ABC Corp IPO Roadshow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Presentation Type</Label>
            <Select value={type} onValueChange={(value: PresentationType) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select presentation type" />
              </SelectTrigger>
              <SelectContent>
                {presentationTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client Name (Optional)</Label>
            <Input
              id="client"
              placeholder="e.g., ABC Corporation"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the presentation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Presentation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};