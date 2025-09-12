import React, { useState } from 'react';
import { WordLikeWorkspace } from './word-like/WordLikeWorkspace';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOProject } from '@/types/ipo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3, FileText } from 'lucide-react';
import { IPOInputGenerateLayout } from './IPOInputGenerateLayout';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documents/documentService';
import { ipoContentGenerationService } from '@/services/ipo/ipoContentGenerationService';
import { getIPOSectionTitle } from '@/constants/ipoSections';

interface IPOProspectusWorkspaceProps {
  project: IPOProject;
  onSwitchProject: () => void;
}

type LayoutMode = 'input-generate' | 'drafting';

export const IPOProspectusWorkspace: React.FC<IPOProspectusWorkspaceProps> = ({
  project,
  onSwitchProject
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('business');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('input-generate');
  const { toast } = useToast();

  const {
    generatedContent,
    lastGeneratedResponse,
    setGeneratedContent,
  } = useIPOContentGeneration();

  const handleContentGenerated = () => {
    setLayoutMode('drafting');
  };

  const handleSave = async () => {
    if (!generatedContent.trim() || !project.id || !selectedSection) return;

    try {
      const response = {
        content: generatedContent,
        sources: lastGeneratedResponse?.sources || [],
        confidence_score: lastGeneratedResponse?.confidence_score || 0.8,
        regulatory_compliance: lastGeneratedResponse?.regulatory_compliance || {
          requirements_met: [],
          missing_requirements: [],
          recommendations: []
        },
        quality_metrics: lastGeneratedResponse?.quality_metrics || {
          completeness: 0.8,
          accuracy: 0.8,
          regulatory_alignment: 0.8,
          professional_language: 0.8
        }
      };

      await ipoContentGenerationService.saveSectionContent(project.id, selectedSection, response);
      toast({
        title: "Saved",
        description: "Content saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save content",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => {
    if (!generatedContent?.trim()) {
      toast({
        title: "No Content",
        description: "Please generate content before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sectionTitle = getIPOSectionTitle(selectedSection);
      const filename = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      
      let blob: Blob;
      let fileExtension: string;

      switch (format) {
        case 'word':
          blob = await documentService.generateWordDocument(generatedContent, sectionTitle);
          fileExtension = 'doc';
          break;
        case 'pdf':
          blob = await documentService.generatePdfDocument(generatedContent, sectionTitle);
          fileExtension = 'pdf';
          break;
        case 'excel':
          blob = await documentService.generateExcelDocument(generatedContent, sectionTitle);
          fileExtension = 'csv';
          break;
        case 'powerpoint':
          blob = await documentService.generatePowerPointDocument(generatedContent, sectionTitle);
          fileExtension = 'pptx';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${sectionTitle} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onSwitchProject}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Projects
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{project.company_name}</h1>
              <p className="text-sm text-muted-foreground">{project.project_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Layout Switcher */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button 
                variant={layoutMode === 'input-generate' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setLayoutMode('input-generate')} 
                className="h-7 px-3"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Input & Generate
              </Button>
              <Button 
                variant={layoutMode === 'drafting' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setLayoutMode('drafting')} 
                className="h-7 px-3"
              >
                <FileText className="h-3 w-3 mr-1" />
                Draft & Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        {layoutMode === 'input-generate' ? (
          <IPOInputGenerateLayout 
            projectId={project.id} 
            selectedSection={selectedSection} 
            onSectionSelect={setSelectedSection} 
            onContentGenerated={handleContentGenerated} 
          />
        ) : (
          <WordLikeWorkspace
            projectId={project.id}
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
            content={generatedContent}
            onContentChange={setGeneratedContent}
            onSave={handleSave}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
};