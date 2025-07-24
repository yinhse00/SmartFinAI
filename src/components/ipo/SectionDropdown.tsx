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

const ALL_SECTIONS = [
  { id: 'overview', title: 'Business Overview' },
  { id: 'history', title: 'History & Development' },
  { id: 'products', title: 'Products & Services' },
  { id: 'strengths', title: 'Competitive Strengths' },
  { id: 'strategy', title: 'Business Strategy' },
  { id: 'summary', title: 'Financial Summary' },
  { id: 'statements', title: 'Financial Statements' },
  { id: 'analysis', title: 'Management Analysis' },
  { id: 'business_risks', title: 'Business Risks' },
  { id: 'financial_risks', title: 'Financial Risks' },
  { id: 'regulatory_risks', title: 'Regulatory Risks' },
  { id: 'board', title: 'Board of Directors' },
  { id: 'management', title: 'Senior Management' },
  { id: 'governance', title: 'Corporate Governance' },
  { id: 'industry_regulation', title: 'Industry Regulation' },
  { id: 'compliance', title: 'Compliance Framework' },
  { id: 'use_of_proceeds', title: 'Use of Proceeds' },
  { id: 'future_outlook', title: 'Future Outlook' }
];

export const SectionDropdown: React.FC<SectionDropdownProps> = ({
  selectedSection,
  onSelectSection
}) => {
  const currentSection = ALL_SECTIONS.find(s => s.id === selectedSection);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          {currentSection?.title || 'Select Section'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px] max-h-[400px] overflow-y-auto">
        {ALL_SECTIONS.map((section) => (
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