import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  MessageSquare, 
  Layout, 
  Edit3, 
  Code,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Presentation } from '@/types/presentation';

interface PresentationHeaderProps {
  presentation: Presentation;
  onSave: () => void;
  onExport: (format: 'pptx' | 'pdf') => void;
  onBack?: () => void;
  onToggleChat: () => void;
  onToggleTemplates: () => void;
  isChatOpen: boolean;
  editMode: 'visual' | 'code';
  onEditModeChange: (mode: 'visual' | 'code') => void;
}

export const PresentationHeader: React.FC<PresentationHeaderProps> = ({
  presentation,
  onSave,
  onExport,
  onBack,
  onToggleChat,
  onToggleTemplates,
  isChatOpen,
  editMode,
  onEditModeChange
}) => {
  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">{presentation.title}</h1>
            <p className="text-sm text-muted-foreground">
              {presentation.slides.length} slides • {presentation.metadata.companyName || 'Presentation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Edit Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={editMode === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onEditModeChange('visual')}
              className="h-7 px-3"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Visual
            </Button>
            <Button
              variant={editMode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onEditModeChange('code')}
              className="h-7 px-3"
            >
              <Code className="h-3 w-3 mr-1" />
              Code
            </Button>
          </div>

          {/* Template Library */}
          <Button variant="outline" size="sm" onClick={onToggleTemplates}>
            <Layout className="h-4 w-4 mr-2" />
            Templates
          </Button>

          {/* AI Chat Toggle */}
          <Button 
            variant={isChatOpen ? 'default' : 'outline'} 
            size="sm" 
            onClick={onToggleChat}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>

          {/* Save */}
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('pptx')}>
                Export as PowerPoint (.pptx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                Export as PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};