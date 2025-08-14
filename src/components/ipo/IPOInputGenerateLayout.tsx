import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, 
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';

import { InputGenerateTab } from './drafting/InputGenerateTab';

interface IPOInputGenerateLayoutProps {
  projectId: string;
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  onContentGenerated: () => void;
}

const QUICK_SECTIONS = [
  { id: 'business', title: 'Business', icon: Building, description: 'Company description and core business' },
  { id: 'financial', title: 'Financial Information', icon: TrendingUp, description: 'Key financials and performance' }
];

export const IPOInputGenerateLayout: React.FC<IPOInputGenerateLayoutProps> = ({
  projectId,
  selectedSection,
  onSectionSelect,
  onContentGenerated
}) => {
  const [keyElements, setKeyElements] = useState<Record<string, any>>({});


  const {
    isGenerating,
    generatedContent,
    generateContent,
    clearContent
  } = useIPOContentGeneration();
  
  

  // Auto-switch to drafting layout when content is generated
  useEffect(() => {
    if (generatedContent && !isGenerating) {
      setTimeout(() => {
        onContentGenerated();
      }, 1500); // Small delay to show success state
    }
  }, [generatedContent, isGenerating, onContentGenerated]);

  const handleGenerateContent = async () => {
    console.log('🎯 IPOInputGenerateLayout: Generate button clicked');
    console.log('📋 Current form data:', keyElements);
    console.log('🎯 Selected section:', selectedSection);
    console.log('🏢 Project ID:', projectId);



    const request: IPOContentGenerationRequest = {
      project_id: projectId,
      section_type: selectedSection,
      key_elements: keyElements,
      industry_context: 'Hong Kong IPO',
      regulatory_requirements: ['HKEX Main Board', 'App1A Part A', 'Business-Financial Segment Alignment']
    };

    console.log('📤 Sending generation request:', request);
    const result = await generateContent(request);
    console.log('📥 Generation result:', result ? 'Success' : 'Failed');
  };


  const selectedSectionData = QUICK_SECTIONS.find(s => s.id === selectedSection) || QUICK_SECTIONS[0];

  return (
    <div className="h-full bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Content Generation</h2>
              <p className="text-muted-foreground">
                Configure and generate IPO prospectus content with AI assistance
              </p>
            </div>
            {generatedContent && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Content Ready
              </Badge>
            )}
          </div>
          
          {/* Quick Section Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Start:</span>
            {QUICK_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={selectedSection === section.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSectionSelect(section.id)}
                  className="h-8"
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {section.title}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="w-full p-4">
            {/* Streamlined layout without tabs */}

            <div className="mt-6">
              <InputGenerateTab
                projectId={projectId}
                sectionType={selectedSectionData.title}
                keyElements={keyElements}
                setKeyElements={setKeyElements}
                isGenerating={isGenerating}
                onGenerate={handleGenerateContent}
              />
            </div>

          </div>
        </ScrollArea>
      </div>
    </div>
  );
};