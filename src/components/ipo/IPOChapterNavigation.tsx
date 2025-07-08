import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Building, 
  DollarSign, 
  AlertTriangle, 
  Users, 
  Scale,
  TrendingUp,
  Shield,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IPOChapterNavigationProps {
  projectId: string;
  selectedSection: string;
  onSelectSection: (section: string) => void;
}

const PROSPECTUS_CHAPTERS = [
  {
    id: 'business',
    title: 'Business',
    icon: Building,
    sections: [
      { id: 'overview', title: 'Business Overview', status: 'draft' },
      { id: 'history', title: 'History & Development', status: 'pending' },
      { id: 'products', title: 'Products & Services', status: 'pending' },
      { id: 'strengths', title: 'Competitive Strengths', status: 'pending' },
      { id: 'strategy', title: 'Business Strategy', status: 'pending' }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Information',
    icon: DollarSign,
    sections: [
      { id: 'summary', title: 'Financial Summary', status: 'pending' },
      { id: 'statements', title: 'Financial Statements', status: 'pending' },
      { id: 'analysis', title: 'Management Analysis', status: 'pending' }
    ]
  },
  {
    id: 'risk_factors',
    title: 'Risk Factors',
    icon: AlertTriangle,
    sections: [
      { id: 'business_risks', title: 'Business Risks', status: 'pending' },
      { id: 'financial_risks', title: 'Financial Risks', status: 'pending' },
      { id: 'regulatory_risks', title: 'Regulatory Risks', status: 'pending' }
    ]
  },
  {
    id: 'directors',
    title: 'Directors & Management',
    icon: Users,
    sections: [
      { id: 'board', title: 'Board of Directors', status: 'pending' },
      { id: 'management', title: 'Senior Management', status: 'pending' },
      { id: 'governance', title: 'Corporate Governance', status: 'pending' }
    ]
  },
  {
    id: 'regulatory',
    title: 'Regulatory Overview',
    icon: Scale,
    sections: [
      { id: 'industry_regulation', title: 'Industry Regulation', status: 'pending' },
      { id: 'compliance', title: 'Compliance Framework', status: 'pending' }
    ]
  },
  {
    id: 'future_plans',
    title: 'Future Plans & Prospects',
    icon: TrendingUp,
    sections: [
      { id: 'use_of_proceeds', title: 'Use of Proceeds', status: 'pending' },
      { id: 'future_outlook', title: 'Future Outlook', status: 'pending' }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'draft': return 'bg-yellow-500';
    case 'review': return 'bg-blue-500';
    case 'pending': return 'bg-gray-300';
    default: return 'bg-gray-300';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default';
    case 'draft': return 'secondary';
    case 'review': return 'outline';
    case 'pending': return 'secondary';
    default: return 'secondary';
  }
};

export const IPOChapterNavigation: React.FC<IPOChapterNavigationProps> = ({
  projectId,
  selectedSection,
  onSelectSection
}) => {
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['business']);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  return (
    <Card className="h-full rounded-none border-0 border-r">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prospectus Sections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-2 p-4">
            {PROSPECTUS_CHAPTERS.map((chapter) => {
              const isExpanded = expandedChapters.includes(chapter.id);
              const Icon = chapter.icon;
              
              return (
                <div key={chapter.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 h-auto",
                      isExpanded && "bg-muted"
                    )}
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <span className="text-sm font-medium truncate">{chapter.title}</span>
                  </Button>
                  
                  {isExpanded && (
                    <div className="space-y-1 pl-4 border-l-2 border-muted ml-5">
                      {chapter.sections.map((section) => (
                        <Button
                          key={section.id}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start p-2 h-auto text-left",
                            selectedSection === section.id && "bg-primary/10 text-primary"
                          )}
                          onClick={() => onSelectSection(section.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getStatusColor(section.status)
                              )} />
                              <span className="text-xs truncate">{section.title}</span>
                            </div>
                            <Badge 
                              variant={getStatusBadgeVariant(section.status)}
                              className="text-xs px-1 py-0"
                            >
                              {section.status}
                            </Badge>
                          </div>
                        </Button>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start p-2 h-auto text-muted-foreground"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        <span className="text-xs">Add Section</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};