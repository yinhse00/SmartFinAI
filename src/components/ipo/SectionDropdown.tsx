import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface SectionDropdownProps {
  selectedSection: string;
  onSelectSection: (section: string) => void;
}

import { IPO_SECTIONS } from '@/constants/ipoSections';

export const SectionDropdown: React.FC<SectionDropdownProps> = ({
  selectedSection,
  onSelectSection
}) => {
  const currentSection = IPO_SECTIONS.find(s => s.id === selectedSection);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          {currentSection?.title || 'Select Section'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px] max-h-[400px] overflow-y-auto">
        {IPO_SECTIONS.map((section) => (
          <DropdownMenuItem
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={selectedSection === section.id ? 'bg-primary/10' : ''}
          >
            {section.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};