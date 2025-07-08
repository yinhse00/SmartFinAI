import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, ExternalLink } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={activeTab === 'draft' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onTabChange('draft')}
      >
        <FileText className="h-4 w-4 mr-2" />
        Draft Content
      </Button>
      <Button 
        variant={activeTab === 'input' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onTabChange('input')}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Input & Generate
      </Button>
      <Button 
        variant={activeTab === 'sources' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onTabChange('sources')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Sources
      </Button>
    </div>
  );
};