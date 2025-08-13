import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Sparkles, Loader2 } from 'lucide-react';
import { useSectionGuidance } from '@/hooks/useSectionGuidance';
import { SupportingDocumentsUploader } from './SupportingDocumentsUploader';

interface KeyElements {
  [key: string]: any;
}

interface InputGenerateTabProps {
  projectId: string;
  sectionType: string;
  keyElements: KeyElements;
  setKeyElements: (elements: KeyElements) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onUploadDD?: () => void;
  onDDDocumentsChange?: (ids: string[]) => void;
}

export const InputGenerateTab: React.FC<InputGenerateTabProps> = ({
  projectId,
  sectionType,
  keyElements,
  setKeyElements,
  isGenerating,
  onGenerate,
  onUploadDD,
  onDDDocumentsChange
}) => {
  const { data: guidance, fields, loading } = useSectionGuidance(sectionType);

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Key Elements Input */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {sectionType} Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {guidance?.guidance || guidance?.contents ? (
              <div className="rounded-md border p-3 bg-muted/40">
                <div className="text-xs text-muted-foreground">
                  {guidance.guidance || guidance.contents}
                </div>
              </div>
            ) : null}

            {fields.map((f) => (
              <div key={f.id}>
                <label className="text-sm font-medium mb-2 block">
                  {f.label} {f.required ? <span className="text-destructive">*</span> : null}
                </label>
                {f.type === 'textarea' ? (
                  <Textarea
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    value={keyElements[f.id] || ''}
                    onChange={(e) => setKeyElements({
                      ...keyElements,
                      [f.id]: e.target.value
                    })}
                    rows={3}
                  />
                ) : (
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    value={keyElements[f.id] || ''}
                    onChange={(e) => setKeyElements({
                      ...keyElements,
                      [f.id]: e.target.value
                    })}
                  />
                )}
              </div>
            ))}

            <Button 
              className="w-full" 
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate First Draft'}
            </Button>
          </CardContent>
        </Card>

        {/* Supporting Documents Upload */}
        <SupportingDocumentsUploader
          projectId={projectId}
          sectionType={sectionType}
          onChange={onDDDocumentsChange}
        />
      </div>
    </div>
  );
};