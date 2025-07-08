import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, MessageSquare } from 'lucide-react';

interface DraftingHeaderProps {
  sectionTitle: string;
  isChatOpen: boolean;
  onToggleChat: () => void;
  layoutMode?: 'drafting' | 'tab';
}

export const DraftingHeader: React.FC<DraftingHeaderProps> = ({
  sectionTitle,
  isChatOpen,
  onToggleChat,
  layoutMode = 'drafting'
}) => {
  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{sectionTitle}</h2>
          <p className="text-sm text-muted-foreground">
            App1A Part A - {sectionTitle} content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Draft</Badge>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {layoutMode === 'drafting' && (
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleChat}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isChatOpen ? 'Hide' : 'Show'} AI Chat
          </Button>
        </div>
      </div>
    </div>
  );
};